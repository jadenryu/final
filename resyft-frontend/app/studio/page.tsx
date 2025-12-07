"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { ScrollArea } from "../../components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import { Switch } from "../../components/ui/switch"
import { useStudioStore, type StudioFeature } from "../../lib/cad/studio-store"
import {
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
  Grid3X3,
  Layers,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Lock,
  Unlock,
  Move3d,
  Donut,
  Pencil,
  ArrowUp,
  RotateCw,
  Sparkles,
  Hexagon,
  Move,
  RotateCcw,
  Maximize2,
  MousePointer2,
  Hand,
  ZoomIn,
  Ruler,
  Copy,
  Palette,
  ImagePlus,
  X,
  Home,
} from "lucide-react"

// Dynamic import for Three.js canvas to avoid SSR issues
const ThreeCanvas = dynamic(() => import("../../components/cad/ThreeCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <div className="text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p>Loading 3D View...</p>
      </div>
    </div>
  ),
})

// Feature Tree Item Component
function FeatureTreeItem({
  feature,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleSuppressed,
  onToggleLocked,
  onDelete,
}: {
  feature: StudioFeature
  isSelected: boolean
  onSelect: () => void
  onToggleVisibility: () => void
  onToggleSuppressed: () => void
  onToggleLocked: () => void
  onDelete: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const content = feature.content

  const getIcon = () => {
    if (!content) return <Box className="w-4 h-4" />
    switch (content.primitive) {
      case "cube":
        return <Box className="w-4 h-4" />
      case "cylinder":
        return <Cylinder className="w-4 h-4" />
      case "sphere":
        return <Circle className="w-4 h-4" />
      case "cone":
        return <Triangle className="w-4 h-4" />
      case "torus":
        return <Donut className="w-4 h-4" />
      case "sketch":
        return <Pencil className="w-4 h-4" />
      case "extrude":
        return <ArrowUp className="w-4 h-4" />
      case "revolve":
        return <RotateCw className="w-4 h-4" />
      case "fillet":
        return <Sparkles className="w-4 h-4" />
      case "chamfer":
        return <Hexagon className="w-4 h-4" />
      default:
        return <Box className="w-4 h-4" />
    }
  }

  return (
    <div
      className={`group flex items-center gap-1 px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
        isSelected
          ? "bg-brand-100 text-brand-700"
          : "hover:bg-slate-100 text-slate-700"
      } ${feature.suppressed ? "opacity-50" : ""}`}
      onClick={onSelect}
    >
      <button
        className="p-0.5 hover:bg-slate-200 rounded"
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>

      <span className="text-slate-500">{getIcon()}</span>

      <span className="flex-1 truncate">{feature.id}</span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1 hover:bg-slate-200 rounded"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility()
          }}
          title={feature.visible ? "Hide" : "Show"}
        >
          {feature.visible ? (
            <Eye className="w-3 h-3" />
          ) : (
            <EyeOff className="w-3 h-3" />
          )}
        </button>

        <button
          className="p-1 hover:bg-slate-200 rounded"
          onClick={(e) => {
            e.stopPropagation()
            onToggleLocked()
          }}
          title={feature.locked ? "Unlock" : "Lock"}
        >
          {feature.locked ? (
            <Lock className="w-3 h-3" />
          ) : (
            <Unlock className="w-3 h-3" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 hover:bg-slate-200 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onToggleSuppressed}>
              {feature.suppressed ? "Unsuppress" : "Suppress"}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={onDelete}
              disabled={feature.locked}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Chat Message Component
function ChatMessage({
  message,
}: {
  message: { role: "user" | "assistant"; content: string }
}) {
  return (
    <div
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          message.role === "user"
            ? "bg-brand-600 text-white"
            : "bg-slate-100 text-slate-800"
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

export default function StudioPage() {
  const {
    features,
    selectedFeatureId,
    addFeature,
    updateFeature,
    deleteFeature,
    selectFeature,
    clearFeatures,
  } = useStudioStore()

  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content:
        "Hello! I'm your CAD AI assistant. Describe what you'd like to create and I'll generate the 3D geometry for you. Try saying something like 'Create a red cube that is 50mm wide' or 'Add a cylinder with radius 20mm'.",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [viewMode, setViewMode] = useState<"perspective" | "top" | "front" | "right">("perspective")
  const [activeTool, setActiveTool] = useState<"select" | "pan" | "zoom" | "measure">("select")
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  // Image upload states
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const [imageAnalysis, setImageAnalysis] = useState<{
    analysis: string
    components: string
    cadSuggestion: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedImage(file)
    setImagePreview(URL.createObjectURL(file))
    setIsAnalyzingImage(true)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to analyze image")

      const data = await response.json()
      setImageAnalysis({
        analysis: data.analysis,
        components: data.components,
        cadSuggestion: data.cadSuggestion,
      })

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I've analyzed your image!\n\n**What I see:** ${data.analysis}\n\n**Components:** ${data.components}\n\nI'm ready to recreate this in CAD. Just say "create it" or give me more specific instructions!`,
        },
      ])
    } catch (error) {
      console.error("Image analysis error:", error)
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble analyzing that image. Please try another one or describe what you'd like to create.",
        },
      ])
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  const clearUploadedImage = () => {
    setUploadedImage(null)
    setImagePreview(null)
    setImageAnalysis(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage("")
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      // Build scene context for the AI
      const sceneContext = features.map(f => ({
        id: f.id,
        type: f.content?.primitive || f.content?.type || 'unknown',
        position: f.content?.position || [0, 0, 0],
        rotation: f.content?.rotation || [0, 0, 0],
        dimensions: {
          width: f.content?.width,
          height: f.content?.height,
          depth: f.content?.depth,
          radius: f.content?.radius,
          tube: f.content?.tube,
          radiusTop: f.content?.radiusTop,
          radiusBottom: f.content?.radiusBottom,
        },
        color: f.content?.color
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: chatMessages.slice(-10),
          imageAnalysis: imageAnalysis,
          sceneContext: sceneContext,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ])

      // Process patches to add/update/delete features
      if (data.patches && data.patches.length > 0) {
        for (const patch of data.patches) {
          if (patch.action === "INSERT") {
            addFeature({
              id: patch.feature_id,
              content: patch.content,
              visible: true,
              locked: false,
              suppressed: false,
            })
          } else if (patch.action === "REPLACE") {
            updateFeature(patch.feature_id, { content: patch.content })
          } else if (patch.action === "DELETE") {
            deleteFeature(patch.feature_id)
          }
        }
      }

      // Clear image analysis after successful CAD generation
      if (imageAnalysis && data.patches?.length > 0) {
        clearUploadedImage()
      }
    } catch (error) {
      console.error("Chat error:", error)
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    const projectData = {
      name: "CAD Project",
      features: features,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cad-project-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Toolbar */}
      <div className="h-12 bg-white border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-1">
            <Box className="w-5 h-5 text-brand-600" />
            <span className="font-semibold text-slate-800">CAD AI Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Controls */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-md p-1">
            <Button
              variant={activeTool === "select" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setActiveTool("select")}
              title="Select"
            >
              <MousePointer2 className="w-4 h-4" />
            </Button>
            <Button
              variant={activeTool === "pan" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setActiveTool("pan")}
              title="Pan"
            >
              <Hand className="w-4 h-4" />
            </Button>
            <Button
              variant={activeTool === "zoom" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setActiveTool("zoom")}
              title="Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Grid Toggle */}
          <Button
            variant={showGrid ? "secondary" : "ghost"}
            size="sm"
            className="h-8"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            Grid
          </Button>

          {/* View Mode */}
          <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="perspective">Perspective</SelectItem>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="front">Front</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-slate-200" />

          <Button variant="outline" size="sm" className="h-8" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Feature Tree */}
        <div
          className={`${leftPanelOpen ? "w-64" : "w-0"} bg-white border-r flex flex-col transition-all duration-200 overflow-hidden`}
        >
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-sm">Features</span>
              <span className="text-xs text-slate-400">({features.length})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setLeftPanelOpen(false)}
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {features.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8">
                  <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No features yet</p>
                  <p className="text-xs mt-1">Use the chat to create shapes</p>
                </div>
              ) : (
                features.map((feature) => (
                  <FeatureTreeItem
                    key={feature.id}
                    feature={feature}
                    isSelected={selectedFeatureId === feature.id}
                    onSelect={() => selectFeature(feature.id)}
                    onToggleVisibility={() =>
                      updateFeature(feature.id, { visible: !feature.visible })
                    }
                    onToggleSuppressed={() =>
                      updateFeature(feature.id, {
                        suppressed: !feature.suppressed,
                      })
                    }
                    onToggleLocked={() =>
                      updateFeature(feature.id, { locked: !feature.locked })
                    }
                    onDelete={() => deleteFeature(feature.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {features.length > 0 && (
            <div className="p-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (confirm("Clear all features?")) {
                    clearFeatures()
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Left Panel Toggle (when closed) */}
        {!leftPanelOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-6 rounded-l-none bg-white border border-l-0 z-10"
            onClick={() => setLeftPanelOpen(true)}
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        )}

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <ThreeCanvas
            features={features.filter((f) => f.visible && !f.suppressed)}
            selectedFeatureId={selectedFeatureId}
            showGrid={showGrid}
            viewMode={viewMode}
          />

          {/* View Mode Indicator */}
          <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div
          className={`${rightPanelOpen ? "w-80" : "w-0"} bg-white border-l flex flex-col transition-all duration-200 overflow-hidden`}
        >
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-sm">AI Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setRightPanelOpen(false)}
            >
              <PanelRightClose className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-3" ref={chatScrollRef}>
            <div className="space-y-3">
              {chatMessages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Image Preview */}
          {imagePreview && (
            <div className="px-3 py-2 border-t bg-slate-50">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="h-16 rounded border"
                />
                <button
                  onClick={clearUploadedImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
                {isAnalyzingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
              </div>
              {imageAnalysis && (
                <p className="text-xs text-green-600 mt-1">Image analyzed!</p>
              )}
            </div>
          )}

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzingImage}
                title="Upload image to analyze"
              >
                <ImagePlus className="w-4 h-4" />
              </Button>
              <Input
                placeholder="Describe what to create..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading}
                className="h-9"
              />
              <Button
                size="sm"
                className="h-9 bg-brand-600 hover:bg-brand-700"
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Try: "Create a blue cube 30mm wide" or upload an image
            </p>
          </div>
        </div>

        {/* Right Panel Toggle (when closed) */}
        {!rightPanelOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-6 rounded-r-none bg-white border border-r-0 z-10"
            onClick={() => setRightPanelOpen(true)}
          >
            <PanelRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Canvas Settings</DialogTitle>
            <DialogDescription>
              Customize the 3D canvas appearance and behavior
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="grid">Show Grid</Label>
              <Switch
                id="grid"
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
