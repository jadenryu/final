"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { ScrollArea } from "../../../components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { Label } from "../../../components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { Switch } from "../../../components/ui/switch"
import { useCADStore, type Feature, type ProjectSettings } from "../../../lib/cad/store"
import { parseDSLString } from "../../../lib/cad/dslparser"
import {
  ArrowLeft,
  Send,
  Box,
  Circle,
  Triangle,
  Cylinder,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Loader2,
  Plus,
  Settings,
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Grid3X3,
  Layers,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Lock,
  Unlock,
  Play,
  Pause,
} from "lucide-react"

// Simple 3D Canvas placeholder - in production, replace with Three.js
function CADCanvas({ features }: { features: Feature[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      draw()
    }

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, w, h)

      // Grid
      ctx.strokeStyle = '#2a2a4e'
      ctx.lineWidth = 0.5
      const gridSize = 20
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Axes at center
      const cx = w / 2
      const cy = h / 2

      // X axis (red)
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + 100, cy)
      ctx.stroke()

      // Y axis (green)
      ctx.strokeStyle = '#22c55e'
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx, cy - 100)
      ctx.stroke()

      // Z axis (blue, simulated as diagonal)
      ctx.strokeStyle = '#3b82f6'
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx - 50, cy + 50)
      ctx.stroke()

      // Draw features (simplified 2D representation)
      features.filter(f => f.visible && !f.suppressed).forEach((feature, idx) => {
        const patch = feature.patch
        if (!patch?.content) return

        const content = patch.content as any
        const offsetX = cx + (idx * 30 - features.length * 15)
        const offsetY = cy

        ctx.fillStyle = content.color || '#14b8a6'
        ctx.strokeStyle = '#0d9488'
        ctx.lineWidth = 2

        switch (content.type || content.primitive) {
          case 'cube':
            const size = Math.min(content.width || 50, content.height || 50, content.depth || 50)
            ctx.fillRect(offsetX - size/2, offsetY - size/2, size, size * 0.8)
            ctx.strokeRect(offsetX - size/2, offsetY - size/2, size, size * 0.8)
            break
          case 'cylinder':
            ctx.beginPath()
            ctx.ellipse(offsetX, offsetY, content.radius || 30, (content.radius || 30) * 0.4, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
            break
          case 'sphere':
            ctx.beginPath()
            ctx.arc(offsetX, offsetY, content.radius || 30, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
            break
          case 'cone':
            ctx.beginPath()
            ctx.moveTo(offsetX, offsetY - (content.height || 40))
            ctx.lineTo(offsetX - (content.radius || 25), offsetY + 20)
            ctx.lineTo(offsetX + (content.radius || 25), offsetY + 20)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            break
          case 'torus':
            ctx.beginPath()
            ctx.ellipse(offsetX, offsetY, content.radius || 30, (content.radius || 30) * 0.5, 0, 0, Math.PI * 2)
            ctx.stroke()
            ctx.beginPath()
            ctx.ellipse(offsetX, offsetY, (content.radius || 30) - (content.tube || 10), ((content.radius || 30) - (content.tube || 10)) * 0.5, 0, 0, Math.PI * 2)
            ctx.stroke()
            break
        }
      })

      // Empty state
      if (features.length === 0) {
        ctx.fillStyle = '#64748b'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('Use the AI chat to generate CAD shapes', cx, cy + 150)
        ctx.fillText('Try: "Create a cube that is 50mm wide"', cx, cy + 175)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [features])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  )
}

// Feature Tree Item Component
function FeatureTreeItem({
  feature,
  projectId,
  isSelected,
  onSelect,
}: {
  feature: Feature
  projectId: string
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  const { toggleFeatureVisibility, toggleFeatureSuppression, deleteFeature, updateFeature } = useCADStore()
  const [isExpanded, setIsExpanded] = useState(true)

  const getFeatureIcon = (type: string) => {
    switch (type) {
      case 'primitive':
        const primitiveType = (feature.patch?.content as any)?.type || (feature.patch?.content as any)?.primitive
        switch (primitiveType) {
          case 'cube': return <Box className="w-4 h-4" />
          case 'cylinder': return <Cylinder className="w-4 h-4" />
          case 'sphere': return <Circle className="w-4 h-4" />
          case 'cone': return <Triangle className="w-4 h-4" />
          default: return <Box className="w-4 h-4" />
        }
      case 'sketch': return <Grid3X3 className="w-4 h-4" />
      case 'extrude': return <Layers className="w-4 h-4" />
      default: return <Box className="w-4 h-4" />
    }
  }

  return (
    <div className={`${feature.suppressed ? 'opacity-50' : ''}`}>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group ${
          isSelected ? 'bg-teal-100 text-teal-900' : 'hover:bg-slate-100'
        }`}
        onClick={() => onSelect(feature.id)}
      >
        {feature.children?.length ? (
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
            className="p-0.5 hover:bg-slate-200 rounded"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <span className={`${feature.visible ? 'text-teal-600' : 'text-slate-400'}`}>
          {getFeatureIcon(feature.type)}
        </span>

        <span className="flex-1 text-sm truncate">{feature.name}</span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); toggleFeatureVisibility(projectId, feature.id) }}
            className="p-1 hover:bg-slate-200 rounded"
            title={feature.visible ? 'Hide' : 'Show'}
          >
            {feature.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-1 hover:bg-slate-200 rounded">
                <MoreVertical className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => toggleFeatureSuppression(projectId, feature.id)}>
                {feature.suppressed ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                {feature.suppressed ? 'Unsuppress' : 'Suppress'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFeature(projectId, feature.id, { locked: !feature.locked })}>
                {feature.locked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                {feature.locked ? 'Unlock' : 'Lock'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteFeature(projectId, feature.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpanded && feature.children?.map(child => (
        <div key={child.id} className="ml-4">
          <FeatureTreeItem
            feature={child}
            projectId={projectId}
            isSelected={isSelected}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  )
}

// Chat Message Component
function ChatMessage({ message }: { message: { role: string; content: string } }) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          message.role === 'user'
            ? 'bg-teal-600 text-white'
            : 'bg-slate-100 text-slate-900'
        }`}
      >
        <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
      </div>
    </div>
  )
}

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    projects,
    getActiveProject,
    setActiveProject,
    editor,
    setSelectedFeatures,
    toggleFeatureTree,
    addFeature,
    messages,
    addMessage,
    setIsGenerating,
  } = useCADStore()

  const [chatInput, setChatInput] = useState("")
  const [localMessages, setLocalMessages] = useState<{ role: string; content: string }[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [showChat, setShowChat] = useState(true)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  const project = projects.find(p => p.id === projectId)
  const { updateProject, exportProject } = useCADStore()

  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId)
    }
  }, [projectId, setActiveProject])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || editor.isGenerating) return

    const userMessage = chatInput.trim()
    setChatInput("")
    setLocalMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsGenerating(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: localMessages
        })
      })

      const data = await response.json()

      if (data.error) {
        setLocalMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.details || data.error}` }])
      } else {
        setLocalMessages(prev => [...prev, { role: 'assistant', content: data.response }])

        // Parse DSL patches and add features
        const lines = data.response.split('\n').filter((line: string) => line.trim().startsWith('AT '))
        if (lines.length > 0 && project) {
          try {
            lines.forEach((line: string) => {
              const match = line.match(/^AT\s+(\S+)\s+(\S+)\s+([\s\S]+)$/)
              if (match) {
                const [, featureId, action, content] = match
                const parsedContent = JSON.parse(content)

                const feature: Feature = {
                  id: featureId,
                  name: `${parsedContent.type || 'Shape'} ${featureId.split('_')[1] || ''}`,
                  type: 'primitive',
                  visible: true,
                  locked: false,
                  suppressed: false,
                  patch: {
                    feature_id: featureId,
                    action: action as 'INSERT' | 'REPLACE' | 'DELETE',
                    content: parsedContent
                  }
                }
                addFeature(projectId, feature)
              }
            })
          } catch (parseError) {
            console.error('Failed to parse DSL:', parseError)
          }
        }
      }
    } catch (error) {
      setLocalMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to AI service. Please try again.' }])
    } finally {
      setIsGenerating(false)
    }
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Project not found</h2>
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Top Toolbar */}
      <header className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Projects
        </Button>

        <div className="h-6 w-px bg-slate-700" />

        <h1 className="text-sm font-medium text-white truncate max-w-xs">{project.name}</h1>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700" disabled>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700" disabled>
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-slate-400 w-12 text-center">100%</span>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              const json = exportProject(projectId)
              if (json) {
                const blob = new Blob([json], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${project?.name || 'project'}.json`
                a.click()
                URL.revokeObjectURL(url)
              }
            }}>
              <Download className="w-4 h-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Project Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Project Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
            <DialogDescription>
              Configure your CAD project settings
            </DialogDescription>
          </DialogHeader>
          {project && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={project.name}
                  onChange={(e) => updateProject(projectId, { name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDesc">Description</Label>
                <Input
                  id="projectDesc"
                  value={project.description}
                  onChange={(e) => updateProject(projectId, { description: e.target.value })}
                  placeholder="Add a description..."
                />
              </div>

              <div className="space-y-2">
                <Label>Units</Label>
                <Select
                  value={project.settings.units}
                  onValueChange={(value: 'mm' | 'cm' | 'm' | 'in') =>
                    updateProject(projectId, {
                      settings: { ...project.settings, units: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">Millimeters (mm)</SelectItem>
                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                    <SelectItem value="m">Meters (m)</SelectItem>
                    <SelectItem value="in">Inches (in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Grid Size</Label>
                <Input
                  type="number"
                  value={project.settings.gridSize}
                  onChange={(e) =>
                    updateProject(projectId, {
                      settings: { ...project.settings, gridSize: Number(e.target.value) }
                    })
                  }
                  min={1}
                  max={100}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="snapGrid">Snap to Grid</Label>
                <Switch
                  id="snapGrid"
                  checked={project.settings.snapToGrid}
                  onCheckedChange={(checked) =>
                    updateProject(projectId, {
                      settings: { ...project.settings, snapToGrid: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showAxes">Show Axes</Label>
                <Switch
                  id="showAxes"
                  checked={project.settings.showAxes}
                  onCheckedChange={(checked) =>
                    updateProject(projectId, {
                      settings: { ...project.settings, showAxes: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showGrid">Show Grid</Label>
                <Switch
                  id="showGrid"
                  checked={project.settings.showGrid}
                  onCheckedChange={(checked) =>
                    updateProject(projectId, {
                      settings: { ...project.settings, showGrid: checked }
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)} className="bg-teal-600 hover:bg-teal-700">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Feature Tree Sidebar */}
        {editor.showFeatureTree && (
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Features</h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={toggleFeatureTree}
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {project.features.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No features yet</p>
                    <p className="text-xs mt-1">Use AI chat to create shapes</p>
                  </div>
                ) : (
                  project.features.map(feature => (
                    <FeatureTreeItem
                      key={feature.id}
                      feature={feature}
                      projectId={projectId}
                      isSelected={editor.selectedFeatureIds.includes(feature.id)}
                      onSelect={(id) => setSelectedFeatures([id])}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Canvas Area */}
        <div className="flex-1 relative">
          {!editor.showFeatureTree && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 left-2 z-10 bg-white/90 hover:bg-white shadow-sm"
              onClick={toggleFeatureTree}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          )}

          <CADCanvas features={project.features} />

          {/* View Controls Overlay */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white shadow-sm">
              3D
            </Button>
            <Button size="sm" variant="ghost" className="bg-white/90 hover:bg-white shadow-sm">
              Front
            </Button>
            <Button size="sm" variant="ghost" className="bg-white/90 hover:bg-white shadow-sm">
              Top
            </Button>
            <Button size="sm" variant="ghost" className="bg-white/90 hover:bg-white shadow-sm">
              Right
            </Button>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <aside className="w-80 bg-white border-l border-slate-200 flex flex-col">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                AI Assistant
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setShowChat(false)}
              >
                <PanelLeftClose className="w-4 h-4 rotate-180" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {localMessages.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Describe what you want to create</p>
                    <p className="text-xs mt-2 text-slate-500">
                      Example: "Create a cube 50mm wide, 30mm tall"
                    </p>
                  </div>
                )}
                {localMessages.map((msg, idx) => (
                  <ChatMessage key={idx} message={msg} />
                ))}
                {editor.isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                      <span className="text-sm text-slate-500">Generating...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-slate-200">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Describe a shape..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={editor.isGenerating}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || editor.isGenerating}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </aside>
        )}

        {!showChat && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white shadow-sm"
            onClick={() => setShowChat(true)}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
