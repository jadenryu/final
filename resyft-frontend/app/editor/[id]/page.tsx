"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
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
import { useCADStore, type Feature } from "../../../lib/cad/store"
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
  Grid3X3,
  Layers,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Lock,
  Unlock,
  Play,
  Pause,
  Move3d,
  Rotate3d,
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
} from "lucide-react"

// Dynamic import for Three.js canvas to avoid SSR issues
const ThreeCanvas = dynamic(() => import("../../../components/cad/ThreeCanvas"), {
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
  projectId,
  isSelected,
  onSelect,
  selectedFeatureIds,
  onSelectFeature,
}: {
  feature: Feature
  projectId: string
  isSelected: boolean
  onSelect: () => void
  selectedFeatureIds?: string[]
  onSelectFeature?: (id: string) => void
}) {
  const { toggleFeatureVisibility, toggleFeatureSuppression, deleteFeature, updateFeature } = useCADStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  const getFeatureIcon = () => {
    const content = feature.patch?.content as any
    const primitiveType = content?.type || content?.primitive

    switch (primitiveType) {
      case 'cube':
      case 'box':
        return <Box className="w-4 h-4" />
      case 'cylinder':
        return <Cylinder className="w-4 h-4" />
      case 'sphere':
        return <Circle className="w-4 h-4" />
      case 'cone':
      case 'pyramid':
        return <Triangle className="w-4 h-4" />
      case 'torus':
      case 'ring':
        return <Donut className="w-4 h-4" />
      case 'prism':
      case 'triangular_prism':
        return <Triangle className="w-4 h-4" />
      case 'hexagonal_prism':
      case 'hexagon':
      case 'octagonal_prism':
      case 'octagon':
      case 'pentagonal_prism':
      case 'pentagon':
      case 'custom_prism':
        return <Hexagon className="w-4 h-4" />
      case 'capsule':
      case 'pipe':
      case 'tube':
        return <Cylinder className="w-4 h-4" />
      case 'tetrahedron':
      case 'octahedron':
      case 'dodecahedron':
      case 'icosahedron':
        return <Hexagon className="w-4 h-4" />
      case 'hemisphere':
        return <Circle className="w-4 h-4" />
      case 'frustum':
      case 'truncated_cone':
        return <Triangle className="w-4 h-4" />
      case 'wedge':
        return <Triangle className="w-4 h-4" />
      case 'star':
        return <Sparkles className="w-4 h-4" />
      case 'sketch':
        return <Pencil className="w-4 h-4" />
      case 'extrude':
        return <ArrowUp className="w-4 h-4" />
      case 'revolve':
        return <RotateCw className="w-4 h-4" />
      case 'fillet':
        return <Sparkles className="w-4 h-4" />
      case 'chamfer':
        return <Hexagon className="w-4 h-4" />
      default:
        return <Box className="w-4 h-4" />
    }
  }

  const getFeatureName = () => {
    const content = feature.patch?.content as any
    const type = content?.type || content?.primitive || 'Shape'
    // Capitalize first letter
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const getDimensions = () => {
    const content = feature.patch?.content as any
    const type = content?.type || content?.primitive
    const dims: string[] = []

    if (content?.width) dims.push(`W: ${content.width}`)
    if (content?.height) dims.push(`H: ${content.height}`)
    if (content?.depth) dims.push(`D: ${content.depth}`)
    if (content?.radius && !content?.tube) dims.push(`R: ${content.radius}`)
    if (content?.tube) {
      dims.push(`R: ${content.radius}`)
      dims.push(`T: ${content.tube}`)
    }
    if (content?.radiusTop) dims.push(`RT: ${content.radiusTop}`)
    if (content?.radiusBottom) dims.push(`RB: ${content.radiusBottom}`)

    return dims.length > 0 ? dims.join(', ') : 'No dimensions'
  }

  const getPosition = () => {
    const content = feature.patch?.content as any
    const pos = content?.position || [0, 0, 0]
    return `X: ${pos[0]}, Y: ${pos[1]}, Z: ${pos[2]}`
  }

  const getRotation = () => {
    const content = feature.patch?.content as any
    const rot = content?.rotation || [0, 0, 0]
    return `X: ${rot[0]}°, Y: ${rot[1]}°, Z: ${rot[2]}°`
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
          {feature.children?.length ? (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
              className="p-0.5 hover:bg-slate-200 rounded transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          <span className={`flex-shrink-0 ${isSelected ? 'text-amber-600' : feature.visible ? 'text-brand-600' : 'text-slate-400'}`}>
            {getFeatureIcon()}
          </span>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {getFeatureName()}
            </div>
            <div className="text-xs text-slate-500 font-mono truncate">
              {feature.id}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFeatureVisibility(projectId, feature.id) }}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
              title={feature.visible ? 'Hide' : 'Show'}
            >
              {feature.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteFeature(projectId, feature.id)
              }}
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
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault()
                  toggleFeatureSuppression(projectId, feature.id)
                }}>
                  {feature.suppressed ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                  {feature.suppressed ? 'Unsuppress' : 'Suppress'}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault()
                  updateFeature(projectId, feature.id, { locked: !feature.locked })
                }}>
                  {feature.locked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  {feature.locked ? 'Unlock' : 'Lock'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                    deleteFeature(projectId, feature.id)
                  }}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
                    value={(feature.patch?.content as any)?.position?.[0] || 0}
                    onChange={(e) => {
                      const pos = (feature.patch?.content as any)?.position || [0, 0, 0]
                      updateFeature(projectId, feature.id, {
                        patch: {
                          ...feature.patch,
                          content: { ...(feature.patch?.content as any), position: [Number(e.target.value), pos[1], pos[2]] }
                        }
                      })
                    }}
                    className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Y</label>
                  <input
                    type="number"
                    value={(feature.patch?.content as any)?.position?.[1] || 0}
                    onChange={(e) => {
                      const pos = (feature.patch?.content as any)?.position || [0, 0, 0]
                      updateFeature(projectId, feature.id, {
                        patch: {
                          ...feature.patch,
                          content: { ...(feature.patch?.content as any), position: [pos[0], Number(e.target.value), pos[2]] }
                        }
                      })
                    }}
                    className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Z</label>
                  <input
                    type="number"
                    value={(feature.patch?.content as any)?.position?.[2] || 0}
                    onChange={(e) => {
                      const pos = (feature.patch?.content as any)?.position || [0, 0, 0]
                      updateFeature(projectId, feature.id, {
                        patch: {
                          ...feature.patch,
                          content: { ...(feature.patch?.content as any), position: [pos[0], pos[1], Number(e.target.value)] }
                        }
                      })
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
                {(feature.patch?.content as any)?.width !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-400">W</label>
                    <input
                      type="number"
                      value={(feature.patch?.content as any)?.width || 10}
                      onChange={(e) => {
                        updateFeature(projectId, feature.id, {
                          patch: {
                            ...feature.patch,
                            content: { ...(feature.patch?.content as any), width: Number(e.target.value) }
                          }
                        })
                      }}
                      className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                      min={1}
                    />
                  </div>
                )}
                {(feature.patch?.content as any)?.height !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-400">H</label>
                    <input
                      type="number"
                      value={(feature.patch?.content as any)?.height || 10}
                      onChange={(e) => {
                        updateFeature(projectId, feature.id, {
                          patch: {
                            ...feature.patch,
                            content: { ...(feature.patch?.content as any), height: Number(e.target.value) }
                          }
                        })
                      }}
                      className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                      min={1}
                    />
                  </div>
                )}
                {(feature.patch?.content as any)?.depth !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-400">D</label>
                    <input
                      type="number"
                      value={(feature.patch?.content as any)?.depth || 10}
                      onChange={(e) => {
                        updateFeature(projectId, feature.id, {
                          patch: {
                            ...feature.patch,
                            content: { ...(feature.patch?.content as any), depth: Number(e.target.value) }
                          }
                        })
                      }}
                      className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                      min={1}
                    />
                  </div>
                )}
                {(feature.patch?.content as any)?.radius !== undefined && (
                  <div>
                    <label className="text-[10px] text-slate-400">R</label>
                    <input
                      type="number"
                      value={(feature.patch?.content as any)?.radius || 5}
                      onChange={(e) => {
                        updateFeature(projectId, feature.id, {
                          patch: {
                            ...feature.patch,
                            content: { ...(feature.patch?.content as any), radius: Number(e.target.value) }
                          }
                        })
                      }}
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
                    value={(feature.patch?.content as any)?.rotation?.[0] || 0}
                    onChange={(e) => {
                      const rot = (feature.patch?.content as any)?.rotation || [0, 0, 0]
                      updateFeature(projectId, feature.id, {
                        patch: {
                          ...feature.patch,
                          content: { ...(feature.patch?.content as any), rotation: [Number(e.target.value), rot[1], rot[2]] }
                        }
                      })
                    }}
                    className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Y°</label>
                  <input
                    type="number"
                    value={(feature.patch?.content as any)?.rotation?.[1] || 0}
                    onChange={(e) => {
                      const rot = (feature.patch?.content as any)?.rotation || [0, 0, 0]
                      updateFeature(projectId, feature.id, {
                        patch: {
                          ...feature.patch,
                          content: { ...(feature.patch?.content as any), rotation: [rot[0], Number(e.target.value), rot[2]] }
                        }
                      })
                    }}
                    className="w-full h-6 px-1 text-xs border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Z°</label>
                  <input
                    type="number"
                    value={(feature.patch?.content as any)?.rotation?.[2] || 0}
                    onChange={(e) => {
                      const rot = (feature.patch?.content as any)?.rotation || [0, 0, 0]
                      updateFeature(projectId, feature.id, {
                        patch: {
                          ...feature.patch,
                          content: { ...(feature.patch?.content as any), rotation: [rot[0], rot[1], Number(e.target.value)] }
                        }
                      })
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
                  value={(feature.patch?.content as any)?.color || '#3342d2'}
                  onChange={(e) => {
                    updateFeature(projectId, feature.id, {
                      patch: {
                        ...feature.patch,
                        content: { ...(feature.patch?.content as any), color: e.target.value }
                      }
                    })
                  }}
                  className="w-8 h-6 rounded border border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={(feature.patch?.content as any)?.color || '#3342d2'}
                  onChange={(e) => {
                    updateFeature(projectId, feature.id, {
                      patch: {
                        ...feature.patch,
                        content: { ...(feature.patch?.content as any), color: e.target.value }
                      }
                    })
                  }}
                  className="flex-1 h-6 px-1 text-xs font-mono border border-slate-200 rounded focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
              </div>
              {/* Color presets */}
              <div className="flex gap-1 flex-wrap">
                {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3342d2', '#3b82f6', '#a855f7', '#ec4899', '#ffffff', '#1f2937'].map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      updateFeature(projectId, feature.id, {
                        patch: {
                          ...feature.patch,
                          content: { ...(feature.patch?.content as any), color }
                        }
                      })
                    }}
                    className="w-5 h-5 rounded border border-slate-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Fillet - only for cube/box */}
            {(() => {
              const content = feature.patch?.content as any
              const type = content?.type || content?.primitive
              if (type !== 'cube' && type !== 'box') return null
              return (
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
                        updateFeature(projectId, feature.id, {
                          patch: {
                            ...feature.patch,
                            content: {
                              ...content,
                              fillet_radius: radius,
                              edge_fillets: []
                            }
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
                        onClick={() => {
                          updateFeature(projectId, feature.id, {
                            patch: {
                              ...feature.patch,
                              content: {
                                ...content,
                                fillet_radius: r,
                                edge_fillets: []
                              }
                            }
                          })
                        }}
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
                        onClick={() => {
                          updateFeature(projectId, feature.id, {
                            patch: {
                              ...feature.patch,
                              content: { ...content, edge_fillets: [], fillet_radius: 0 }
                            }
                          })
                        }}
                        className="underline hover:no-underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}

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
                  <Pause className="w-2.5 h-2.5" />
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

      {isExpanded && feature.children?.map(child => (
        <div key={child.id} className="ml-4">
          <FeatureTreeItem
            feature={child}
            projectId={projectId}
            isSelected={selectedFeatureIds?.includes(child.id) || false}
            onSelect={() => onSelectFeature?.(child.id)}
            selectedFeatureIds={selectedFeatureIds}
            onSelectFeature={onSelectFeature}
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
            ? 'bg-brand-600 text-white'
            : 'bg-slate-100 text-slate-900'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  )
}

// Properties Panel Component for editing selected feature
function PropertiesPanel({
  feature,
  projectId,
  onClose,
}: {
  feature: Feature
  projectId: string
  onClose: () => void
}) {
  const { updateFeature } = useCADStore()
  const content = feature.patch?.content as any

  const updateContent = (updates: any) => {
    updateFeature(projectId, feature.id, {
      patch: {
        ...feature.patch,
        content: { ...content, ...updates }
      }
    })
  }

  const type = content?.type || content?.primitive || 'cube'

  return (
    <div className="absolute top-4 right-4 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-10">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-600" />
          Properties
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="p-3 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Type display */}
        <div>
          <Label className="text-xs text-slate-500">Type</Label>
          <p className="text-sm font-medium capitalize">{type}</p>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500 flex items-center gap-1">
            <Move className="w-3 h-3" /> Position (mm)
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-slate-400">X</Label>
              <Input
                type="number"
                value={content?.position?.[0] || 0}
                onChange={(e) => updateContent({
                  position: [Number(e.target.value), content?.position?.[1] || 0, content?.position?.[2] || 0]
                })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Y</Label>
              <Input
                type="number"
                value={content?.position?.[1] || 0}
                onChange={(e) => updateContent({
                  position: [content?.position?.[0] || 0, Number(e.target.value), content?.position?.[2] || 0]
                })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Z</Label>
              <Input
                type="number"
                value={content?.position?.[2] || 0}
                onChange={(e) => updateContent({
                  position: [content?.position?.[0] || 0, content?.position?.[1] || 0, Number(e.target.value)]
                })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Rotation (degrees)
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-slate-400">X</Label>
              <Input
                type="number"
                value={content?.rotation?.[0] || 0}
                onChange={(e) => updateContent({
                  rotation: [Number(e.target.value), content?.rotation?.[1] || 0, content?.rotation?.[2] || 0]
                })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Y</Label>
              <Input
                type="number"
                value={content?.rotation?.[1] || 0}
                onChange={(e) => updateContent({
                  rotation: [content?.rotation?.[0] || 0, Number(e.target.value), content?.rotation?.[2] || 0]
                })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Z</Label>
              <Input
                type="number"
                value={content?.rotation?.[2] || 0}
                onChange={(e) => updateContent({
                  rotation: [content?.rotation?.[0] || 0, content?.rotation?.[1] || 0, Number(e.target.value)]
                })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Dimensions based on type */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500 flex items-center gap-1">
            <Maximize2 className="w-3 h-3" /> Dimensions (mm)
          </Label>

          {(type === 'cube' || type === 'box' || type === 'wedge') && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Width</Label>
                <Input
                  type="number"
                  value={content?.width || 10}
                  onChange={(e) => updateContent({ width: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Height</Label>
                <Input
                  type="number"
                  value={content?.height || 10}
                  onChange={(e) => updateContent({ height: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Depth</Label>
                <Input
                  type="number"
                  value={content?.depth || 10}
                  onChange={(e) => updateContent({ depth: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
            </div>
          )}

          {(type === 'sphere' || type === 'hemisphere' || type === 'dodecahedron' ||
            type === 'icosahedron' || type === 'octahedron' || type === 'tetrahedron') && (
            <div>
              <Label className="text-xs text-slate-400">Radius</Label>
              <Input
                type="number"
                value={content?.radius || 5}
                onChange={(e) => updateContent({ radius: Number(e.target.value) })}
                className="h-8 text-sm"
                min={1}
              />
            </div>
          )}

          {(type === 'cylinder' || type === 'cone' || type === 'pyramid' || type === 'prism' ||
            type === 'hexagonal_prism' || type === 'octagonal_prism' || type === 'capsule') && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Radius</Label>
                <Input
                  type="number"
                  value={content?.radius || 5}
                  onChange={(e) => updateContent({ radius: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Height</Label>
                <Input
                  type="number"
                  value={content?.height || 10}
                  onChange={(e) => updateContent({ height: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
            </div>
          )}

          {(type === 'torus' || type === 'pipe') && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Radius</Label>
                <Input
                  type="number"
                  value={content?.radius || 10}
                  onChange={(e) => updateContent({ radius: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Tube</Label>
                <Input
                  type="number"
                  value={content?.tube || 3}
                  onChange={(e) => updateContent({ tube: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={0.5}
                  step={0.5}
                />
              </div>
            </div>
          )}

          {type === 'frustum' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Top R</Label>
                <Input
                  type="number"
                  value={content?.radiusTop || 5}
                  onChange={(e) => updateContent({ radiusTop: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Bottom R</Label>
                <Input
                  type="number"
                  value={content?.radiusBottom || 10}
                  onChange={(e) => updateContent({ radiusBottom: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Height</Label>
                <Input
                  type="number"
                  value={content?.height || 15}
                  onChange={(e) => updateContent({ height: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
            </div>
          )}

          {type === 'star' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Radius</Label>
                <Input
                  type="number"
                  value={content?.radius || 10}
                  onChange={(e) => updateContent({ radius: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Depth</Label>
                <Input
                  type="number"
                  value={content?.depth || 5}
                  onChange={(e) => updateContent({ depth: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={1}
                />
              </div>
            </div>
          )}
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500 flex items-center gap-1">
            <Palette className="w-3 h-3" /> Color
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={content?.color || '#3342d2'}
              onChange={(e) => updateContent({ color: e.target.value })}
              className="w-10 h-8 rounded border border-slate-200 cursor-pointer"
            />
            <Input
              type="text"
              value={content?.color || '#3342d2'}
              onChange={(e) => updateContent({ color: e.target.value })}
              className="h-8 text-sm flex-1"
              placeholder="#3342d2"
            />
          </div>
          {/* Quick color presets */}
          <div className="flex gap-1 flex-wrap">
            {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3342d2', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#6b7280'].map(color => (
              <button
                key={color}
                onClick={() => updateContent({ color })}
                className="w-6 h-6 rounded border border-slate-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
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
    setActiveProject,
    editor,
    setSelectedFeatures,
    setViewMode,
    addFeature,
    deleteFeature,
    setIsGenerating,
    updateProject,
    exportProject,
  } = useCADStore()

  const [chatInput, setChatInput] = useState("")
  const [localMessages, setLocalMessages] = useState<{ role: string; content: string }[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Local state for both sidebars for consistent behavior
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [featureCounter, setFeatureCounter] = useState(1)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
  const [activeTool, setActiveTool] = useState<'select' | 'move' | 'rotate' | 'scale' | 'pan'>('select')

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const project = projects.find(p => p.id === projectId)

  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId)
    }
  }, [projectId, setActiveProject])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages])

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

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setLocalMessages(prev => [...prev, { role: 'assistant', content: 'Please select a valid image file (JPG, PNG).' }])
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Clear selected image
  const clearSelectedImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  // Analyze image and create CAD shapes
  const handleAnalyzeImage = async () => {
    if (!selectedImage || isAnalyzingImage || !project) return

    setIsAnalyzingImage(true)
    setLocalMessages(prev => [...prev, { role: 'user', content: `[Analyzing uploaded image: ${selectedImage.name}]` }])

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!data.success) {
        setLocalMessages(prev => [...prev, { role: 'assistant', content: `Failed to analyze image: ${data.error || 'Unknown error'}` }])
        return
      }

      // Add analysis result to chat
      setLocalMessages(prev => [...prev, {
        role: 'assistant',
        content: `I analyzed your image and found ${data.totalShapes} shape(s):\n\n${data.description}\n\nConfidence: ${data.confidence}`
      }])

      // Process patches and add features
      if (data.patches && data.patches.length > 0) {
        let counter = featureCounter

        data.patches.forEach((patch: any) => {
          const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          const featureId = `feat_${String(counter).padStart(3, '0')}_${uniqueSuffix}`

          const feature: Feature = {
            id: featureId,
            name: `${patch.content.primitive || 'Shape'} ${counter}`,
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
        })

        setFeatureCounter(counter)
        setLocalMessages(prev => [...prev, {
          role: 'assistant',
          content: `Created ${data.patches.length} shapes from the image. You can edit them in the feature tree on the left.`
        }])
      }

      // Clear the image after successful analysis
      clearSelectedImage()

    } catch (error) {
      console.error('Image analysis error:', error)
      setLocalMessages(prev => [...prev, { role: 'assistant', content: 'Failed to analyze image. Please try again.' }])
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || editor.isGenerating) return
  
    const userMessage = chatInput.trim()
    setChatInput("")
    setLocalMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsGenerating(true)
  
    try {
      // Build detailed scene context for the AI - include all shapes with their properties
      const sceneContext = project?.features.map(f => {
        const content = f.patch?.content as any
        if (!content) return null
        return {
          id: f.id,
          type: content.primitive || content.type || 'unknown',
          position: content.position || [0, 0, 0],
          rotation: content.rotation || [0, 0, 0],
          dimensions: {
            width: content.width,
            height: content.height,
            depth: content.depth,
            radius: content.radius,
            tube: content.tube,
            radiusTop: content.radiusTop,
            radiusBottom: content.radiusBottom,
          },
          color: content.color
        }
      }).filter(Boolean) || []

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: [
            // Only include user/assistant messages, not system messages
            ...localMessages.filter(m => m.role !== 'system').slice(-4).map(m => ({
              role: m.role,
              content: m.content
            }))
          ],
          sceneContext: sceneContext
        })
      })
  
      const data = await response.json()
  
      console.log('API Response:', data) // DEBUG: Check what we're getting back
  
      if (data.error) {
        setLocalMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.details || data.error}` }])
      } else {
        // Add the natural language response to chat
        setLocalMessages(prev => [...prev, { role: 'assistant', content: data.response }])
  
        console.log('Patches received:', data.patches) // DEBUG: Check patches
  
        // Process patches from the API response
        if (data.patches && data.patches.length > 0 && project) {
          // First pass: handle all DELETEs
          const deletions = data.patches.filter((p: any) => p.action === 'DELETE')
          const nonDeletions = data.patches.filter((p: any) => p.action !== 'DELETE')
          
          console.log('Processing deletions:', deletions.length)
          deletions.forEach((patch: any) => {
            console.log('Deleting feature:', patch.feature_id)
            deleteFeature(projectId, patch.feature_id)
          })
  
          // Get fresh project state after deletions
          const currentProject = projects.find(p => p.id === projectId)
          if (!currentProject) return
  
          // Calculate counter based on current state AFTER deletions
          const existingIds = currentProject.features.map(f => {
            const match = f.id.match(/feat_(\d+)/)
            return match ? parseInt(match[1]) : 0
          })
          const maxExistingId = existingIds.length > 0 ? Math.max(...existingIds) : 0
          let counter = Math.max(featureCounter, maxExistingId + 1)
  
          console.log('Starting counter:', counter, 'Max existing ID:', maxExistingId, 'Current features:', currentProject.features.length)
  
          // Second pass: handle INSERTs and REPLACEs
          nonDeletions.forEach((patch: any, index: number) => {
            console.log(`Processing patch ${index}:`, patch) // DEBUG
  
            if (patch.action === 'DELETE') {
              console.log('Deleting feature:', patch.feature_id)
              deleteFeature(projectId, patch.feature_id)
            } else if (patch.action === 'INSERT') {
              // Generate a truly unique feature ID with timestamp and random suffix
              const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
              let featureId = `feat_${String(counter).padStart(3, '0')}_${uniqueSuffix}`
              console.log('Inserting feature:', featureId, 'with content:', patch.content)

              const feature: Feature = {
                id: featureId,
                name: `${patch.content.primitive || 'Shape'} ${counter}`,
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
              const originalFeatureId = patch.feature_id
              const existingFeature = project.features.find(f => f.id === originalFeatureId)

              console.log('Replacing feature:', originalFeatureId, 'exists:', !!existingFeature)

              if (existingFeature) {
                deleteFeature(projectId, originalFeatureId)
              }

              // Generate new unique ID for replaced feature
              const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
              const newFeatureId = `feat_${String(counter).padStart(3, '0')}_${uniqueSuffix}`

              const feature: Feature = {
                id: newFeatureId,
                name: `${patch.content.primitive || 'Shape'} ${counter}`,
                type: 'primitive',
                visible: true,
                locked: false,
                suppressed: false,
                patch: {
                  feature_id: newFeatureId,
                  action: 'INSERT',
                  content: patch.content
                }
              }
              addFeature(projectId, feature)
              counter++
            }
          })
          
          console.log('Final counter:', counter) // DEBUG
          setFeatureCounter(counter)
        } else {
          console.log('No patches to process') // DEBUG
        }
      }
    } catch (error) {
      console.error('Chat error:', error) // DEBUG
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
          <Button onClick={() => router.push('/projects')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Top Toolbar */}
      <header className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/projects')}
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Projects
        </Button>

        <div className="h-6 w-px bg-slate-700" />

        <h1 className="text-sm font-medium text-white truncate max-w-xs">{project.name}</h1>

        <div className="flex-1" />

        {/* Sidebar toggles in toolbar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className={`text-slate-300 hover:text-white hover:bg-slate-700 ${leftSidebarOpen ? 'bg-slate-700' : ''}`}
          title="Toggle Features Panel"
        >
          {leftSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className={`text-slate-300 hover:text-white hover:bg-slate-700 ${rightSidebarOpen ? 'bg-slate-700' : ''}`}
          title="Toggle AI Chat"
        >
          {rightSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
        </Button>

        <div className="h-6 w-px bg-slate-700" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={() => {
              // Simple undo: delete the last feature
              if (project && project.features.length > 0) {
                const lastFeature = project.features[project.features.length - 1]
                deleteFeature(projectId, lastFeature.id)
              }
            }}
            disabled={!project || project.features.length === 0}
            title="Undo last action (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white hover:bg-slate-700 opacity-50 cursor-not-allowed"
            disabled
            title="Redo (coming soon)"
          >
            <Redo className="w-4 h-4" />
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
            <Button onClick={() => setShowSettingsDialog(false)} className="bg-brand-600 hover:bg-brand-700">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Feature Tree */}
        <aside
          className="bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0"
          style={{
            width: leftSidebarOpen ? '256px' : '0px',
            minWidth: leftSidebarOpen ? '256px' : '0px',
            transition: 'width 200ms ease-out, min-width 200ms ease-out'
          }}
        >
          <div className="w-64 flex flex-col h-full" style={{ opacity: leftSidebarOpen ? 1 : 0, transition: 'opacity 150ms ease-out' }}>
            <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                Features
              </h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {project.features.length}
              </span>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {project.features.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    <Box className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No features yet</p>
                    <p className="text-xs mt-1 text-slate-500">Use AI chat to create shapes</p>
                  </div>
                ) : (
                  project.features.map(feature => (
                    <FeatureTreeItem
                      key={feature.id}
                      feature={feature}
                      projectId={projectId}
                      isSelected={editor.selectedFeatureIds.includes(feature.id)}
                      onSelect={() => {
                        setSelectedFeatures([feature.id])
                        setShowPropertiesPanel(true)
                      }}
                      selectedFeatureIds={editor.selectedFeatureIds}
                      onSelectFeature={(id) => {
                        setSelectedFeatures([id])
                        setShowPropertiesPanel(true)
                      }}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Clear All Button */}
            {project.features.length > 0 && (
              <div className="p-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm("Clear all features?")) {
                      project.features.forEach(f => deleteFeature(projectId, f.id))
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

        {/* Canvas Area */}
        <div className="flex-1 relative bg-white">
          {/* Three.js Canvas */}
          <ThreeCanvas
            features={project.features}
            selectedFeatureIds={editor.selectedFeatureIds}
            viewMode={editor.viewMode}
            showGrid={project.settings.showGrid}
            showAxes={project.settings.showAxes}
            gridSize={project.settings.gridSize}
            onSelectFeature={(id) => {
              setSelectedFeatures([id])
              setShowPropertiesPanel(true)
            }}
          />

          {/* CAD Tool Toolbar - Left side vertical */}
          <div className="absolute top-4 left-4 flex flex-col gap-1 bg-white/95 rounded-lg shadow-lg p-1 border border-slate-200">
            <Button
              size="sm"
              variant="ghost"
              className={`w-9 h-9 p-0 ${activeTool === 'select' ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'hover:bg-slate-100'}`}
              onClick={() => setActiveTool('select')}
              title="Select (V)"
            >
              <MousePointer2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`w-9 h-9 p-0 ${activeTool === 'move' ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'hover:bg-slate-100'}`}
              onClick={() => {
                setActiveTool('move')
                // If a feature is selected, show move instructions
                if (editor.selectedFeatureIds.length > 0) {
                  setShowPropertiesPanel(true)
                }
              }}
              title="Move (G) - Select a shape and edit position in sidebar"
            >
              <Move className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`w-9 h-9 p-0 ${activeTool === 'rotate' ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'hover:bg-slate-100'}`}
              onClick={() => {
                setActiveTool('rotate')
                if (editor.selectedFeatureIds.length > 0) {
                  setShowPropertiesPanel(true)
                }
              }}
              title="Rotate (R) - Select a shape and edit rotation in sidebar"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`w-9 h-9 p-0 ${activeTool === 'scale' ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'hover:bg-slate-100'}`}
              onClick={() => {
                setActiveTool('scale')
                if (editor.selectedFeatureIds.length > 0) {
                  setShowPropertiesPanel(true)
                }
              }}
              title="Scale (S) - Select a shape and edit dimensions in sidebar"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <div className="h-px bg-slate-200 my-1" />
            <Button
              size="sm"
              variant="ghost"
              className={`w-9 h-9 p-0 ${activeTool === 'pan' ? 'bg-brand-100 text-brand-700 hover:bg-brand-200' : 'hover:bg-slate-100'}`}
              onClick={() => setActiveTool('pan')}
              title="Pan (H)"
            >
              <Hand className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-9 h-9 p-0 hover:bg-slate-100"
              onClick={() => {
                // Reset to 3D view which will reposition camera
                setViewMode('3d')
              }}
              title="Reset View (F)"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="h-px bg-slate-200 my-1" />
            <Button
              size="sm"
              variant="ghost"
              className="w-9 h-9 p-0 hover:bg-slate-100"
              onClick={() => {
                if (editor.selectedFeatureIds.length > 0) {
                  setShowPropertiesPanel(!showPropertiesPanel)
                }
              }}
              title="Properties (P)"
              disabled={editor.selectedFeatureIds.length === 0}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* View Controls Overlay - Bottom left */}
          <div className="absolute bottom-4 left-4 flex gap-1 bg-white/95 rounded-lg shadow-lg p-1 border border-slate-200">
            <Button
              size="sm"
              variant={editor.viewMode === '3d' ? 'default' : 'ghost'}
              className={editor.viewMode === '3d' ? 'bg-brand-600 hover:bg-brand-700' : ''}
              onClick={() => setViewMode('3d')}
            >
              <Move3d className="w-4 h-4 mr-1" />
              3D
            </Button>
            <Button
              size="sm"
              variant={editor.viewMode === 'front' ? 'default' : 'ghost'}
              className={editor.viewMode === 'front' ? 'bg-brand-600 hover:bg-brand-700' : ''}
              onClick={() => setViewMode('front')}
            >
              Front
            </Button>
            <Button
              size="sm"
              variant={editor.viewMode === 'top' ? 'default' : 'ghost'}
              className={editor.viewMode === 'top' ? 'bg-brand-600 hover:bg-brand-700' : ''}
              onClick={() => setViewMode('top')}
            >
              Top
            </Button>
            <Button
              size="sm"
              variant={editor.viewMode === 'right' ? 'default' : 'ghost'}
              className={editor.viewMode === 'right' ? 'bg-brand-600 hover:bg-brand-700' : ''}
              onClick={() => setViewMode('right')}
            >
              Right
            </Button>
            <Button
              size="sm"
              variant={editor.viewMode === 'isometric' ? 'default' : 'ghost'}
              className={editor.viewMode === 'isometric' ? 'bg-brand-600 hover:bg-brand-700' : ''}
              onClick={() => setViewMode('isometric')}
            >
              <Rotate3d className="w-4 h-4 mr-1" />
              Iso
            </Button>

            <div className="w-px bg-slate-200 mx-1" />

            {/* Grid controls */}
            <Button
              size="sm"
              variant={project.settings.showGrid ? 'default' : 'ghost'}
              className={project.settings.showGrid ? 'bg-brand-600 hover:bg-brand-700' : ''}
              onClick={() => updateProject(projectId, {
                settings: { ...project.settings, showGrid: !project.settings.showGrid }
              })}
              title="Toggle Grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>

            {/* Grid size selector */}
            {project.settings.showGrid && (
              <Select
                value={String(project.settings.gridSize)}
                onValueChange={(value) => updateProject(projectId, {
                  settings: { ...project.settings, gridSize: Number(value) }
                })}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5mm</SelectItem>
                  <SelectItem value="10">10mm</SelectItem>
                  <SelectItem value="20">20mm</SelectItem>
                  <SelectItem value="25">25mm</SelectItem>
                  <SelectItem value="50">50mm</SelectItem>
                  <SelectItem value="100">100mm</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Properties Panel */}
          {showPropertiesPanel && editor.selectedFeatureIds.length > 0 && (() => {
            const selectedFeature = project.features.find(f => f.id === editor.selectedFeatureIds[0])
            if (!selectedFeature) return null
            return (
              <PropertiesPanel
                feature={selectedFeature}
                projectId={projectId}
                onClose={() => setShowPropertiesPanel(false)}
              />
            )
          })()}
        </div>

        {/* Right Sidebar - Chat Panel */}
        <aside
          className="bg-white border-l border-slate-200 flex flex-col overflow-hidden flex-shrink-0"
          style={{
            width: rightSidebarOpen ? '320px' : '0px',
            minWidth: rightSidebarOpen ? '320px' : '0px',
            transition: 'width 200ms ease-out, min-width 200ms ease-out'
          }}
        >
          <div className="w-80 flex flex-col h-full" style={{ opacity: rightSidebarOpen ? 1 : 0, transition: 'opacity 150ms ease-out' }}>
            <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-600" />
                AI Assistant
              </h2>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {localMessages.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Describe what you want to create</p>
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
                      <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                      <span className="text-sm text-slate-500">Generating...</span>
                    </div>
                  </div>
                )}
                {isAnalyzingImage && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                      <span className="text-sm text-slate-500">Analyzing image...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-slate-200 flex-shrink-0 space-y-2">
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Selected image"
                    className="max-h-32 rounded-lg border border-slate-200"
                  />
                  <button
                    onClick={clearSelectedImage}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Input Row */}
              <div className="flex gap-2">
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                />

                {/* Image upload button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={editor.isGenerating || isAnalyzingImage}
                  title="Upload image to analyze"
                  className="flex-shrink-0"
                >
                  <ImagePlus className="w-4 h-4" />
                </Button>

                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={selectedImage ? "Add description or click Analyze..." : "Describe a shape..."}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={editor.isGenerating || isAnalyzingImage}
                  className="flex-1"
                />

                {/* Conditional button: Analyze if image selected, otherwise Send */}
                {selectedImage ? (
                  <Button
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzingImage}
                    className="bg-brand-600 hover:bg-brand-700"
                  >
                    {isAnalyzingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Analyze
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || editor.isGenerating}
                    className="bg-brand-600 hover:bg-brand-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Help text */}
              {selectedImage && (
                <p className="text-xs text-slate-500">
                  Upload an image of a geometric shape to recreate it as CAD
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
