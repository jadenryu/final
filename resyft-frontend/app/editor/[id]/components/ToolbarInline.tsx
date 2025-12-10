"use client"

import { useState } from "react"
import { Button } from "../../../../components/ui/button"
import {
  MousePointer2,
  Move,
  RotateCcw,
  Maximize2,
  Hand,
  ZoomIn,
  Settings,
} from "lucide-react"

interface ToolbarInlineProps {
  selectedFeatureIds: string[]
  onToggleProperties: () => void
}

export function ToolbarInline({ selectedFeatureIds, onToggleProperties }: ToolbarInlineProps) {
  const [activeTool, setActiveTool] = useState<'select' | 'move' | 'rotate' | 'scale' | 'pan'>('select')

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-1 bg-white/95 rounded-lg shadow-lg p-1 border border-slate-200">
      <Button
        size="sm"
        variant={activeTool === 'select' ? 'default' : 'ghost'}
        className={`w-9 h-9 p-0 ${activeTool === 'select' ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
        onClick={() => setActiveTool('select')}
        title="Select (V)"
      >
        <MousePointer2 className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant={activeTool === 'move' ? 'default' : 'ghost'}
        className={`w-9 h-9 p-0 ${activeTool === 'move' ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
        onClick={() => setActiveTool('move')}
        title="Move (G)"
      >
        <Move className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant={activeTool === 'rotate' ? 'default' : 'ghost'}
        className={`w-9 h-9 p-0 ${activeTool === 'rotate' ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
        onClick={() => setActiveTool('rotate')}
        title="Rotate (R)"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant={activeTool === 'scale' ? 'default' : 'ghost'}
        className={`w-9 h-9 p-0 ${activeTool === 'scale' ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
        onClick={() => setActiveTool('scale')}
        title="Scale (S)"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>
      <div className="h-px bg-slate-200 my-1" />
      <Button
        size="sm"
        variant={activeTool === 'pan' ? 'default' : 'ghost'}
        className={`w-9 h-9 p-0 ${activeTool === 'pan' ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
        onClick={() => setActiveTool('pan')}
        title="Pan (H)"
      >
        <Hand className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="w-9 h-9 p-0"
        onClick={() => {/* Zoom to fit */}}
        title="Zoom to Fit (F)"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <div className="h-px bg-slate-200 my-1" />
      <Button
        size="sm"
        variant="ghost"
        className="w-9 h-9 p-0"
        onClick={onToggleProperties}
        title="Properties (P)"
        disabled={selectedFeatureIds.length === 0}
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  )
}
