"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { ScrollArea } from "../components/ui/scroll-area"
import { Badge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../components/ui/sheet"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { AppSidebar } from "../components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar"
import {
  Send,
  User,
  RefreshCw,
  Search,
  Boxes,
  FileText,
  Plus,
  Upload,
  PenTool,
  Brain,
  Zap,
  Loader2,
  AlertCircle,
  Sparkles,
  Users,
  Calendar,
  BarChart3,
  Box,
  Layers
} from "lucide-react"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  class_id?: string
  tools_used?: string[]
  error?: boolean
}

interface DesignProject {
  id: string
  name: string
  project_code: string
  category: string
  description: string
  color_theme: string
  component_count: number
  last_activity: string
}

// Simple typing indicator component
function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          <div className="w-1 h-1 rounded-full bg-blue-200"></div>
        </div>
      </div>

      <div className="max-w-4xl mr-8 md:mr-16">
        <div className="bg-slate-50 text-slate-900 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-sm text-slate-600">Generating your 3D design...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CADDesignHome() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<DesignProject[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const landingInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Initialize with empty projects - users will create their own
  useEffect(() => {
    setProjects([])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (message?: string, fromLanding?: boolean) => {
    const inputElement = fromLanding ? landingInputRef.current : chatInputRef.current
    const messageToSend = message || (inputElement?.value?.trim() || "")
    if (!messageToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      class_id: selectedProjectId || undefined
    }

    setMessages(prev => [...prev, userMessage])
    if (inputElement) inputElement.value = ""
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Generate AI response
      const aiResponseData = await generateAIResponse(messageToSend)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseData.response,
        timestamp: new Date(),
        class_id: selectedProjectId || undefined,
        tools_used: aiResponseData.tools_used
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Message handling error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. This could be due to a temporary service issue. Please try again in a moment.",
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const generateAIResponse = async (input: string): Promise<{ response: string, tools_used?: string[] }> => {
    try {
      const conversationHistory = messages
        .filter(m => !m.error)
        .map(m => ({
          role: m.role,
          content: m.content,
          class_id: m.class_id,
          ...(m.tools_used && { tools_used: m.tools_used })
        }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          class_id: selectedProjectId,
          conversation_history: conversationHistory.slice(-10)
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.response) {
        return {
          response: data.response,
          tools_used: data.tools_used || []
        }
      } else {
        throw new Error('No valid response generated')
      }

    } catch (error) {
      console.error('AI Response Error:', error)
      const selectedProject = projects.find(p => p.id === selectedProjectId)
      const projectName = selectedProject ? selectedProject.name : "your design"

      return {
        response: `I understand you're asking about "${input}" for ${projectName}. I can help you generate 3D shapes, modify designs, and create CAD components based on your description. Try describing a shape like "Create a cube 50mm wide" or "Add a cylinder with radius 10mm".`,
        tools_used: []
      }
    }
  }

  const clearConversation = () => {
    setMessages([])
  }

  const createProject = (projectData: { name: string; project_code: string; category: string; description: string; color_theme: string }) => {
    const newProject: DesignProject = {
      id: Date.now().toString(),
      name: projectData.name,
      project_code: projectData.project_code,
      category: projectData.category,
      description: projectData.description,
      color_theme: projectData.color_theme,
      component_count: 0,
      last_activity: "Just created"
    }
    setProjects(prev => [...prev, newProject])
    setShowCreateProjectModal(false)
  }

  const uploadDesignFile = async (projectId: string, file: File) => {
    try {
      setIsLoading(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_type', 'cad_reference')

      const response = await fetch(`http://localhost:8001/projects/${projectId}/files`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Upload failed: ${response.status}`)
      }

      const result = await response.json()

      // Update the project component count
      setProjects(prev => prev.map(proj =>
        proj.id === projectId
          ? { ...proj, component_count: proj.component_count + 1, last_activity: "Just now" }
          : proj
      ))

      setShowUploadModal(false)

      // Show success message or notification here if needed
      console.log('✅ Design file uploaded successfully:', result)

    } catch (error) {
      console.error('❌ Design file upload failed:', error)
      // You could add a toast notification here for better UX
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (example: string) => {
    handleSubmit(example)
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setMessages([]) // Clear messages when switching projects
  }

  // Landing page when no messages
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center px-6 font-merriweather">
      <div className="w-full max-w-6xl mx-auto">

        {/* Main Heading */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <PenTool className="w-12 h-12 text-teal-600" />
            <h1 className="text-4xl md:text-5xl playfair-bold text-slate-900 leading-tight">
              Design with AI
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Describe your ideas in natural language and watch them become 3D CAD models. Our AI generates precise, parametric designs from simple descriptions.
          </p>
        </div>

        {/* Project Selection */}
        {projects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl playfair-semibold text-slate-900">Your Projects</h2>
              <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                {projects.length} Active
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedProjectId === project.id
                      ? 'ring-2 ring-teal-500 bg-teal-50'
                      : 'hover:border-slate-300'
                  }`}
                  onClick={() => handleProjectSelect(project.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color_theme }}
                          />
                          <span className="text-sm font-medium text-slate-600">
                            {project.project_code}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 leading-tight">
                          {project.name}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {project.category}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>{project.component_count} components</span>
                      <span>{project.last_activity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-teal-300 focus-within:shadow-md p-5">
              {/* Project context indicator */}
              {selectedProjectId && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                  <Boxes className="w-4 h-4 text-teal-600" />
                  <span className="text-sm text-slate-600">
                    Designing for: <span className="font-medium text-slate-900">
                      {projects.find(p => p.id === selectedProjectId)?.name || "Selected Project"}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProjectId(null)}
                    className="ml-auto text-slate-400 hover:text-slate-600 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              )}

              {/* Main input row */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    ref={landingInputRef}
                    type="text"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(undefined, true)
                      }
                    }}
                    placeholder={
                      selectedProjectId
                        ? "Describe the shape you want to create..."
                        : "Select a project and describe your 3D design..."
                    }
                    className="w-full text-lg border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-slate-400"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleSubmit(undefined, true)
                  }}
                  className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl px-5 py-2.5 transition-colors flex-shrink-0"
                  disabled={isLoading || !selectedProjectId}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm h-8 px-3 rounded-lg"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Reference
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm h-8 px-3 rounded-lg"
                    onClick={() => setShowCreateProjectModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </div>
                <div className="text-xs text-slate-600">
                  {selectedProjectId ? "Press Enter to generate" : "Select a project first"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CAD Tools Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl playfair-semibold text-slate-900">AI Design Tools</h2>
            <Badge variant="secondary" className="bg-teal-100 text-teal-700">
              Generative CAD
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Shape Generation */}
            <div
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => selectedProjectId && handleExampleClick("Create a cube 50mm on each side")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors flex-shrink-0">
                  <Box className="w-5 h-5 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="playfair-regular text-slate-900 mb-2">Shape Generation</h3>
                  <p className="text-slate-600 text-sm leading-relaxed merriweather-light">
                    Create cubes, cylinders, spheres, and complex shapes from natural language descriptions
                  </p>
                </div>
              </div>
            </div>

            {/* Design Modification */}
            <div
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => selectedProjectId && handleExampleClick("Add a fillet to all edges with 2mm radius")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center group-hover:bg-cyan-200 transition-colors flex-shrink-0">
                  <Zap className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="playfair-regular text-slate-900 mb-2">Design Modification</h3>
                  <p className="text-slate-600 text-sm leading-relaxed merriweather-light">
                    Add fillets, chamfers, extrusions and modify existing shapes with simple commands
                  </p>
                </div>
              </div>
            </div>

            {/* Assembly Creation */}
            <div
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => selectedProjectId && handleExampleClick("Create a simple table with 4 legs")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors flex-shrink-0">
                  <Layers className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="playfair-regular text-slate-900 mb-2">Assembly Creation</h3>
                  <p className="text-slate-600 text-sm leading-relaxed merriweather-light">
                    Combine multiple primitives into complex assemblies and parametric models
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowCreateProjectModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Design Project
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import Reference
            </Button>
          </div>
          <p className="text-sm text-slate-500">AI-Powered Generative CAD • Natural Language to 3D</p>
        </div>
      </div>
    </div>
  )

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <PenTool className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-lg playfair-semibold text-slate-900">
                  {selectedProjectId
                    ? projects.find(p => p.id === selectedProjectId)?.name || "CAD Design Assistant"
                    : "AI Design Assistant"
                  }
                </h1>
                <p className="text-xs text-slate-500 merriweather-regular">
                  {selectedProjectId
                    ? `${projects.find(p => p.id === selectedProjectId)?.project_code} • Generative CAD`
                    : "Select a project to get started"
                  }
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                className="border-slate-200 hover:bg-slate-50 rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-50/50 to-white">
          {messages.length === 0 ? (
            <LandingPage />
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4 md:p-6 lg:p-8">
                  <div className="max-w-5xl mx-auto space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                            <PenTool className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className={`max-w-4xl ${
                          message.role === 'user' ? 'ml-8 md:ml-16' : 'mr-8 md:mr-16'
                        }`}>
                          <div className={`rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-teal-500 text-white ml-auto'
                              : message.error
                                ? 'bg-red-50 border border-red-200 text-red-800'
                                : 'bg-slate-50 text-slate-900'
                          }`}>
                              {message.error && (
                                <div className="flex items-center gap-2 mb-3">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-sm merriweather-regular text-red-700">Service Error</span>
                                </div>
                              )}

                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.content}
                              </div>

                              {message.tools_used && message.tools_used.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-3 h-3 text-teal-600" />
                                    <span className="text-xs merriweather-bold text-slate-700">Tools used:</span>
                                  </div>
                                  {message.tools_used.map((toolId, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200 transition-colors px-2 py-1 rounded-full"
                                    >
                                      {toolId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && <TypingIndicator />}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t bg-white/90 backdrop-blur-sm p-4 md:p-6 shadow-sm">
                  <div className="max-w-5xl mx-auto">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-teal-300 p-4">
                        {/* Project context indicator */}
                        {selectedProjectId && (
                          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                            <Boxes className="w-4 h-4 text-teal-600" />
                            <span className="text-sm text-slate-600">
                              Designing for: <span className="font-medium text-slate-900">
                                {projects.find(p => p.id === selectedProjectId)?.name}
                              </span>
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <input
                            ref={chatInputRef}
                            type="text"
                            placeholder={
                              selectedProjectId
                                ? "Describe the shape you want to create..."
                                : "Select a project first to start designing..."
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                              }
                            }}
                            className="flex-1 text-base border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-slate-400"
                            disabled={isLoading || !selectedProjectId}
                            autoComplete="off"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isLoading || !selectedProjectId}
                            className="bg-teal-500 hover:bg-teal-600 rounded-xl px-4 py-2 transition-colors flex-shrink-0"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-slate-600 merriweather-regular">Press Enter to generate</div>
                          <div className="text-xs text-slate-500">Generative CAD</div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </SidebarInset>

      {/* Create Project Modal */}
      <CreateProjectModal
        open={showCreateProjectModal}
        onOpenChange={setShowCreateProjectModal}
        onCreateProject={createProject}
      />

      {/* Upload Reference Modal */}
      <UploadReferenceModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        projects={projects}
        onUpload={uploadDesignFile}
        isLoading={isLoading}
      />
    </SidebarProvider>
  )
}

// Create Project Modal Component
function CreateProjectModal({
  open,
  onOpenChange,
  onCreateProject
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateProject: (projectData: { name: string; project_code: string; category: string; description: string; color_theme: string }) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    project_code: '',
    category: '',
    description: '',
    color_theme: '#14B8A6'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.project_code) {
      onCreateProject(formData)
      setFormData({
        name: '',
        project_code: '',
        category: '',
        description: '',
        color_theme: '#14B8A6'
      })
    }
  }

  const colorOptions = [
    { value: '#14B8A6', label: 'Teal' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#F59E0B', label: 'Orange' },
    { value: '#10B981', label: 'Green' }
  ]

  const categoryOptions = [
    'Mechanical Parts',
    'Enclosures',
    'Prototypes',
    'Assemblies',
    'Art & Design',
    'Other'
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create New Project</SheetTitle>
          <SheetDescription>
            Start a new CAD design project to organize your 3D models and components.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Robot Arm Assembly"
              required
            />
          </div>
          <div>
            <Label htmlFor="project_code">Project Code</Label>
            <Input
              id="project_code"
              value={formData.project_code}
              onChange={(e) => setFormData(prev => ({ ...prev, project_code: e.target.value }))}
              placeholder="e.g. MECH-001"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the project"
            />
          </div>
          <div>
            <Label htmlFor="color_theme">Color Theme</Label>
            <Select value={formData.color_theme} onValueChange={(value) => setFormData(prev => ({ ...prev, color_theme: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a color" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700">
              Create Project
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// Upload Reference Modal Component
function UploadReferenceModal({
  open,
  onOpenChange,
  projects,
  onUpload,
  isLoading
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: DesignProject[]
  onUpload: (projectId: string, file: File) => void
  isLoading?: boolean
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedProjectId && selectedFile) {
      onUpload(selectedProjectId, selectedFile)
      setSelectedProjectId('')
      setSelectedFile(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Import Reference File</SheetTitle>
          <SheetDescription>
            Import a reference image, sketch, or existing CAD file to guide your design.
          </SheetDescription>
        </SheetHeader>
        {projects.length === 0 ? (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You need to create a project first before importing files.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="project">Select Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: proj.color_theme }}
                        />
                        {proj.name} ({proj.project_code})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file">Reference File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.svg,.step,.stl,.obj,.pdf"
                required
              />
              {selectedFile && (
                <p className="text-sm text-slate-600 mt-1">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                disabled={!selectedProjectId || !selectedFile || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import File'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}