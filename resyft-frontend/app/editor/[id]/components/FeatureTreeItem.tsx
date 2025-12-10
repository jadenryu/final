"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu"
import { useCADStore, type Feature } from "../../../../lib/cad/store"
import {
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
  Lock,
  Unlock,
  Play,
  Pause,
  Donut,
  Pencil,
  ArrowUp,
  RotateCw,
  Sparkles,
  Hexagon,
  Move,
  RotateCcw,
  Ruler,
  Palette,
} from "lucide-react"

interface FeatureTreeItemProps {
  feature: Feature
  projectId: string
  isSelected: boolean
  onSelect: (id: string) => void
}

function getFeatureIcon(feature: Feature) {
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

function getFeatureName(feature: Feature) {
  const content = feature.patch?.content as any
  const type = content?.type || content?.primitive || 'Shape'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function getDimensions(feature: Feature) {
  const content = feature.patch?.content as any
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

function getPosition(feature: Feature) {
  const content = feature.patch?.content as any
  const pos = content?.position || [0, 0, 0]
  return `X: ${pos[0]}, Y: ${pos[1]}, Z: ${pos[2]}`
}

function getRotation(feature: Feature) {
  const content = feature.patch?.content as any
  const rot = content?.rotation || [0, 0, 0]
  return `X: ${rot[0]}°, Y: ${rot[1]}°, Z: ${rot[2]}°`
}

export function FeatureTreeItem({
  feature,
  projectId,
  isSelected,
  onSelect,
}: FeatureTreeItemProps) {
  const { toggleFeatureVisibility, toggleFeatureSuppression, deleteFeature, updateFeature } = useCADStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  const content = feature.patch?.content as any

  return (
    <div className={feature.suppressed ? 'opacity-50' : ''}>
      <div
        className={`flex flex-col gap-1 px-2 py-2 rounded-md cursor-pointer group transition-colors ${
          isSelected
            ? 'bg-teal-100 text-teal-900 border border-teal-300'
            : 'hover:bg-slate-100 border border-transparent'
        }`}
        onClick={() => onSelect(feature.id)}
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

          <span className={`flex-shrink-0 ${feature.visible ? 'text-teal-600' : 'text-slate-400'}`}>
            {getFeatureIcon(feature)}
          </span>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {getFeatureName(feature)}
            </div>
            <div className="text-xs text-slate-500 font-mono truncate">
              {feature.id}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDetails(!showDetails)
            }}
            className="p-1 hover:bg-slate-200 rounded transition-colors opacity-0 group-hover:opacity-100"
            title={showDetails ? 'Hide Details' : 'Show Details'}
          >
            {showDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

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
                <button type="button" className="p-1 hover:bg-slate-200 rounded transition-colors" title="More options" aria-label="More options">
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

        {/* Detailed information panel */}
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-start gap-2">
              <Ruler className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-slate-500 font-medium">Dimensions</div>
                <div className="text-slate-700 font-mono">{getDimensions(feature)}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Move className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-slate-500 font-medium">Position</div>
                <div className="text-slate-700 font-mono text-[11px]">{getPosition(feature)}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <RotateCcw className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-slate-500 font-medium">Rotation</div>
                <div className="text-slate-700 font-mono text-[11px]">{getRotation(feature)}</div>
              </div>
            </div>

            {content?.color && (
              <div className="flex items-start gap-2">
                <Palette className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="text-slate-500 font-medium">Color</div>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: content?.color }}
                    />
                    <span className="text-slate-700 font-mono text-[11px]">
                      {content?.color}
                    </span>
                  </div>
                </div>
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
            isSelected={isSelected}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  )
}
