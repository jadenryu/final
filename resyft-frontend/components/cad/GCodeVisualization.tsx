"use client"

import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { GCodeLayer } from '../../lib/slicer/slicer'

interface GCodeVisualizationProps {
  layers: GCodeLayer[]
  visible: boolean
  currentLayerIndex?: number // If set, only show up to this layer
  opacity?: number
}

// Colors for different path types
const PATH_COLORS = {
  wall: '#22c55e',      // Green for perimeters
  infill: '#3b82f6',    // Blue for infill
  support: '#f97316',   // Orange for support
  travel: '#a1a1aa',    // Gray for travel moves (non-extruding)
  skin: '#ec4899',      // Pink for top/bottom skin
}

export default function GCodeVisualization({
  layers,
  visible,
  currentLayerIndex,
  opacity = 0.8,
}: GCodeVisualizationProps) {
  if (!visible || layers.length === 0) return null

  // Determine which layers to show
  const visibleLayers = useMemo(() => {
    if (currentLayerIndex !== undefined) {
      return layers.slice(0, currentLayerIndex + 1)
    }
    return layers
  }, [layers, currentLayerIndex])

  return (
    <group name="gcode-visualization">
      {visibleLayers.map((layer, layerIdx) => (
        <group key={`layer-${layerIdx}`} position={[0, 0, 0]}>
          {layer.paths.map((path, pathIdx) => {
            if (path.points.length < 2) return null

            // Convert points to the format expected by Line
            // G-code uses Z for height, Three.js uses Y for height
            const linePoints = path.points.map(([x, y, z]) =>
              new THREE.Vector3(x, z, -y) // Swap Y and Z, negate Y for correct orientation
            )

            const color = PATH_COLORS[path.type] || PATH_COLORS.wall
            const lineWidth = path.extruding ? 2 : 0.5

            // Only show travel moves with low opacity
            if (!path.extruding) {
              return (
                <Line
                  key={`path-${layerIdx}-${pathIdx}`}
                  points={linePoints}
                  color={color}
                  lineWidth={lineWidth}
                  transparent
                  opacity={opacity * 0.3}
                  dashed
                  dashScale={2}
                  dashSize={1}
                  gapSize={1}
                />
              )
            }

            return (
              <Line
                key={`path-${layerIdx}-${pathIdx}`}
                points={linePoints}
                color={color}
                lineWidth={lineWidth}
                transparent
                opacity={opacity}
              />
            )
          })}
        </group>
      ))}
    </group>
  )
}

// Layer slider component for controlling which layers are visible
interface LayerSliderProps {
  totalLayers: number
  currentLayer: number
  onChange: (layer: number) => void
  onPlayPause?: () => void
  isPlaying?: boolean
}

export function LayerSlider({
  totalLayers,
  currentLayer,
  onChange,
  onPlayPause,
  isPlaying = false,
}: LayerSliderProps) {
  if (totalLayers === 0) return null

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white/95 rounded-lg shadow-lg border border-slate-200 p-3 min-w-[300px]">
      <div className="flex items-center gap-3">
        {onPlayPause && (
          <button
            onClick={onPlayPause}
            className="w-8 h-8 flex items-center justify-center rounded bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Layer {currentLayer + 1} of {totalLayers}</span>
            <span>Z: {((currentLayer + 1) * 0.2).toFixed(1)}mm</span>
          </div>
          <input
            type="range"
            min={0}
            max={totalLayers - 1}
            value={currentLayer}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-1 rounded" style={{ backgroundColor: PATH_COLORS.wall }} />
          Walls
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-1 rounded" style={{ backgroundColor: PATH_COLORS.infill }} />
          Infill
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-1 rounded" style={{ backgroundColor: PATH_COLORS.travel }} />
          Travel
        </span>
      </div>
    </div>
  )
}
