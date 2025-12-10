"use client"

import { useState, useRef, useEffect } from "react"
import { useCADStore, type Feature } from "../../../../lib/cad/store"

interface ChatMessage {
  role: string
  content: string
}

export function useChat(projectId: string) {
  const {
    projects,
    editor,
    addFeature,
    deleteFeature,
    setIsGenerating,
  } = useCADStore()

  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [featureCounter, setFeatureCounter] = useState(1)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const project = projects.find(p => p.id === projectId)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update feature counter based on existing features
  useEffect(() => {
    if (project?.features) {
      const maxId = project.features.reduce((max, f) => {
        const match = f.id.match(/feat_(\d+)/)
        if (match) {
          return Math.max(max, parseInt(match[1]))
        }
        return max
      }, 0)
      setFeatureCounter(maxId + 1)
    }
  }, [project?.features])

  const sendMessage = async () => {
    if (!chatInput.trim() || editor.isGenerating) return

    const userMessage = chatInput.trim()
    setChatInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsGenerating(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: messages.filter(m => m.role !== 'system').slice(-4).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      // Check if response is ok before parsing
      if (!response.ok) {
        const text = await response.text()
        console.error('API error response:', response.status, text.substring(0, 200))
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `API Error (${response.status}): The chat endpoint is not available. Make sure the API route exists at /api/chat.` 
        }])
        return
      }

      // Check content type
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', contentType, text.substring(0, 200))
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Error: API returned non-JSON response. Check if the API route is configured correctly.' 
        }])
        return
      }

      const data = await response.json()
      console.log('API Response:', data)

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.details || data.error}` }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        console.log('Patches received:', data.patches)

        if (data.patches && data.patches.length > 0 && project) {
          // Get fresh state from store
          const currentProjects = useCADStore.getState().projects
          const currentProject = currentProjects.find(p => p.id === projectId)
          if (!currentProject) return

          // Separate patches by type
          const deletions = data.patches.filter((p: any) => p.action === 'DELETE')
          const booleans = data.patches.filter((p: any) => {
            const primitive = p.content?.primitive || p.content?.type
            return primitive === 'union' || primitive === 'subtract' || primitive === 'intersect'
          })
          const regularOps = data.patches.filter((p: any) => {
            const primitive = p.content?.primitive || p.content?.type
            return p.action !== 'DELETE' && !['union', 'subtract', 'intersect'].includes(primitive)
          })

          console.log('Deletions:', deletions.length, 'Booleans:', booleans.length, 'Regular:', regularOps.length)

          // First pass: handle DELETEs
          deletions.forEach((patch: any) => {
            console.log('Deleting feature:', patch.feature_id)
            deleteFeature(projectId, patch.feature_id)
          })

          // Calculate counter from fresh state
          const freshProject = useCADStore.getState().projects.find(p => p.id === projectId)
          if (!freshProject) return

          const existingIds = freshProject.features.map(f => {
            const match = f.id.match(/feat_(\d+)/)
            return match ? parseInt(match[1]) : 0
          })
          const maxExistingId = existingIds.length > 0 ? Math.max(...existingIds) : 0
          let counter = Math.max(featureCounter, maxExistingId + 1)

          console.log('Starting counter:', counter, 'Features:', freshProject.features.length)

          // Second pass: handle regular primitives
          regularOps.forEach((patch: any) => {
            if (patch.action === 'INSERT') {
              const featureId = `feat_${String(counter).padStart(3, '0')}`
              console.log('Inserting feature:', featureId)

              const feature: Feature = {
                id: featureId,
                name: `${patch.content.primitive || 'Shape'} ${featureId.split('_')[1] || ''}`,
                type: 'primitive',
                visible: true,
                locked: false,
                suppressed: false,
                patch: {
                  feature_id: featureId,
                  action: 'INSERT',
                  content: patch.content
                }
              }
              addFeature(projectId, feature)
              counter++
            } else if (patch.action === 'REPLACE') {
              const featureId = patch.feature_id
              const existingFeature = freshProject.features.find(f => f.id === featureId)

              if (existingFeature) {
                deleteFeature(projectId, featureId)
              }

              const feature: Feature = {
                id: featureId,
                name: `${patch.content.primitive || 'Shape'} ${featureId.split('_')[1] || ''}`,
                type: 'primitive',
                visible: true,
                locked: false,
                suppressed: false,
                patch: {
                  feature_id: featureId,
                  action: 'INSERT',
                  content: patch.content
                }
              }
              addFeature(projectId, feature)
            }
          })

          // Third pass: handle boolean operations
          // Get FRESH project again after all primitives are added
          const projectAfterPrimitives = useCADStore.getState().projects.find(p => p.id === projectId)
          if (!projectAfterPrimitives) return

          booleans.forEach((patch: any) => {
            const primitive = patch.content.primitive || patch.content.type
            const targetId = patch.content.target_id
            const toolId = patch.content.tool_id

            console.log(`Processing boolean: ${primitive} - target: ${targetId}, tool: ${toolId}`)

            // Verify both features exist
            const targetExists = projectAfterPrimitives.features.find(f => f.id === targetId)
            const toolExists = projectAfterPrimitives.features.find(f => f.id === toolId)

            if (!targetExists || !toolExists) {
              console.error(`Boolean operation failed - target exists: ${!!targetExists}, tool exists: ${!!toolExists}`)
              return
            }

            // Create the boolean feature
            const featureId = `feat_${String(counter).padStart(3, '0')}`
            console.log('Creating boolean feature:', featureId)

            const feature: Feature = {
              id: featureId,
              name: `${primitive} ${featureId.split('_')[1] || ''}`,
              type: 'group',
              visible: true,
              locked: false,
              suppressed: false,
              patch: {
                feature_id: featureId,
                action: 'INSERT',
                content: patch.content
              }
            }
            addFeature(projectId, feature)
            counter++
          })

          console.log('Final counter:', counter)
          setFeatureCounter(counter)
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to AI service. Please try again.' }])
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    chatInput,
    setChatInput,
    messages,
    chatEndRef,
    sendMessage,
    isGenerating: editor.isGenerating,
  }
}
