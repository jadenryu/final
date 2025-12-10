"use client"

import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { useCADStore, type Feature } from "../../../../lib/cad/store"
import {
  Settings,
  Move,
  RotateCcw,
  Maximize2,
  Palette,
} from "lucide-react"

interface PropertiesPanelProps {
  feature: Feature
  projectId: string
  onClose: () => void
}

export function PropertiesPanel({
  feature,
  projectId,
  onClose,
}: PropertiesPanelProps) {
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
          <Settings className="w-4 h-4 text-teal-600" />
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
            <Input
              type="color"
              value={content?.color || '#14b8a6'}
              onChange={(e) => updateContent({ color: e.target.value })}
              className="w-10 h-8 rounded border border-slate-200 cursor-pointer"
            />
            <Input
              type="text"
              value={content?.color || '#14b8a6'}
              onChange={(e) => updateContent({ color: e.target.value })}
              className="h-8 text-sm flex-1"
              placeholder="#14b8a6"
            />
          </div>
          {/* Quick color presets */}
          <div className="flex gap-1 flex-wrap">
            {['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#6b7280'].map(color => (
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
