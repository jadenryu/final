/**
 * 3D Printing Slicer Integration
 * Uses @jgphilpott/polyslice for G-code generation
 */

import type { Feature } from '../cad/store'

// Export unit types
export type ExportUnit = 'mm' | 'cm' | 'm' | 'in'

// Conversion factors to mm (G-code standard is mm)
export const UNIT_TO_MM: Record<ExportUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
}

// Convert value from source unit to mm
export function toMM(value: number, fromUnit: ExportUnit): number {
  return value * UNIT_TO_MM[fromUnit]
}

// Convert value from mm to target unit
export function fromMM(value: number, toUnit: ExportUnit): number {
  return value / UNIT_TO_MM[toUnit]
}

// Convert position array from source unit to mm
export function positionToMM(
  position: [number, number, number],
  fromUnit: ExportUnit
): [number, number, number] {
  const factor = UNIT_TO_MM[fromUnit]
  return [position[0] * factor, position[1] * factor, position[2] * factor]
}

// Get unit display label
export function getUnitLabel(unit: ExportUnit): string {
  switch (unit) {
    case 'mm':
      return 'Millimeters (mm)'
    case 'cm':
      return 'Centimeters (cm)'
    case 'm':
      return 'Meters (m)'
    case 'in':
      return 'Inches (in)'
  }
}

// Printer presets for cura-wasm (using fdmprinter as base)
// Each preset has Cura-compatible settings overrides
export interface PrinterPreset {
  id: string
  name: string
  size: { x: number; y: number; z: number }
  nozzle: number
  heated_bed: boolean
  // Cura overrides for this printer
  overrides: Record<string, string | number | boolean>
}

export const PRINTER_PRESETS: PrinterPreset[] = [
  // Creality Ender 3
  {
    id: 'ender3',
    name: 'Creality Ender 3',
    size: { x: 220, y: 220, z: 250 },
    nozzle: 0.4,
    heated_bed: true,
    overrides: {
      machine_width: 220,
      machine_depth: 220,
      machine_height: 250,
      machine_heated_bed: true,
      machine_nozzle_size: 0.4,
      machine_head_with_fans_polygon: '[[0,0],[0,0],[0,0],[0,0]]',
    }
  },
  // Bambu Lab A1 Mini
  {
    id: 'bambu_a1_mini',
    name: 'Bambu Lab A1 Mini',
    size: { x: 180, y: 180, z: 180 },
    nozzle: 0.4,
    heated_bed: true,
    overrides: {
      machine_width: 180,
      machine_depth: 180,
      machine_height: 180,
      machine_heated_bed: true,
      machine_nozzle_size: 0.4,
      machine_max_feedrate_x: 500,
      machine_max_feedrate_y: 500,
      machine_max_feedrate_z: 20,
      machine_max_acceleration_x: 20000,
      machine_max_acceleration_y: 20000,
    }
  },
  // Prusa MK3S+
  {
    id: 'prusa_mk3s',
    name: 'Prusa i3 MK3S+',
    size: { x: 250, y: 210, z: 210 },
    nozzle: 0.4,
    heated_bed: true,
    overrides: {
      machine_width: 250,
      machine_depth: 210,
      machine_height: 210,
      machine_heated_bed: true,
      machine_nozzle_size: 0.4,
      machine_max_feedrate_x: 200,
      machine_max_feedrate_y: 200,
      machine_max_feedrate_z: 12,
    }
  },
  // Bambu Lab X1 Carbon
  {
    id: 'bambu_x1_carbon',
    name: 'Bambu Lab X1 Carbon',
    size: { x: 256, y: 256, z: 256 },
    nozzle: 0.4,
    heated_bed: true,
    overrides: {
      machine_width: 256,
      machine_depth: 256,
      machine_height: 256,
      machine_heated_bed: true,
      machine_nozzle_size: 0.4,
      machine_max_feedrate_x: 500,
      machine_max_feedrate_y: 500,
      machine_max_feedrate_z: 20,
      machine_max_acceleration_x: 20000,
      machine_max_acceleration_y: 20000,
    }
  },
  // Prusa MK4
  {
    id: 'prusa_mk4',
    name: 'Prusa MK4',
    size: { x: 250, y: 210, z: 220 },
    nozzle: 0.4,
    heated_bed: true,
    overrides: {
      machine_width: 250,
      machine_depth: 210,
      machine_height: 220,
      machine_heated_bed: true,
      machine_nozzle_size: 0.4,
      machine_max_feedrate_x: 300,
      machine_max_feedrate_y: 300,
      machine_max_feedrate_z: 15,
    }
  },
  // Bambu Lab A1
  {
    id: 'bambu_a1',
    name: 'Bambu Lab A1',
    size: { x: 256, y: 256, z: 256 },
    nozzle: 0.4,
    heated_bed: true,
    overrides: {
      machine_width: 256,
      machine_depth: 256,
      machine_height: 256,
      machine_heated_bed: true,
      machine_nozzle_size: 0.4,
      machine_max_feedrate_x: 500,
      machine_max_feedrate_y: 500,
      machine_max_feedrate_z: 20,
    }
  },
  // Bambu Lab P1S
  {
    id: 'bambu_p1s',
    name: 'Bambu Lab P1S',
    size: { x: 256, y: 256, z: 256 },
    nozzle: 0.4,
    heated_bed: true,
    overrides: {
      machine_width: 256,
      machine_depth: 256,
      machine_height: 256,
      machine_heated_bed: true,
      machine_nozzle_size: 0.4,
      machine_max_feedrate_x: 500,
      machine_max_feedrate_y: 500,
    }
  },
  // Creality Ender 3 V3
  {
    id: 'ender3_v3',
    name: 'Creality Ender 3 V3',
    size: { x: 220, y: 220, z: 250 },
    nozzle: 0.4,
    heated_bed: true,
    overrides: {
      machine_width: 220,
      machine_depth: 220,
      machine_height: 250,
      machine_heated_bed: true,
      machine_nozzle_size: 0.4,
      machine_max_feedrate_x: 500,
      machine_max_feedrate_y: 500,
    }
  },
]

// Filament presets from polyslice
export const FILAMENT_PRESETS = [
  { id: 'GenericPLA', name: 'Generic PLA', type: 'pla', nozzleTemp: 200, bedTemp: 60 },
  { id: 'GenericPETG', name: 'Generic PETG', type: 'petg', nozzleTemp: 240, bedTemp: 80 },
  { id: 'GenericABS', name: 'Generic ABS', type: 'abs', nozzleTemp: 240, bedTemp: 100 },
  { id: 'GenericTPU', name: 'Generic TPU', type: 'tpu', nozzleTemp: 220, bedTemp: 60 },
  { id: 'HatchboxPLA', name: 'Hatchbox PLA', type: 'pla', nozzleTemp: 205, bedTemp: 60 },
  { id: 'eSunPLAPlus', name: 'eSun PLA+', type: 'pla', nozzleTemp: 210, bedTemp: 60 },
  { id: 'PrusamentPLA', name: 'Prusament PLA', type: 'pla', nozzleTemp: 215, bedTemp: 60 },
  { id: 'PrusamentPETG', name: 'Prusament PETG', type: 'petg', nozzleTemp: 245, bedTemp: 85 },
  { id: 'BambuLabPLABasic', name: 'Bambu Lab PLA Basic', type: 'pla', nozzleTemp: 210, bedTemp: 60 },
  { id: 'PolymakerPolyLitePLA', name: 'Polymaker PolyLite PLA', type: 'pla', nozzleTemp: 210, bedTemp: 60 },
]

// Infill patterns
export const INFILL_PATTERNS = [
  { id: 'grid', name: 'Grid' },
  { id: 'triangles', name: 'Triangles' },
  { id: 'hexagons', name: 'Hexagons' },
]

// Slicer settings interface
export interface SlicerSettings {
  printer: string
  filament: string
  layerHeight: number        // mm (0.1 - 0.4)
  infillDensity: number      // % (0 - 100)
  infillPattern: string
  wallThickness: number      // number of walls
  topLayers: number
  bottomLayers: number
  printSpeed: number         // mm/s
  travelSpeed: number        // mm/s
  supportEnabled: boolean
  supportDensity: number     // %
  adhesionType: 'none' | 'skirt' | 'brim' | 'raft'
  retraction: boolean
  retractionDistance: number // mm
  retractionSpeed: number    // mm/s
}

// Default settings
export const DEFAULT_SLICER_SETTINGS: SlicerSettings = {
  printer: 'ender3',
  filament: 'GenericPLA',
  layerHeight: 0.2,
  infillDensity: 20,
  infillPattern: 'grid',
  wallThickness: 2,
  topLayers: 4,
  bottomLayers: 4,
  printSpeed: 50,
  travelSpeed: 150,
  supportEnabled: false,
  supportDensity: 15,
  adhesionType: 'skirt',
  retraction: true,
  retractionDistance: 5,
  retractionSpeed: 45,
}

// G-code layer for visualization
export interface GCodeLayer {
  z: number
  paths: GCodePath[]
}

export interface GCodePath {
  type: 'wall' | 'infill' | 'support' | 'travel' | 'skin'
  points: [number, number, number][]
  extruding: boolean
}

// Parse G-code into layers for visualization
export function parseGCodeToLayers(gcode: string): GCodeLayer[] {
  const lines = gcode.split('\n')
  const layers: GCodeLayer[] = []
  let currentZ = 0
  let currentLayer: GCodeLayer = { z: 0, paths: [] }
  let currentPath: GCodePath = { type: 'wall', points: [], extruding: false }
  let currentX = 0
  let currentY = 0
  let isExtruding = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip comments and empty lines
    if (trimmed.startsWith(';') || trimmed === '') continue

    // Parse G0/G1 move commands
    if (trimmed.startsWith('G0') || trimmed.startsWith('G1')) {
      const isG1 = trimmed.startsWith('G1')

      // Extract coordinates
      const xMatch = trimmed.match(/X([0-9.-]+)/)
      const yMatch = trimmed.match(/Y([0-9.-]+)/)
      const zMatch = trimmed.match(/Z([0-9.-]+)/)
      const eMatch = trimmed.match(/E([0-9.-]+)/)

      if (xMatch) currentX = parseFloat(xMatch[1])
      if (yMatch) currentY = parseFloat(yMatch[1])

      // Z change = new layer
      if (zMatch) {
        const newZ = parseFloat(zMatch[1])
        if (newZ !== currentZ) {
          // Save current layer and start new one
          if (currentPath.points.length > 0) {
            currentLayer.paths.push(currentPath)
          }
          if (currentLayer.paths.length > 0) {
            layers.push(currentLayer)
          }
          currentZ = newZ
          currentLayer = { z: newZ, paths: [] }
          currentPath = { type: 'wall', points: [], extruding: false }
        }
      }

      // Determine if extruding
      const newExtruding = isG1 && eMatch !== null

      // If extrusion state changed, save current path and start new
      if (newExtruding !== isExtruding) {
        if (currentPath.points.length > 0) {
          currentLayer.paths.push(currentPath)
        }
        currentPath = {
          type: newExtruding ? 'wall' : 'travel',
          points: [[currentX, currentY, currentZ]],
          extruding: newExtruding
        }
        isExtruding = newExtruding
      } else {
        currentPath.points.push([currentX, currentY, currentZ])
      }
    }
  }

  // Save final path and layer
  if (currentPath.points.length > 0) {
    currentLayer.paths.push(currentPath)
  }
  if (currentLayer.paths.length > 0) {
    layers.push(currentLayer)
  }

  return layers
}

// Estimate print time from G-code
export function estimatePrintTime(gcode: string): { hours: number; minutes: number } {
  // Look for time estimate comment from slicer
  const timeMatch = gcode.match(/;.*time.*[:=]\s*(\d+)/i)
  if (timeMatch) {
    const seconds = parseInt(timeMatch[1])
    return {
      hours: Math.floor(seconds / 3600),
      minutes: Math.floor((seconds % 3600) / 60)
    }
  }

  // Fallback: estimate based on line count and average move time
  const lines = gcode.split('\n').filter(l => l.startsWith('G0') || l.startsWith('G1'))
  const estimatedSeconds = lines.length * 0.1 // rough estimate
  return {
    hours: Math.floor(estimatedSeconds / 3600),
    minutes: Math.floor((estimatedSeconds % 3600) / 60)
  }
}

// Estimate filament usage from G-code
export function estimateFilamentUsage(gcode: string): { meters: number; grams: number } {
  // Look for filament estimate comment
  const lengthMatch = gcode.match(/;.*filament.*[:=]\s*([0-9.]+)\s*m/i)
  if (lengthMatch) {
    const meters = parseFloat(lengthMatch[1])
    // PLA density ~1.24g/cm³, 1.75mm filament
    const grams = meters * 100 * Math.PI * (0.0875 ** 2) * 1.24
    return { meters, grams: Math.round(grams * 10) / 10 }
  }

  // Fallback: estimate from E values
  let totalE = 0
  const lines = gcode.split('\n')
  for (const line of lines) {
    const eMatch = line.match(/E([0-9.]+)/)
    if (eMatch) {
      const e = parseFloat(eMatch[1])
      if (e > totalE) totalE = e
    }
  }

  const meters = totalE / 1000
  const grams = meters * 100 * Math.PI * (0.0875 ** 2) * 1.24
  return { meters: Math.round(meters * 10) / 10, grams: Math.round(grams * 10) / 10 }
}

// Convert features to scene description for AI
export function featuresToSceneDescription(features: Feature[]): string {
  const shapes = features.map(f => {
    const content = f.patch?.content as any
    if (!content) return null

    const type = content.primitive || content.type || 'unknown'
    const dims = []
    if (content.width) dims.push(`width: ${content.width}mm`)
    if (content.height) dims.push(`height: ${content.height}mm`)
    if (content.depth) dims.push(`depth: ${content.depth}mm`)
    if (content.radius) dims.push(`radius: ${content.radius}mm`)

    const pos = content.position || [0, 0, 0]

    return `- ${type}: ${dims.join(', ')} at position (${pos[0]}, ${pos[1]}, ${pos[2]})`
  }).filter(Boolean)

  return shapes.length > 0
    ? `Model contains ${shapes.length} shape(s):\n${shapes.join('\n')}`
    : 'Empty model'
}
