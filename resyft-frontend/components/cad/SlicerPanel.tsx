"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { ScrollArea } from '../ui/scroll-area'
import {
  Loader2,
  Download,
  Sparkles,
  Printer,
  Settings2,
  Layers,
  Grid3X3,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import {
  PRINTER_PRESETS,
  FILAMENT_PRESETS,
  INFILL_PATTERNS,
  DEFAULT_SLICER_SETTINGS,
  type SlicerSettings,
  type GCodeLayer,
  type ExportUnit,
  type PrinterPreset,
  parseGCodeToLayers,
  estimatePrintTime,
  estimateFilamentUsage,
  UNIT_TO_MM,
} from '../../lib/slicer/slicer'
import type { Feature } from '../../lib/cad/store'
import * as THREE from 'three'
import { useKiriSlicer } from './KiriSlicer'

interface SlicerPanelProps {
  features: Feature[]
  onClose: () => void
  onGCodeGenerated?: (gcode: string, layers: GCodeLayer[]) => void
  onShowLayers?: (show: boolean) => void
  projectUnits?: ExportUnit
}

// Convert Three.js mesh to binary STL
function meshToSTL(mesh: THREE.Mesh): ArrayBuffer {
  const geometry = mesh.geometry

  // Make sure we have a non-indexed geometry
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry
  const positions = nonIndexed.getAttribute('position')
  const numTriangles = positions.count / 3

  // STL binary format:
  // 80 bytes header
  // 4 bytes number of triangles (uint32)
  // For each triangle:
  //   12 bytes normal (3 floats)
  //   36 bytes vertices (9 floats)
  //   2 bytes attribute byte count (uint16)
  const bufferSize = 80 + 4 + numTriangles * 50
  const buffer = new ArrayBuffer(bufferSize)
  const dataView = new DataView(buffer)

  // Write header (80 bytes of zeros)
  // Header can be anything, just zeros is fine

  // Write number of triangles
  dataView.setUint32(80, numTriangles, true)

  let offset = 84
  const v1 = new THREE.Vector3()
  const v2 = new THREE.Vector3()
  const v3 = new THREE.Vector3()
  const normal = new THREE.Vector3()
  const edge1 = new THREE.Vector3()
  const edge2 = new THREE.Vector3()

  for (let i = 0; i < numTriangles; i++) {
    const idx = i * 3

    v1.fromBufferAttribute(positions, idx)
    v2.fromBufferAttribute(positions, idx + 1)
    v3.fromBufferAttribute(positions, idx + 2)

    // Calculate normal
    edge1.subVectors(v2, v1)
    edge2.subVectors(v3, v1)
    normal.crossVectors(edge1, edge2).normalize()

    // Write normal
    dataView.setFloat32(offset, normal.x, true); offset += 4
    dataView.setFloat32(offset, normal.y, true); offset += 4
    dataView.setFloat32(offset, normal.z, true); offset += 4

    // Write vertices
    dataView.setFloat32(offset, v1.x, true); offset += 4
    dataView.setFloat32(offset, v1.y, true); offset += 4
    dataView.setFloat32(offset, v1.z, true); offset += 4

    dataView.setFloat32(offset, v2.x, true); offset += 4
    dataView.setFloat32(offset, v2.y, true); offset += 4
    dataView.setFloat32(offset, v2.z, true); offset += 4

    dataView.setFloat32(offset, v3.x, true); offset += 4
    dataView.setFloat32(offset, v3.y, true); offset += 4
    dataView.setFloat32(offset, v3.z, true); offset += 4

    // Write attribute byte count (0)
    dataView.setUint16(offset, 0, true); offset += 2
  }

  return buffer
}

// Simple built-in slicer - generates real G-code from mesh geometry
function sliceMesh(
  mesh: THREE.Mesh,
  settings: SlicerSettings,
  printerPreset: PrinterPreset | undefined,
  filamentPreset: { nozzleTemp: number; bedTemp: number } | undefined,
  onProgress?: (progress: number) => void
): string {
  const geometry = mesh.geometry
  const nozzleTemp = filamentPreset?.nozzleTemp || 200
  const bedTemp = filamentPreset?.bedTemp || 60
  const printerSize = printerPreset?.size || { x: 220, y: 220, z: 250 }
  const nozzleDiameter = printerPreset?.nozzle || 0.4

  // Calculate bounding box
  geometry.computeBoundingBox()
  const bbox = geometry.boundingBox!
  const minZ = bbox.min.z
  const maxZ = bbox.max.z
  const modelHeight = maxZ - minZ
  const numLayers = Math.ceil(modelHeight / settings.layerHeight)

  // Get triangles from geometry
  const posAttr = geometry.getAttribute('position')
  const triangles: Array<{ v0: THREE.Vector3; v1: THREE.Vector3; v2: THREE.Vector3 }> = []

  if (geometry.index) {
    const index = geometry.index
    for (let i = 0; i < index.count; i += 3) {
      triangles.push({
        v0: new THREE.Vector3(posAttr.getX(index.getX(i)), posAttr.getY(index.getX(i)), posAttr.getZ(index.getX(i))),
        v1: new THREE.Vector3(posAttr.getX(index.getX(i + 1)), posAttr.getY(index.getX(i + 1)), posAttr.getZ(index.getX(i + 1))),
        v2: new THREE.Vector3(posAttr.getX(index.getX(i + 2)), posAttr.getY(index.getX(i + 2)), posAttr.getZ(index.getX(i + 2))),
      })
    }
  } else {
    for (let i = 0; i < posAttr.count; i += 3) {
      triangles.push({
        v0: new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)),
        v1: new THREE.Vector3(posAttr.getX(i + 1), posAttr.getY(i + 1), posAttr.getZ(i + 1)),
        v2: new THREE.Vector3(posAttr.getX(i + 2), posAttr.getY(i + 2), posAttr.getZ(i + 2)),
      })
    }
  }

  // G-code header
  const lines: string[] = [
    '; G-code generated by modlr',
    `; Printer: ${printerPreset?.name || 'Generic'}`,
    `; Layer height: ${settings.layerHeight}mm`,
    `; Infill: ${settings.infillDensity}%`,
    `; Walls: ${settings.wallThickness}`,
    '',
    'G28 ; Home all axes',
    'G90 ; Absolute positioning',
    'M82 ; Extruder absolute mode',
    `M104 S${nozzleTemp} ; Set nozzle temp`,
    `M140 S${bedTemp} ; Set bed temp`,
    `M109 S${nozzleTemp} ; Wait for nozzle temp`,
    `M190 S${bedTemp} ; Wait for bed temp`,
    'G92 E0 ; Reset extruder',
    'G1 Z5 F3000 ; Lift nozzle',
    '',
  ]

  let totalE = 0
  const filamentDiameter = 1.75
  const filamentArea = Math.PI * (filamentDiameter / 2) ** 2
  const extrusionWidth = nozzleDiameter * 1.2
  const extrusionArea = extrusionWidth * settings.layerHeight

  // Center model on build plate
  const offsetX = printerSize.x / 2 - (bbox.min.x + bbox.max.x) / 2
  const offsetY = printerSize.y / 2 - (bbox.min.y + bbox.max.y) / 2

  // Slice each layer
  for (let layerNum = 0; layerNum < numLayers; layerNum++) {
    const z = minZ + layerNum * settings.layerHeight + settings.layerHeight / 2
    const layerZ = (layerNum + 1) * settings.layerHeight

    onProgress?.(Math.round((layerNum / numLayers) * 100))

    // Find intersections with this Z plane
    const segments: Array<{ p1: { x: number; y: number }; p2: { x: number; y: number } }> = []

    for (const tri of triangles) {
      const intersections: { x: number; y: number }[] = []
      const edges = [[tri.v0, tri.v1], [tri.v1, tri.v2], [tri.v2, tri.v0]]

      for (const [a, b] of edges) {
        if ((a.z <= z && b.z >= z) || (a.z >= z && b.z <= z)) {
          if (Math.abs(b.z - a.z) > 0.0001) {
            const t = (z - a.z) / (b.z - a.z)
            if (t >= 0 && t <= 1) {
              intersections.push({
                x: a.x + t * (b.x - a.x) + offsetX,
                y: a.y + t * (b.y - a.y) + offsetY,
              })
            }
          }
        }
      }

      if (intersections.length >= 2) {
        segments.push({ p1: intersections[0], p2: intersections[1] })
      }
    }

    if (segments.length === 0) continue

    lines.push(`; Layer ${layerNum + 1}/${numLayers}`)
    lines.push(`G0 F${settings.travelSpeed * 60} Z${layerZ.toFixed(3)}`)

    // Print perimeters (walls)
    for (let wall = 0; wall < settings.wallThickness; wall++) {
      const inset = wall * nozzleDiameter

      for (const seg of segments) {
        const dx = seg.p2.x - seg.p1.x
        const dy = seg.p2.y - seg.p1.y
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len < 0.1) continue

        const nx = -dy / len * inset
        const ny = dx / len * inset

        const x1 = seg.p1.x + nx
        const y1 = seg.p1.y + ny
        const x2 = seg.p2.x + nx
        const y2 = seg.p2.y + ny

        // Retraction
        if (settings.retraction && totalE > 0) {
          totalE -= settings.retractionDistance
          lines.push(`G1 F${settings.retractionSpeed * 60} E${totalE.toFixed(4)}`)
        }

        // Travel to start
        lines.push(`G0 F${settings.travelSpeed * 60} X${x1.toFixed(3)} Y${y1.toFixed(3)}`)

        // Unretract
        if (settings.retraction) {
          totalE += settings.retractionDistance
          lines.push(`G1 F${settings.retractionSpeed * 60} E${totalE.toFixed(4)}`)
        }

        // Extrude to end
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        totalE += (dist * extrusionArea) / filamentArea
        lines.push(`G1 F${settings.printSpeed * 60} X${x2.toFixed(3)} Y${y2.toFixed(3)} E${totalE.toFixed(4)}`)
      }
    }

    // Infill (alternating grid)
    if (settings.infillDensity > 0 && layerNum > 0 && layerNum < numLayers - 1) {
      const spacing = nozzleDiameter / (settings.infillDensity / 100)
      const minX = bbox.min.x + offsetX + nozzleDiameter * settings.wallThickness
      const maxX = bbox.max.x + offsetX - nozzleDiameter * settings.wallThickness
      const minY = bbox.min.y + offsetY + nozzleDiameter * settings.wallThickness
      const maxY = bbox.max.y + offsetY - nozzleDiameter * settings.wallThickness

      if (layerNum % 2 === 0) {
        for (let y = minY; y <= maxY; y += spacing) {
          if (settings.retraction) {
            totalE -= settings.retractionDistance
            lines.push(`G1 F${settings.retractionSpeed * 60} E${totalE.toFixed(4)}`)
          }
          lines.push(`G0 F${settings.travelSpeed * 60} X${minX.toFixed(3)} Y${y.toFixed(3)}`)
          if (settings.retraction) {
            totalE += settings.retractionDistance
            lines.push(`G1 F${settings.retractionSpeed * 60} E${totalE.toFixed(4)}`)
          }
          totalE += ((maxX - minX) * extrusionArea) / filamentArea
          lines.push(`G1 F${settings.printSpeed * 60} X${maxX.toFixed(3)} Y${y.toFixed(3)} E${totalE.toFixed(4)}`)
        }
      } else {
        for (let x = minX; x <= maxX; x += spacing) {
          if (settings.retraction) {
            totalE -= settings.retractionDistance
            lines.push(`G1 F${settings.retractionSpeed * 60} E${totalE.toFixed(4)}`)
          }
          lines.push(`G0 F${settings.travelSpeed * 60} X${x.toFixed(3)} Y${minY.toFixed(3)}`)
          if (settings.retraction) {
            totalE += settings.retractionDistance
            lines.push(`G1 F${settings.retractionSpeed * 60} E${totalE.toFixed(4)}`)
          }
          totalE += ((maxY - minY) * extrusionArea) / filamentArea
          lines.push(`G1 F${settings.printSpeed * 60} X${x.toFixed(3)} Y${maxY.toFixed(3)} E${totalE.toFixed(4)}`)
        }
      }
    }
  }

  // G-code footer
  lines.push('')
  lines.push('; End G-code')
  lines.push('G91 ; Relative positioning')
  lines.push('G1 E-2 F2700 ; Retract')
  lines.push('G1 Z10 F3000 ; Lift')
  lines.push('G90 ; Absolute positioning')
  lines.push('G28 X Y ; Home X Y')
  lines.push('M104 S0 ; Turn off nozzle')
  lines.push('M140 S0 ; Turn off bed')
  lines.push('M84 ; Disable steppers')
  lines.push('')
  lines.push(`; Filament used: ${(totalE / 1000).toFixed(2)}m`)
  lines.push(`; Estimated time: ${Math.ceil(numLayers * 0.5)} minutes`)

  onProgress?.(100)
  return lines.join('\n')
}

export default function SlicerPanel({
  features,
  onClose,
  onGCodeGenerated,
  onShowLayers,
  projectUnits = 'mm',
}: SlicerPanelProps) {
  const unitFactor = UNIT_TO_MM[projectUnits]
  const [settings, setSettings] = useState<SlicerSettings>(DEFAULT_SLICER_SETTINGS)
  const [isSlicing, setIsSlicing] = useState(false)
  const [sliceProgress, setSliceProgress] = useState(0)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [gcode, setGcode] = useState<string | null>(null)
  const [gcodeStats, setGcodeStats] = useState<{
    layers: number
    time: { hours: number; minutes: number }
    filament: { meters: number; grams: number }
  } | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showLayerPreview, setShowLayerPreview] = useState(false)
  const [aiReasoning, setAiReasoning] = useState<string | null>(null)
  const [sliceError, setSliceError] = useState<string | null>(null)
  const [useKiri, setUseKiri] = useState(true)  // Use Kiri:Moto by default

  const slicerRef = useRef<any>(null)

  // Kiri:Moto hidden iframe slicer
  const { KiriFrame, slice: kiriSlice, isReady: kiriReady, isSlicing: kiriSlicing } = useKiriSlicer()

  // Get AI-suggested settings
  const handleSuggestSettings = useCallback(async () => {
    if (features.length === 0) return

    setIsSuggesting(true)
    setAiReasoning(null)

    try {
      const response = await fetch('/api/slice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, action: 'suggest' })
      })

      const data = await response.json()

      if (data.success && data.suggestions) {
        setSettings(prev => ({
          ...prev,
          layerHeight: data.suggestions.layerHeight ?? prev.layerHeight,
          infillDensity: data.suggestions.infillDensity ?? prev.infillDensity,
          infillPattern: data.suggestions.infillPattern ?? prev.infillPattern,
          supportEnabled: data.suggestions.supportEnabled ?? prev.supportEnabled,
          adhesionType: data.suggestions.adhesionType ?? prev.adhesionType,
          printSpeed: data.suggestions.printSpeed ?? prev.printSpeed,
          wallThickness: data.suggestions.wallThickness ?? prev.wallThickness,
          topLayers: data.suggestions.topLayers ?? prev.topLayers,
          bottomLayers: data.suggestions.bottomLayers ?? prev.bottomLayers,
          travelSpeed: data.suggestions.travelSpeed ?? prev.travelSpeed,
          retraction: data.suggestions.retractionEnabled ?? prev.retraction,
          retractionDistance: data.suggestions.retractionDistance ?? prev.retractionDistance,
          retractionSpeed: data.suggestions.retractionSpeed ?? prev.retractionSpeed,
        }))
        setAiReasoning(data.suggestions.reasoning)
        setShowAdvanced(true)
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error)
    } finally {
      setIsSuggesting(false)
    }
  }, [features])

  // Build Three.js mesh from features
  const buildMeshFromFeatures = useCallback(() => {
    const group = new THREE.Group()

    console.log('Building mesh from features:', features)

    for (const f of features) {
      const content = f.patch?.content as any
      console.log('Processing feature:', f.id, 'content:', content, 'visible:', f.visible, 'suppressed:', f.suppressed)

      if (!content || !f.visible || f.suppressed) continue

      const primitive = content.primitive || content.type
      const pos = content.position || [0, 0, 0]

      const posX = pos[0] * unitFactor
      const posY = pos[1] * unitFactor
      const posZ = pos[2] * unitFactor

      let geometry: THREE.BufferGeometry | null = null

      // Handle 'cube' primitive (CubePrimitive uses 'dimensions' array)
      if (primitive === 'cube' || primitive === 'box') {
        let w: number, h: number, d: number
        if (content.dimensions && Array.isArray(content.dimensions)) {
          // CubePrimitive format: dimensions: [w, h, d]
          w = content.dimensions[0] * unitFactor
          h = content.dimensions[1] * unitFactor
          d = content.dimensions[2] * unitFactor
        } else {
          // Fallback: width/height/depth format
          w = (content.width || 10) * unitFactor
          h = (content.height || 10) * unitFactor
          d = (content.depth || 10) * unitFactor
        }
        geometry = new THREE.BoxGeometry(w, h, d)
        console.log('Created box geometry:', w, h, d)
      } else if (primitive === 'sphere') {
        const r = (content.radius || 5) * unitFactor
        geometry = new THREE.SphereGeometry(r, 32, 32)
        console.log('Created sphere geometry:', r)
      } else if (primitive === 'cylinder') {
        // CylinderPrimitive uses radiusTop, radiusBottom, height
        const rTop = (content.radiusTop ?? content.radius ?? 5) * unitFactor
        const rBottom = (content.radiusBottom ?? content.radius ?? 5) * unitFactor
        const h = (content.height || 10) * unitFactor
        const segments = content.radialSegments || 32
        geometry = new THREE.CylinderGeometry(rTop, rBottom, h, segments)
        console.log('Created cylinder geometry:', rTop, rBottom, h)
      } else if (primitive === 'cone') {
        const r = (content.radiusBottom ?? content.radius ?? 5) * unitFactor
        const h = (content.height || 10) * unitFactor
        geometry = new THREE.ConeGeometry(r, h, 32)
        console.log('Created cone geometry:', r, h)
      } else if (primitive === 'torus') {
        const r = (content.radius || 5) * unitFactor
        const tube = (content.tubeRadius || content.tube || 2) * unitFactor
        geometry = new THREE.TorusGeometry(r, tube, 16, 48)
        console.log('Created torus geometry:', r, tube)
      } else if (primitive === 'boolean') {
        // Handle boolean operations (union, subtract, intersect)
        console.log('Creating boolean geometry:', content.operation)

        // Import CSG library inline
        const { Brush, Evaluator, SUBTRACTION, ADDITION, INTERSECTION } = require('three-bvh-csg')

        // Create operandA geometry
        const createOperandGeom = (operand: any): THREE.BufferGeometry => {
          const p = operand.primitive
          if (p === 'cube' || p === 'box') {
            return new THREE.BoxGeometry(
              (operand.width || 10) * unitFactor,
              (operand.height || 10) * unitFactor,
              (operand.depth || 10) * unitFactor
            )
          } else if (p === 'cylinder') {
            return new THREE.CylinderGeometry(
              (operand.radius || 5) * unitFactor,
              (operand.radius || 5) * unitFactor,
              (operand.height || 10) * unitFactor,
              32
            )
          } else if (p === 'sphere') {
            return new THREE.SphereGeometry((operand.radius || 5) * unitFactor, 32, 32)
          }
          return new THREE.BoxGeometry(10, 10, 10)
        }

        const geomA = createOperandGeom(content.operandA)
        const geomB = createOperandGeom(content.operandB)

        const brushA = new Brush(geomA)
        const brushB = new Brush(geomB)

        // Apply positions
        if (content.operandA.position) {
          brushA.position.set(
            content.operandA.position[0] * unitFactor,
            content.operandA.position[1] * unitFactor,
            content.operandA.position[2] * unitFactor
          )
        }
        if (content.operandB.position) {
          brushB.position.set(
            content.operandB.position[0] * unitFactor,
            content.operandB.position[1] * unitFactor,
            content.operandB.position[2] * unitFactor
          )
        }

        // Apply rotations
        if (content.operandB.rotation) {
          brushB.rotation.set(
            (content.operandB.rotation[0] || 0) * Math.PI / 180,
            (content.operandB.rotation[1] || 0) * Math.PI / 180,
            (content.operandB.rotation[2] || 0) * Math.PI / 180
          )
        }

        brushA.updateMatrixWorld()
        brushB.updateMatrixWorld()

        const evaluator = new Evaluator()
        const operation = content.operation === 'subtract' ? SUBTRACTION :
                         content.operation === 'union' ? ADDITION : INTERSECTION

        const result = evaluator.evaluate(brushA, brushB, operation)
        geometry = result.geometry
        console.log('Created boolean geometry with', geometry.attributes.position.count, 'vertices')
      } else {
        console.log('Unknown primitive type:', primitive)
      }

      if (geometry) {
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(posX, posY, posZ)

        if (content.rotation) {
          mesh.rotation.set(
            content.rotation[0] || 0,
            content.rotation[1] || 0,
            content.rotation[2] || 0
          )
        }

        group.add(mesh)
      }
    }

    console.log('Group children count:', group.children.length)

    if (group.children.length === 0) return null

    if (group.children.length === 1) {
      const mesh = group.children[0] as THREE.Mesh
      // Rotate Y-up to Z-up for 3D printing
      mesh.rotation.x = -Math.PI / 2
      mesh.updateMatrix()
      mesh.geometry.applyMatrix4(mesh.matrix)
      mesh.rotation.set(0, 0, 0)
      mesh.position.set(0, 0, 0)
      mesh.updateMatrix()
      return mesh
    }

    // Merge multiple meshes
    const geometries: THREE.BufferGeometry[] = []
    group.children.forEach((child) => {
      const mesh = child as THREE.Mesh
      const geom = mesh.geometry.clone()
      const rotationMatrix = new THREE.Matrix4().makeRotationX(-Math.PI / 2)
      mesh.updateMatrix()
      const combinedMatrix = new THREE.Matrix4().multiplyMatrices(rotationMatrix, mesh.matrix)
      geom.applyMatrix4(combinedMatrix)
      geometries.push(geom)
    })

    const positions: number[] = []
    geometries.forEach(geom => {
      const posAttr = geom.getAttribute('position')
      if (posAttr) {
        for (let i = 0; i < posAttr.count; i++) {
          positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i))
        }
      }
    })

    const mergedGeometry = new THREE.BufferGeometry()
    mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    mergedGeometry.computeVertexNormals()

    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    return new THREE.Mesh(mergedGeometry, material)
  }, [features, unitFactor])

  // Slice the model using Kiri:Moto or built-in slicer
  const handleSlice = useCallback(async () => {
    if (features.length === 0) return

    setIsSlicing(true)
    setSliceError(null)
    setSliceProgress(0)

    try {
      // Build mesh
      const mesh = buildMeshFromFeatures()
      if (!mesh) {
        throw new Error('No valid mesh to slice')
      }

      setSliceProgress(10)

      // Get printer preset
      const printerPreset = PRINTER_PRESETS.find(p => p.id === settings.printer)
      const filamentPreset = FILAMENT_PRESETS.find(f => f.id === settings.filament)

      let generatedGcode: string

      // Use Kiri:Moto if ready and enabled
      if (useKiri && kiriReady) {
        console.log('Using Kiri:Moto slicer...')

        // Convert mesh to STL binary
        const stlData = meshToSTL(mesh)

        // Slice with Kiri:Moto
        generatedGcode = await kiriSlice(
          stlData,
          {
            layerHeight: settings.layerHeight,
            infillDensity: settings.infillDensity,
            printSpeed: settings.printSpeed,
            bedWidth: printerPreset?.size.x || 220,
            bedDepth: printerPreset?.size.y || 220,
            bedHeight: printerPreset?.size.z || 250,
          },
          (progress) => {
            setSliceProgress(10 + Math.round(progress * 0.9))
          }
        )
      } else {
        console.log('Using built-in slicer...')

        // Fallback to built-in slicer
        generatedGcode = sliceMesh(
          mesh,
          settings,
          printerPreset,
          filamentPreset,
          (progress) => {
            setSliceProgress(10 + Math.round(progress * 0.9))
          }
        )
      }

      setSliceProgress(100)
      setGcode(generatedGcode)

      // Parse stats
      const layers = parseGCodeToLayers(generatedGcode)
      const time = estimatePrintTime(generatedGcode)
      const filamentUsage = estimateFilamentUsage(generatedGcode)

      setGcodeStats({
        layers: layers.length,
        time,
        filament: filamentUsage
      })

      if (onGCodeGenerated) {
        onGCodeGenerated(generatedGcode, layers)
      }
    } catch (error) {
      console.error('Slicing failed:', error)
      setSliceError(error instanceof Error ? error.message : 'Slicing failed')
    } finally {
      setIsSlicing(false)
    }
  }, [features, settings, onGCodeGenerated, buildMeshFromFeatures, useKiri, kiriReady, kiriSlice])

  // Download G-code
  const handleDownload = useCallback(() => {
    if (!gcode) return

    const blob = new Blob([gcode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `model_${settings.printer}_${settings.layerHeight}mm.gcode`
    a.click()
    URL.revokeObjectURL(url)
  }, [gcode, settings])

  // Toggle layer preview
  const handleToggleLayerPreview = useCallback(() => {
    const newShow = !showLayerPreview
    setShowLayerPreview(newShow)
    if (onShowLayers) {
      onShowLayers(newShow)
    }
  }, [showLayerPreview, onShowLayers])

  const updateSetting = <K extends keyof SlicerSettings>(key: K, value: SlicerSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setGcode(null)
    setGcodeStats(null)
    setSliceError(null)
  }

  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-20 flex flex-col max-h-[calc(100vh-8rem)]">
      {/* Hidden Kiri:Moto iframe */}
      <KiriFrame />

      {/* Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-600" />
            3D Print Slicer
          </h3>
          {projectUnits !== 'mm' && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              {projectUnits} → mm
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* AI Suggestions Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSuggestSettings}
            disabled={isSuggesting || features.length === 0}
            className="w-full"
          >
            {isSuggesting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
            )}
            AI Suggest Settings
          </Button>

          {aiReasoning && (
            <div className="text-xs text-slate-500 bg-amber-50 p-2 rounded border border-amber-200">
              <strong>AI:</strong> {aiReasoning}
            </div>
          )}

          {/* Slicer Engine Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Slicer: {useKiri ? 'Kiri:Moto' : 'Built-in'}
              {useKiri && !kiriReady && <span className="text-amber-500 ml-1">(loading...)</span>}
              {useKiri && kiriReady && <span className="text-green-500 ml-1">(ready)</span>}
            </span>
            <button
              onClick={() => setUseKiri(!useKiri)}
              className="text-blue-600 hover:text-blue-700"
            >
              Switch
            </button>
          </div>

          {/* Printer Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">Printer</Label>
            <Select
              value={settings.printer}
              onValueChange={(v) => updateSetting('printer', v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRINTER_PRESETS.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filament Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">Filament</Label>
            <Select
              value={settings.filament}
              onValueChange={(v) => updateSetting('filament', v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILAMENT_PRESETS.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Layer Height */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Layers className="w-3 h-3" /> Layer Height
            </Label>
            <div className="flex gap-1">
              {[0.1, 0.15, 0.2, 0.3].map(h => (
                <button
                  key={h}
                  onClick={() => updateSetting('layerHeight', h)}
                  className={`flex-1 h-7 text-xs rounded border transition-colors ${
                    settings.layerHeight === h
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {h}mm
                </button>
              ))}
            </div>
          </div>

          {/* Infill */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Grid3X3 className="w-3 h-3" /> Infill: {settings.infillDensity}%
            </Label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.infillDensity}
              onChange={(e) => updateSetting('infillDensity', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Infill Pattern */}
          <div className="space-y-1.5">
            <Label className="text-xs">Infill Pattern</Label>
            <div className="flex gap-1">
              {INFILL_PATTERNS.map(p => (
                <button
                  key={p.id}
                  onClick={() => updateSetting('infillPattern', p.id)}
                  className={`flex-1 h-7 text-xs rounded border transition-colors ${
                    settings.infillPattern === p.id
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Supports Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Enable Supports</Label>
            <Switch
              checked={settings.supportEnabled}
              onCheckedChange={(v) => updateSetting('supportEnabled', v)}
            />
          </div>

          {/* Adhesion Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Bed Adhesion</Label>
            <div className="flex gap-1">
              {(['none', 'skirt', 'brim', 'raft'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => updateSetting('adhesionType', t)}
                  className={`flex-1 h-7 text-xs rounded border transition-colors capitalize ${
                    settings.adhesionType === t
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            {showAdvanced ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Settings2 className="w-3 h-3" />
            Advanced Settings
          </button>

          {showAdvanced && (
            <div className="space-y-3 pl-2 border-l-2 border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Walls</Label>
                  <Input
                    type="number"
                    value={settings.wallThickness}
                    onChange={(e) => updateSetting('wallThickness', Number(e.target.value))}
                    min={1}
                    max={10}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Top Layers</Label>
                  <Input
                    type="number"
                    value={settings.topLayers}
                    onChange={(e) => updateSetting('topLayers', Number(e.target.value))}
                    min={1}
                    max={20}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Print Speed (mm/s)</Label>
                  <Input
                    type="number"
                    value={settings.printSpeed}
                    onChange={(e) => updateSetting('printSpeed', Number(e.target.value))}
                    min={10}
                    max={150}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Travel Speed (mm/s)</Label>
                  <Input
                    type="number"
                    value={settings.travelSpeed}
                    onChange={(e) => updateSetting('travelSpeed', Number(e.target.value))}
                    min={50}
                    max={300}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Retraction</Label>
                <Switch
                  checked={settings.retraction}
                  onCheckedChange={(v) => updateSetting('retraction', v)}
                />
              </div>

              {settings.retraction && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Distance (mm)</Label>
                    <Input
                      type="number"
                      value={settings.retractionDistance}
                      onChange={(e) => updateSetting('retractionDistance', Number(e.target.value))}
                      min={0}
                      max={15}
                      step={0.5}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Speed (mm/s)</Label>
                    <Input
                      type="number"
                      value={settings.retractionSpeed}
                      onChange={(e) => updateSetting('retractionSpeed', Number(e.target.value))}
                      min={10}
                      max={100}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Slice Progress */}
          {isSlicing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Slicing...</span>
                <span>{sliceProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${sliceProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                This may take a minute...
              </p>
            </div>
          )}

          {/* Error */}
          {sliceError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700">{sliceError}</div>
            </div>
          )}

          {/* G-code Stats */}
          {gcodeStats && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
              <div className="text-sm font-medium text-green-800 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Sliced Successfully!
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-green-700">
                <div>
                  <div className="font-medium">{gcodeStats.layers}</div>
                  <div className="text-green-600">Layers</div>
                </div>
                <div>
                  <div className="font-medium">{gcodeStats.time.hours}h {gcodeStats.time.minutes}m</div>
                  <div className="text-green-600">Time</div>
                </div>
                <div>
                  <div className="font-medium">{gcodeStats.filament.grams}g</div>
                  <div className="text-green-600">Filament</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-200 space-y-2 flex-shrink-0">
        {gcode ? (
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download G-code
            </Button>
            <Button
              variant="outline"
              onClick={handleToggleLayerPreview}
              className={showLayerPreview ? 'bg-blue-100' : ''}
            >
              {showLayerPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSlice}
            disabled={isSlicing || features.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSlicing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Printer className="w-4 h-4 mr-2" />
            )}
            {isSlicing ? 'Slicing...' : 'Slice Model'}
          </Button>
        )}

        {features.length === 0 && (
          <p className="text-xs text-center text-slate-400">
            Add shapes to your model first
          </p>
        )}
      </div>
    </div>
  )
}
