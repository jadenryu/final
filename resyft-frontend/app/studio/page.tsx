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

// Feature Tree Item Component with editable properties
function FeatureTreeItem({
  feature,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleSuppressed,
  onToggleLocked,
  onDelete,
  onUpdate,
}: {
  feature: StudioFeature
  isSelected: boolean
  onSelect: () => void
  onToggleVisibility: () => void
  onToggleSuppressed: () => void
  onToggleLocked: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<StudioFeature>) => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const content = feature.content
  const type = content?.primitive || content?.type || 'cube'

  const getIcon = () => {
    if (!content) return <Box className="w-4 h-4" />
    const primitive = content.primitive || content.type
    switch (primitive) {
      case "cube":
      case "box":
        return <Box className="w-4 h-4" />
      case "cylinder":
        return <Cylinder className="w-4 h-4" />
      case "sphere":
        return <Circle className="w-4 h-4" />
      case "cone":
      case "pyramid":
        return <Triangle className="w-4 h-4" />
      case "torus":
      case "ring":
        return <Donut className="w-4 h-4" />
      case "prism":
      case "triangular_prism":
        return <Triangle className="w-4 h-4" />
      case "hexagonal_prism":
      case "hexagon":
      case "octagonal_prism":
      case "octagon":
      case "pentagonal_prism":
      case "pentagon":
      case "custom_prism":
        return <Hexagon className="w-4 h-4" />
      case "capsule":
      case "pipe":
      case "tube":
        return <Cylinder className="w-4 h-4" />
      case "tetrahedron":
      case "octahedron":
      case "dodecahedron":
      case "icosahedron":
        return <Hexagon className="w-4 h-4" />
      case "hemisphere":
        return <Circle className="w-4 h-4" />
      case "frustum":
      case "truncated_cone":
        return <Triangle className="w-4 h-4" />
      case "wedge":
        return <Triangle className="w-4 h-4" />
      case "star":
        return <Sparkles className="w-4 h-4" />
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

  const getFeatureName = () => {
    const type = content?.primitive || content?.type || 'Shape'
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
  }

  return (
    <div className={feature.suppressed ? 'opacity-50' : ''}>
      <div
        className={`flex flex-col gap-1 px-2 py-2 rounded-md cursor-pointer group transition-colors ${
          isSelected
            ? 'bg-amber-50 border border-amber-300'
            : showDetails
            ? 'bg-slate-100 border border-slate-200'
            : 'hover:bg-slate-50 border border-transparent'
        }`}
        onClick={() => {
          onSelect()
          setShowDetails(!showDetails)
        }}
      >
        <div className="flex items-center gap-2">
          <span className={`flex-shrink-0 ${isSelected ? 'text-amber-600' : feature.visible ? 'text-brand-600' : 'text-slate-400'}`}>
            {getIcon()}
          </span>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {getFeatureName()}
            </div>
            <div className="text-xs text-slate-500 font-mono truncate">
              {feature.id.split('_').slice(0, 2).join('_')}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisibility() }}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
              title={feature.visible ? 'Hide' : 'Show'}
            >
              {feature.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1 hover:bg-red-100 rounded transition-colors text-slate-400 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1 hover:bg-slate-200 rounded transition-colors">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleSuppressed() }}>
                  {feature.suppressed ? 'Unsuppress' : 'Suppress'}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleLocked() }}>
                  {feature.locked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  {feature.locked ? 'Unlock' : 'Lock'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); onDelete() }}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  disabled={feature.locked}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Editable Properties Panel */}
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-slate-200 space-y-2 text-xs" onClick={(e) => e.stopPropagation()}>
            {/* Position */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <Move className="w-3 h-3" /> Position
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <label className="text-[10px] text-slate-400">X</label>
                  <input
                    type="number"
                    value={content?.position?.[0] || 0}
                    onChange={(e) => {
                      const pos = content?.position || [0, 0, 0]
                      onUpdate({ content: { ...content, position: [Number(e.target.value), pos[1], pos[2]] } })
                    }}
                    className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Y</label>
                  <input
                    type="number"
                    value={content?.position?.[1] || 0}
                    onChange={(e) => {
                      const pos = content?.position || [0, 0, 0]
                      onUpdate({ content: { ...content, position: [pos[0], Number(e.target.value), pos[2]] } })
                    }}
                    className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Z</label>
                  <input
                    type="number"
                    value={content?.position?.[2] || 0}
                    onChange={(e) => {
                      const pos = content?.position || [0, 0, 0]
                      onUpdate({ content: { ...content, position: [pos[0], pos[1], Number(e.target.value)] } })
                    }}
                    className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <Ruler className="w-3 h-3" /> Dimensions
              </div>
              <div className="grid grid-cols-3 gap-1">
                {content?.width !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-400">W</label>
                    <input
                      type="number"
                      value={content?.width || 10}
                      onChange={(e) => onUpdate({ content: { ...content, width: Number(e.target.value) } })}
                      className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                      min={1}
                    />
                  </div>
                )}
                {content?.height !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-400">H</label>
                    <input
                      type="number"
                      value={content?.height || 10}
                      onChange={(e) => onUpdate({ content: { ...content, height: Number(e.target.value) } })}
                      className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                      min={1}
                    />
                  </div>
                )}
                {content?.depth !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-400">D</label>
                    <input
                      type="number"
                      value={content?.depth || 10}
                      onChange={(e) => onUpdate({ content: { ...content, depth: Number(e.target.value) } })}
                      className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                      min={1}
                    />
                  </div>
                )}
                {content?.radius !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-400">R</label>
                    <input
                      type="number"
                      value={content?.radius || 5}
                      onChange={(e) => onUpdate({ content: { ...content, radius: Number(e.target.value) } })}
                      className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                      min={1}
                    />
                  </div>
                )}
                {content?.tube !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-400">Tube</label>
                    <input
                      type="number"
                      value={content?.tube || 3}
                      onChange={(e) => onUpdate({ content: { ...content, tube: Number(e.target.value) } })}
                      className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                      min={1}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <RotateCcw className="w-3 h-3" /> Rotation
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <label className="text-[10px] text-slate-400">X°</label>
                  <input
                    type="number"
                    value={content?.rotation?.[0] || 0}
                    onChange={(e) => {
                      const rot = content?.rotation || [0, 0, 0]
                      onUpdate({ content: { ...content, rotation: [Number(e.target.value), rot[1], rot[2]] } })
                    }}
                    className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Y°</label>
                  <input
                    type="number"
                    value={content?.rotation?.[1] || 0}
                    onChange={(e) => {
                      const rot = content?.rotation || [0, 0, 0]
                      onUpdate({ content: { ...content, rotation: [rot[0], Number(e.target.value), rot[2]] } })
                    }}
                    className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Z°</label>
                  <input
                    type="number"
                    value={content?.rotation?.[2] || 0}
                    onChange={(e) => {
                      const rot = content?.rotation || [0, 0, 0]
                      onUpdate({ content: { ...content, rotation: [rot[0], rot[1], Number(e.target.value)] } })
                    }}
                    className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Color */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <Palette className="w-3 h-3" /> Color
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={content?.color || '#3342d2'}
                  onChange={(e) => onUpdate({ content: { ...content, color: e.target.value } })}
                  className="w-8 h-6 rounded border border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={content?.color || '#3342d2'}
                  onChange={(e) => onUpdate({ content: { ...content, color: e.target.value } })}
                  className="flex-1 h-6 px-1 text-xs font-mono border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>
              {/* Color presets */}
              <div className="flex gap-1 flex-wrap">
                {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3342d2', '#3b82f6', '#a855f7', '#ec4899', '#ffffff', '#1f2937'].map(color => (
                  <button
                    key={color}
                    onClick={() => onUpdate({ content: { ...content, color } })}
                    className="w-5 h-5 rounded border border-slate-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Fillet - only for cube/box */}
            {(type === 'cube' || type === 'box') && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-500 font-medium">
                  <Sparkles className="w-3 h-3" /> Fillet
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={content?.fillet_radius || 0}
                    onChange={(e) => {
                      const radius = Number(e.target.value)
                      onUpdate({
                        content: {
                          ...content,
                          fillet_radius: radius,
                          edge_fillets: [] // Clear per-edge fillets when setting uniform
                        }
                      })
                    }}
                    className="flex-1 h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    min={0}
                    step={0.5}
                    placeholder="0"
                  />
                  <span className="text-[10px] text-slate-400">mm</span>
                </div>
                {/* Quick fillet presets */}
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 5].map(r => (
                    <button
                      key={r}
                      onClick={() => onUpdate({
                        content: {
                          ...content,
                          fillet_radius: r,
                          edge_fillets: []
                        }
                      })}
                      className={`flex-1 h-5 text-[10px] rounded border transition-colors ${
                        (content?.fillet_radius || 0) === r
                          ? 'bg-brand-100 border-brand-300 text-brand-700'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {r === 0 ? 'None' : `${r}mm`}
                    </button>
                  ))}
                </div>
                {content?.edge_fillets?.length > 0 && (
                  <div className="text-[10px] text-amber-600 flex items-center gap-1">
                    <span>{content.edge_fillets.length} edge(s) filleted</span>
                    <button
                      onClick={() => onUpdate({ content: { ...content, edge_fillets: [], fillet_radius: 0 } })}
                      className="underline hover:no-underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Status badges */}
            <div className="flex items-center gap-1 pt-1">
              {feature.locked && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">
                  <Lock className="w-2.5 h-2.5" />
                  Locked
                </span>
              )}
              {feature.suppressed && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-medium">
                  Suppressed
                </span>
              )}
              {!feature.visible && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-medium">
                  <EyeOff className="w-2.5 h-2.5" />
                  Hidden
                </span>
              )}
            </div>
          </div>
        )}
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

  // Context menu state for face/feature selection
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    selectionInfo: import("../../components/cad/ThreeCanvas").SelectionInfo | null
  }>({ visible: false, x: 0, y: 0, selectionInfo: null })
  const [selectedFaceInfo, setSelectedFaceInfo] = useState<import("../../components/cad/ThreeCanvas").SelectionInfo | null>(null)
  const [selectedEdgeInfo, setSelectedEdgeInfo] = useState<import("../../components/cad/ThreeCanvas").SelectionInfo | null>(null)

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

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }))
    if (contextMenu.visible) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [contextMenu.visible])

  // Handle context menu (right-click on 3D shape)
  const handleCanvasContextMenu = (
    info: import("../../components/cad/ThreeCanvas").SelectionInfo,
    screenPos: { x: number, y: number }
  ) => {
    setContextMenu({
      visible: true,
      x: screenPos.x,
      y: screenPos.y,
      selectionInfo: info
    })
    selectFeature(info.featureId)
  }

  // Handle face selection (shift+click)
  const handleFaceSelect = (info: import("../../components/cad/ThreeCanvas").SelectionInfo) => {
    setSelectedFaceInfo(info)
    setSelectedEdgeInfo(null) // Clear edge selection
    // Don't select the whole feature - only the face is selected
  }

  // Handle edge selection (ctrl+click)
  const handleEdgeSelect = (info: import("../../components/cad/ThreeCanvas").SelectionInfo) => {
    setSelectedEdgeInfo(info)
    setSelectedFaceInfo(null) // Clear face selection
    // Don't select the whole feature - only the edge is selected
  }

  // Handle double-click for whole feature selection
  const handleFeatureDoubleClick = (id: string) => {
    selectFeature(id)
    setSelectedFaceInfo(null)
    setSelectedEdgeInfo(null)
  }

  // Apply fillet directly to an edge - modifies the parent shape's geometry
  const applyFilletToEdge = (info: import("../../components/cad/ThreeCanvas").SelectionInfo, radius: number = 3) => {
    const feature = features.find(f => f.id === info.featureId)
    if (!feature || !feature.content) return

    // Get existing edge fillets or create new array
    const existingFillets = feature.content.edge_fillets || []

    // Check if this edge already has a fillet
    const edgeIndex = info.edgeIndex
    const existingIndex = existingFillets.findIndex((f: any) => f.edgeIndex === edgeIndex)

    let newFillets
    if (existingIndex >= 0) {
      // Update existing fillet
      newFillets = [...existingFillets]
      newFillets[existingIndex] = { edgeIndex, radius, edgeName: info.edgeName }
    } else {
      // Add new fillet
      newFillets = [...existingFillets, { edgeIndex, radius, edgeName: info.edgeName }]
    }

    // Update the parent feature with per-edge fillet data
    updateFeature(info.featureId, {
      content: {
        ...feature.content,
        edge_fillets: newFillets,
        // Also set a general fillet radius for fallback rendering
        fillet_radius: radius
      }
    })

    // Clear selection
    setSelectedEdgeInfo(null)
  }

  // Apply chamfer directly to an edge - for now, use fillet with smaller radius as visual approximation
  // (True chamfer would require custom geometry generation)
  const applyChamferToEdge = (info: import("../../components/cad/ThreeCanvas").SelectionInfo, distance: number = 2) => {
    const feature = features.find(f => f.id === info.featureId)
    if (!feature || !feature.content) return

    // For chamfer, we use a smaller fillet radius as an approximation
    // A true chamfer would cut a 45° bevel, but RoundedBox gives us smooth curves
    updateFeature(info.featureId, {
      content: {
        ...feature.content,
        fillet_radius: distance * 0.7, // Slightly smaller for chamfer look
        chamfer_applied: true // Flag to indicate chamfer was intended
      }
    })

    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: `Applied a **${distance}mm chamfer** to all edges of ${info.featureName}. The edges are now beveled.`
    }])

    // Clear selection
    setSelectedEdgeInfo(null)
  }

  // Send context-aware AI query
  const sendContextQuery = async (action: string) => {
    const info = contextMenu.selectionInfo
    if (!info) return

    setContextMenu({ visible: false, x: 0, y: 0, selectionInfo: null })

    // Handle fillet/chamfer directly without going through AI
    if (action === 'fillet') {
      // For edge selection, apply to that edge; for face/feature, apply to all edges
      if (info.selectionType === 'edge') {
        applyFilletToEdge(info, 3)
      } else {
        // Apply fillet to all edges (uniform fillet)
        const feature = features.find(f => f.id === info.featureId)
        if (feature) {
          updateFeature(info.featureId, {
            content: {
              ...feature.content,
              fillet_radius: 3,
              edge_fillets: [] // Clear per-edge fillets, use uniform
            }
          })
        }
      }
      return
    }

    if (action === 'chamfer') {
      if (info.selectionType === 'edge') {
        applyChamferToEdge(info, 2)
      } else {
        // Apply chamfer to all edges
        const feature = features.find(f => f.id === info.featureId)
        if (feature) {
          updateFeature(info.featureId, {
            content: {
              ...feature.content,
              fillet_radius: 1.4, // chamfer approximation
              edge_fillets: []
            }
          })
        }
      }
      return
    }

    let queryMessage = ''
    switch (action) {
      case 'extrude':
        queryMessage = `Extrude ${info.faceName || 'this face'} of the ${info.featureName} by 20mm (feature ID: ${info.featureId.split('_').slice(0, 2).join('_')})`
        break
      case 'delete':
        deleteFeature(info.featureId)
        setChatMessages(prev => [...prev, { role: 'assistant', content: `Deleted ${info.featureName}` }])
        return
      case 'duplicate':
        queryMessage = `Create an exact copy of the ${info.featureName} (feature ID: ${info.featureId.split('_').slice(0, 2).join('_')}) and place it 30mm to the right`
        break
      case 'color':
        queryMessage = `Change the color of the ${info.featureName} (feature ID: ${info.featureId.split('_').slice(0, 2).join('_')}) to red`
        break
      case 'info':
        const feature = features.find(f => f.id === info.featureId)
        if (feature) {
          const content = feature.content
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: `**${info.featureName}** (${info.featureId.split('_').slice(0, 2).join('_')})\n\n` +
              `- Type: ${content?.primitive || content?.type || 'Unknown'}\n` +
              `- Position: [${content?.position?.join(', ') || '0, 0, 0'}]\n` +
              `- Dimensions: ${content?.width ? `W:${content.width}` : ''}${content?.height ? ` H:${content.height}` : ''}${content?.depth ? ` D:${content.depth}` : ''}${content?.radius ? ` R:${content.radius}` : ''}\n` +
              `- Color: ${content?.color || '#3342d2'}\n` +
              (info.edgeName ? `- Selected Edge: ${info.edgeName}` : '') +
              (info.faceName ? `- Selected Face: ${info.faceName}` : '')
          }])
        }
        return
      default:
        return
    }

    // Send to AI
    setInputMessage(queryMessage)
    setTimeout(() => {
      const sendBtn = document.querySelector('[data-send-btn]') as HTMLButtonElement
      sendBtn?.click()
    }, 100)
  }

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
            // Generate unique ID with timestamp to avoid duplicates
            const uniqueId = `${patch.feature_id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
            addFeature({
              id: uniqueId,
              content: patch.content,
              visible: true,
              locked: false,
              suppressed: false,
            })
          } else if (patch.action === "REPLACE") {
            // For replace, find feature by original ID prefix and update
            const existingFeature = features.find(f => f.id.startsWith(patch.feature_id.split('_').slice(0, 2).join('_')))
            if (existingFeature) {
              updateFeature(existingFeature.id, { content: patch.content })
            }
          } else if (patch.action === "DELETE") {
            // For delete, find feature by original ID prefix
            const featureToDelete = features.find(f => f.id.startsWith(patch.feature_id.split('_').slice(0, 2).join('_')))
            if (featureToDelete) {
              deleteFeature(featureToDelete.id)
            }
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
        <aside
          className="bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0"
          style={{
            width: leftPanelOpen ? '256px' : '0px',
            minWidth: leftPanelOpen ? '256px' : '0px',
            transition: 'width 200ms ease-out, min-width 200ms ease-out'
          }}
        >
          <div className="w-64 flex flex-col h-full" style={{ opacity: leftPanelOpen ? 1 : 0, transition: 'opacity 150ms ease-out' }}>
            <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                Features
              </h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {features.length}
              </span>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {features.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    <Box className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No features yet</p>
                    <p className="text-xs mt-1 text-slate-500">Use AI chat to create shapes</p>
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
                      onUpdate={(updates) => updateFeature(feature.id, updates)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {features.length > 0 && (
              <div className="p-2 border-t border-slate-200 flex-shrink-0">
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
        </aside>

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
            onSelectFeature={(id) => selectFeature(id)}
            onDoubleClickFeature={handleFeatureDoubleClick}
            onFaceSelect={handleFaceSelect}
            onEdgeSelect={handleEdgeSelect}
            onContextMenu={handleCanvasContextMenu}
            selectedFaceInfo={selectedFaceInfo}
            selectedEdgeInfo={selectedEdgeInfo}
          />

          {/* View Mode Indicator */}
          <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
          </div>

          {/* Selection hint */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
            Double-click to select | Shift+Click face | Ctrl+Click edge
          </div>

          {/* Context Menu */}
          {contextMenu.visible && contextMenu.selectionInfo && (
            <div
              className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 min-w-48"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900">
                  {contextMenu.selectionInfo.featureName}
                </p>
                {contextMenu.selectionInfo.selectionType === 'edge' && contextMenu.selectionInfo.edgeName && (
                  <p className="text-xs text-amber-600 font-medium">
                    Edge: {contextMenu.selectionInfo.edgeName}
                  </p>
                )}
                {contextMenu.selectionInfo.selectionType === 'face' && contextMenu.selectionInfo.faceName && (
                  <p className="text-xs text-slate-500">
                    Face: {contextMenu.selectionInfo.faceName}
                  </p>
                )}
              </div>

              {/* Edge-specific actions */}
              {contextMenu.selectionInfo.selectionType === 'edge' && (
                <>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 flex items-center gap-2 text-green-700"
                    onClick={() => sendContextQuery('fillet')}
                  >
                    <Sparkles className="w-4 h-4" />
                    Apply Fillet (3mm)
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-amber-50 flex items-center gap-2 text-amber-700"
                    onClick={() => sendContextQuery('chamfer')}
                  >
                    <Hexagon className="w-4 h-4" />
                    Apply Chamfer (2mm)
                  </button>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                      onClick={() => sendContextQuery('info')}
                    >
                      <Box className="w-4 h-4 text-slate-500" />
                      Get Info
                    </button>
                  </div>
                </>
              )}

              {/* Face and feature actions */}
              {contextMenu.selectionInfo.selectionType !== 'edge' && (
                <>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                    onClick={() => sendContextQuery('info')}
                  >
                    <Box className="w-4 h-4 text-slate-500" />
                    Get Info
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                    onClick={() => sendContextQuery('fillet')}
                  >
                    <Sparkles className="w-4 h-4 text-slate-500" />
                    Apply Fillet
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                    onClick={() => sendContextQuery('chamfer')}
                  >
                    <Hexagon className="w-4 h-4 text-slate-500" />
                    Apply Chamfer
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                    onClick={() => sendContextQuery('extrude')}
                  >
                    <ArrowUp className="w-4 h-4 text-slate-500" />
                    Extrude Face
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                    onClick={() => sendContextQuery('duplicate')}
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                    Duplicate
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2"
                    onClick={() => sendContextQuery('color')}
                  >
                    <Palette className="w-4 h-4 text-slate-500" />
                    Change Color
                  </button>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                      onClick={() => sendContextQuery('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Selected face indicator */}
          {selectedFaceInfo && (
            <div className="absolute top-4 left-4 bg-green-500/90 text-white text-sm px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>
                <strong>{selectedFaceInfo.faceName}</strong> of {selectedFaceInfo.featureName}
              </span>
              <button
                onClick={() => setSelectedFaceInfo(null)}
                className="ml-2 hover:bg-white/20 rounded p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Selected edge indicator */}
          {selectedEdgeInfo && (
            <div className="absolute top-4 left-4 bg-amber-500/90 text-white text-sm px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>
                <strong>{selectedEdgeInfo.edgeName}</strong> of {selectedEdgeInfo.featureName}
              </span>
              <button
                onClick={() => applyFilletToEdge(selectedEdgeInfo, 3)}
                className="ml-2 bg-green-600 hover:bg-green-700 rounded px-2 py-0.5 text-xs font-medium"
              >
                Fillet
              </button>
              <button
                onClick={() => applyChamferToEdge(selectedEdgeInfo, 2)}
                className="bg-amber-600 hover:bg-amber-700 rounded px-2 py-0.5 text-xs font-medium"
              >
                Chamfer
              </button>
              <button
                onClick={() => setSelectedEdgeInfo(null)}
                className="ml-1 hover:bg-white/20 rounded p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Chat */}
        <aside
          className="bg-white border-l border-slate-200 flex flex-col overflow-hidden flex-shrink-0"
          style={{
            width: rightPanelOpen ? '320px' : '0px',
            minWidth: rightPanelOpen ? '320px' : '0px',
            transition: 'width 200ms ease-out, min-width 200ms ease-out'
          }}
        >
          <div className="w-80 flex flex-col h-full" style={{ opacity: rightPanelOpen ? 1 : 0, transition: 'opacity 150ms ease-out' }}>
            <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-600" />
                AI Assistant
              </h2>
            </div>

            <ScrollArea className="flex-1" ref={chatScrollRef}>
              <div className="p-3 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <ChatMessage key={idx} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                      <span className="text-sm text-slate-500">Generating...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Image Preview */}
            {imagePreview && (
              <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="max-h-24 rounded-lg border border-slate-200"
                  />
                  <button
                    onClick={clearUploadedImage}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {isAnalyzingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                {imageAnalysis && (
                  <p className="text-xs text-green-600 mt-1 font-medium">Image analyzed - ready to create!</p>
                )}
              </div>
            )}

            <div className="p-3 border-t border-slate-200 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
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
                  className="flex-1"
                />
                <Button
                  className="bg-brand-600 hover:bg-brand-700"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  data-send-btn
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

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
