"use client"

import { Button } from "../../../../components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select"
import { Grid3X3, Move3d, Rotate3d } from "lucide-react"

type ViewMode = '3d' | 'front' | 'top' | 'right' | 'isometric'

interface ViewControlsProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  showGrid: boolean
  onToggleGrid: () => void
  gridSize: number
  onGridSizeChange: (size: number) => void
}

export function ViewControls({
  viewMode,
  onViewModeChange,
  showGrid,
  onToggleGrid,
  gridSize,
  onGridSizeChange,
}: ViewControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 flex gap-1 bg-white/95 rounded-lg shadow-lg p-1 border border-slate-200">
      <Button
        size="sm"
        variant={viewMode === '3d' ? 'default' : 'ghost'}
        className={viewMode === '3d' ? 'bg-teal-600 hover:bg-teal-700' : ''}
        onClick={() => onViewModeChange('3d')}
      >
        <Move3d className="w-4 h-4 mr-1" />
        3D
      </Button>
      <Button
        size="sm"
        variant={viewMode === 'front' ? 'default' : 'ghost'}
        className={viewMode === 'front' ? 'bg-teal-600 hover:bg-teal-700' : ''}
        onClick={() => onViewModeChange('front')}
      >
        Front
      </Button>
      <Button
        size="sm"
        variant={viewMode === 'top' ? 'default' : 'ghost'}
        className={viewMode === 'top' ? 'bg-teal-600 hover:bg-teal-700' : ''}
        onClick={() => onViewModeChange('top')}
      >
        Top
      </Button>
      <Button
        size="sm"
        variant={viewMode === 'right' ? 'default' : 'ghost'}
        className={viewMode === 'right' ? 'bg-teal-600 hover:bg-teal-700' : ''}
        onClick={() => onViewModeChange('right')}
      >
        Right
      </Button>
      <Button
        size="sm"
        variant={viewMode === 'isometric' ? 'default' : 'ghost'}
        className={viewMode === 'isometric' ? 'bg-teal-600 hover:bg-teal-700' : ''}
        onClick={() => onViewModeChange('isometric')}
      >
        <Rotate3d className="w-4 h-4 mr-1" />
        Iso
      </Button>

      <div className="w-px bg-slate-200 mx-1" />

      <Button
        size="sm"
        variant={showGrid ? 'default' : 'ghost'}
        className={showGrid ? 'bg-teal-600 hover:bg-teal-700' : ''}
        onClick={onToggleGrid}
        title="Toggle Grid"
      >
        <Grid3X3 className="w-4 h-4" />
      </Button>

      {showGrid && (
        <Select
          value={String(gridSize)}
          onValueChange={(value) => onGridSizeChange(Number(value))}
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
  )
}
