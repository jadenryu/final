"use client"

import { useRef, useEffect, useMemo, useState, useCallback } from "react"
import { Canvas, useThree, ThreeEvent } from "@react-three/fiber"
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Line, Html, RoundedBox } from "@react-three/drei"
import * as THREE from "three"
import type { Feature } from "../../lib/cad/store"
import type { StudioFeature } from "../../lib/cad/studio-store"

// Union type to accept both Feature and StudioFeature
type AnyFeature = Feature | StudioFeature

// Face/Edge selection info
export interface SelectionInfo {
  featureId: string
  featureName: string
  featureType: string
  selectionType: 'face' | 'edge' | 'feature'
  faceIndex?: number
  faceName?: string
  edgeIndex?: number
  edgeName?: string
  position: [number, number, number]
  normal?: [number, number, number]
  edgeVertices?: [[number, number, number], [number, number, number]]
}

// Edge definition for a box
export interface BoxEdge {
  index: number
  name: string
  start: [number, number, number]
  end: [number, number, number]
  type: 'vertical' | 'horizontal-top' | 'horizontal-bottom'
}

// Get all 12 edges of a box
function getBoxEdges(width: number, height: number, depth: number): BoxEdge[] {
  const hw = width / 2
  const hh = height / 2
  const hd = depth / 2

  return [
    // Vertical edges (4)
    { index: 0, name: 'Front-Right Edge', start: [hw, -hh, hd], end: [hw, hh, hd], type: 'vertical' },
    { index: 1, name: 'Front-Left Edge', start: [-hw, -hh, hd], end: [-hw, hh, hd], type: 'vertical' },
    { index: 2, name: 'Back-Right Edge', start: [hw, -hh, -hd], end: [hw, hh, -hd], type: 'vertical' },
    { index: 3, name: 'Back-Left Edge', start: [-hw, -hh, -hd], end: [-hw, hh, -hd], type: 'vertical' },
    // Top horizontal edges (4)
    { index: 4, name: 'Top-Front Edge', start: [-hw, hh, hd], end: [hw, hh, hd], type: 'horizontal-top' },
    { index: 5, name: 'Top-Back Edge', start: [-hw, hh, -hd], end: [hw, hh, -hd], type: 'horizontal-top' },
    { index: 6, name: 'Top-Right Edge', start: [hw, hh, -hd], end: [hw, hh, hd], type: 'horizontal-top' },
    { index: 7, name: 'Top-Left Edge', start: [-hw, hh, -hd], end: [-hw, hh, hd], type: 'horizontal-top' },
    // Bottom horizontal edges (4)
    { index: 8, name: 'Bottom-Front Edge', start: [-hw, -hh, hd], end: [hw, -hh, hd], type: 'horizontal-bottom' },
    { index: 9, name: 'Bottom-Back Edge', start: [-hw, -hh, -hd], end: [hw, -hh, -hd], type: 'horizontal-bottom' },
    { index: 10, name: 'Bottom-Right Edge', start: [hw, -hh, -hd], end: [hw, -hh, hd], type: 'horizontal-bottom' },
    { index: 11, name: 'Bottom-Left Edge', start: [-hw, -hh, -hd], end: [-hw, -hh, hd], type: 'horizontal-bottom' },
  ]
}

// Find closest edge to a point on a box
function findClosestBoxEdge(
  point: THREE.Vector3,
  width: number,
  height: number,
  depth: number,
  position: [number, number, number],
  rotation: [number, number, number]
): BoxEdge | null {
  const edges = getBoxEdges(width, height, depth)

  // Convert point to local space
  const localPoint = point.clone()
  localPoint.sub(new THREE.Vector3(...position))

  // Apply inverse rotation
  const euler = new THREE.Euler(
    -rotation[0] * Math.PI / 180,
    -rotation[1] * Math.PI / 180,
    -rotation[2] * Math.PI / 180
  )
  localPoint.applyEuler(euler)

  let closestEdge: BoxEdge | null = null
  let minDistance = Infinity

  for (const edge of edges) {
    const start = new THREE.Vector3(...edge.start)
    const end = new THREE.Vector3(...edge.end)
    const edgeVec = end.clone().sub(start)
    const pointVec = localPoint.clone().sub(start)

    // Project point onto edge line
    const t = Math.max(0, Math.min(1, pointVec.dot(edgeVec) / edgeVec.lengthSq()))
    const closestPoint = start.clone().add(edgeVec.multiplyScalar(t))
    const distance = localPoint.distanceTo(closestPoint)

    if (distance < minDistance) {
      minDistance = distance
      closestEdge = edge
    }
  }

  // Only return if close enough to an edge (within ~5 units)
  return minDistance < 5 ? closestEdge : null
}

// Get face name from index for box geometry
function getBoxFaceName(faceIndex: number): string {
  const faceNames = ['Right (+X)', 'Left (-X)', 'Top (+Y)', 'Bottom (-Y)', 'Front (+Z)', 'Back (-Z)']
  const faceGroupIndex = Math.floor(faceIndex / 2)
  return faceNames[faceGroupIndex] || `Face ${faceIndex}`
}

// Get face name for cylinder/prism
function getCylinderFaceName(faceIndex: number, sides: number): string {
  if (faceIndex < sides * 2) {
    // Side faces
    const sideIndex = Math.floor(faceIndex / 2)
    return `Side ${sideIndex + 1}`
  } else if (faceIndex < sides * 2 + sides) {
    return 'Top'
  } else {
    return 'Bottom'
  }
}

// Get face normal from geometry and face index
function getFaceNormal(geometry: THREE.BufferGeometry, faceIndex: number): THREE.Vector3 {
  const normal = new THREE.Vector3()
  const normalAttribute = geometry.getAttribute('normal')
  if (normalAttribute) {
    const idx = faceIndex * 3
    normal.set(
      normalAttribute.getX(idx),
      normalAttribute.getY(idx),
      normalAttribute.getZ(idx)
    )
  }
  return normal.normalize()
}

// Helper to get content from either feature type
function getFeatureContent(feature: AnyFeature): any {
  if ('patch' in feature && feature.patch) {
    return feature.patch.content
  }
  if ('content' in feature) {
    return feature.content
  }
  return null
}

// Camera positions for different views
const CAMERA_VIEWS = {
  '3d': { position: [50, 50, 50], target: [0, 0, 0] },
  'front': { position: [0, 0, 100], target: [0, 0, 0] },
  'top': { position: [0, 100, 0], target: [0, 0, 0] },
  'right': { position: [100, 0, 0], target: [0, 0, 0] },
  'isometric': { position: [70, 70, 70], target: [0, 0, 0] },
}

// Helper to get sketch geometry from store features
function getSketchGeometry(sketchId: string, features: AnyFeature[]): { points: [number, number][]; plane: string } | null {
  const sketchFeature = features.find(f => f.id === sketchId)
  if (!sketchFeature) return null

  const content = getFeatureContent(sketchFeature)
  if (content?.primitive !== 'sketch' && content?.type !== 'sketch') return null

  const shapes = content.shapes || []
  const plane = content.plane || 'XY'
  const points: [number, number][] = []

  for (const shape of shapes) {
    if (shape.type === 'rectangle') {
      const { x, y, width, height } = shape
      points.push([x, y], [x + width, y], [x + width, y + height], [x, y + height])
    } else if (shape.type === 'circle') {
      const segments = 32
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2
        points.push([
          shape.cx + shape.radius * Math.cos(angle),
          shape.cy + shape.radius * Math.sin(angle)
        ])
      }
    } else if (shape.type === 'polygon') {
      points.push(...shape.points)
    }
  }

  return { points, plane }
}

// Individual shape component that respects visibility
function Shape({
  feature,
  isSelected,
  allFeatures,
  onSelect,
  onDoubleClick,
  onFaceSelect,
  onEdgeSelect,
  selectedFaceIndex,
  selectedEdgeIndex,
  onRightClick
}: {
  feature: AnyFeature
  isSelected: boolean
  allFeatures: AnyFeature[]
  onSelect?: (id: string) => void
  onDoubleClick?: (id: string) => void
  onFaceSelect?: (info: SelectionInfo) => void
  onEdgeSelect?: (info: SelectionInfo) => void
  selectedFaceIndex?: number
  selectedEdgeIndex?: number
  onRightClick?: (info: SelectionInfo, event: ThreeEvent<MouseEvent>) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hoveredFaceIndex, setHoveredFaceIndex] = useState<number | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<BoxEdge | null>(null)
  const content = getFeatureContent(feature)

  // Extract primitive values to use as dependencies
  const type = content?.type || content?.primitive || 'cube'
  const width = content?.width || 10
  const height = content?.height || 10
  const depth = content?.depth || content?.extrude_depth || 10
  const radius = content?.radius || 5
  const tube = content?.tube || 3
  const posX = content?.position?.[0] || 0
  const posY = content?.position?.[1] || 0
  const posZ = content?.position?.[2] || 0
  const rotX = ((content?.rotation?.[0] || 0) * Math.PI) / 180
  const rotY = ((content?.rotation?.[1] || 0) * Math.PI) / 180
  const rotZ = ((content?.rotation?.[2] || 0) * Math.PI) / 180
  const contentColor = content?.color || "#3342d2"

  // Fillet/chamfer specific values - for the shape itself
  const shapeFilletRadius = content?.fillet_radius || 0
  const shapeChamferDistance = content?.chamfer_distance || 0
  const edgeFillets = content?.edge_fillets || [] // Per-edge fillet data

  // For fillet/chamfer feature types
  const filletRadius = content?.fillet_radius || content?.radius || 2
  const chamferDistance = content?.chamfer_distance || content?.distance || 2
  const parentId = content?.parent_id
  const edgeIds = content?.edges || []

  // Extrude specific values
  const sketchId = content?.sketch_id
  const extrudeDepth = content?.depth || 10
  const bevel = content?.bevel

  // Revolve specific values
  const revolveAngle = content?.angle || 360
  const revolveSegments = content?.segments || 32
  const revolveAxis = content?.axis || 'Y'

  // Additional shape parameters
  const radiusTop = content?.radiusTop ?? radius
  const radiusBottom = content?.radiusBottom ?? radius
  const sides = content?.sides || 6
  const innerRadius = content?.innerRadius || (radius * 0.5)
  const outerRadius = content?.outerRadius || radius

  const color = isSelected ? "#f59e0b" : contentColor
  const emissive = isSelected ? "#f59e0b" : "#000000"
  const emissiveIntensity = isSelected ? 0.3 : 0

  // Check if this is a cube/box with uniform fillet (all edges) - use RoundedBox
  // If we have per-edge fillets, render them separately instead
  const hasPerEdgeFillets = edgeFillets.length > 0
  const isFilletedBox = (type === 'cube' || type === 'box') && shapeFilletRadius > 0 && !hasPerEdgeFillets

  const geometry = useMemo(() => {
    // Handle boolean operations (CSG)
    if (type === 'boolean') {
      try {
        const { Brush, Evaluator, SUBTRACTION, ADDITION, INTERSECTION } = require('three-bvh-csg')
        
        const operation = content?.operation || 'union'
        const operandA = content?.operandA
        const operandB = content?.operandB
        
        if (!operandA || !operandB) {
          console.error('Boolean operation missing operands')
          return new THREE.BoxGeometry(10, 10, 10)
        }
        
        // Create geometry for operand A
        const createGeometry = (operand: any) => {
          const p = operand.primitive
          if (p === 'cube' || p === 'box') {
            return new THREE.BoxGeometry(operand.width || 10, operand.height || 10, operand.depth || 10)
          } else if (p === 'cylinder') {
            return new THREE.CylinderGeometry(operand.radius || 5, operand.radius || 5, operand.height || 10, 32)
          } else if (p === 'sphere') {
            return new THREE.SphereGeometry(operand.radius || 5, 32, 32)
          } else if (p === 'cone') {
            return new THREE.ConeGeometry(operand.radius || 5, operand.height || 10, 32)
          }
          return new THREE.BoxGeometry(10, 10, 10)
        }
        
        const geomA = createGeometry(operandA)
        const geomB = createGeometry(operandB)
        
        const brushA = new Brush(geomA)
        const brushB = new Brush(geomB)
        
        // Apply positions
        if (operandA.position) {
          brushA.position.set(operandA.position[0], operandA.position[1], operandA.position[2])
        }
        if (operandB.position) {
          brushB.position.set(operandB.position[0], operandB.position[1], operandB.position[2])
        }
        
        // Apply rotations
        if (operandA.rotation) {
          brushA.rotation.set(
            (operandA.rotation[0] || 0) * Math.PI / 180,
            (operandA.rotation[1] || 0) * Math.PI / 180,
            (operandA.rotation[2] || 0) * Math.PI / 180
          )
        }
        if (operandB.rotation) {
          brushB.rotation.set(
            (operandB.rotation[0] || 0) * Math.PI / 180,
            (operandB.rotation[1] || 0) * Math.PI / 180,
            (operandB.rotation[2] || 0) * Math.PI / 180
          )
        }
        
        brushA.updateMatrixWorld()
        brushB.updateMatrixWorld()
        
        const evaluator = new Evaluator()
        const op = operation === 'subtract' ? SUBTRACTION :
                   operation === 'union' ? ADDITION : INTERSECTION
        
        const result = evaluator.evaluate(brushA, brushB, op)
        return result.geometry
      } catch (error) {
        console.error('Boolean operation failed:', error)
        return new THREE.BoxGeometry(10, 10, 10)
      }
    }
    
    switch (type) {
      case 'cube':
      case 'box':
        // Filleted boxes use RoundedBox component, so return null here
        if (shapeFilletRadius > 0) {
          return new THREE.BufferGeometry() // Placeholder, actual render uses RoundedBox
        }
        return new THREE.BoxGeometry(width, height, depth)
      case 'cylinder':
        return new THREE.CylinderGeometry(radius, radius, height, 32)
      case 'sphere':
        return new THREE.SphereGeometry(radius, 32, 32)
      case 'cone':
        return new THREE.ConeGeometry(radius, height, 32)
      case 'torus':
        return new THREE.TorusGeometry(radius, tube, 16, 100)

      // Additional primitives
      case 'pyramid':
        return new THREE.ConeGeometry(radius, height, 4)
      case 'prism':
      case 'triangular_prism':
        return new THREE.CylinderGeometry(radius, radius, height, 3)
      case 'hexagonal_prism':
      case 'hexagon':
        return new THREE.CylinderGeometry(radius, radius, height, 6)
      case 'octagonal_prism':
      case 'octagon':
        return new THREE.CylinderGeometry(radius, radius, height, 8)
      case 'pentagonal_prism':
      case 'pentagon':
        return new THREE.CylinderGeometry(radius, radius, height, 5)
      case 'custom_prism':
        // For any N-sided prism, use the 'sides' parameter
        return new THREE.CylinderGeometry(radius, radius, height, sides)
      case 'capsule':
        return new THREE.CapsuleGeometry(radius, height, 16, 32)
      case 'ring':
        return new THREE.TorusGeometry(outerRadius, innerRadius, 16, 100)
      case 'tube':
      case 'pipe':
        return new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -height/2, 0),
            new THREE.Vector3(0, height/2, 0)
          ]),
          64, tube, 32, false
        )
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(radius)
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(radius)
      case 'octahedron':
        return new THREE.OctahedronGeometry(radius)
      case 'tetrahedron':
        return new THREE.TetrahedronGeometry(radius)
      case 'frustum':
      case 'truncated_cone':
        return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32)
      case 'hemisphere':
        return new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
      case 'wedge': {
        // Create a wedge shape using ExtrudeGeometry
        const wedgeShape = new THREE.Shape()
        wedgeShape.moveTo(-width/2, -height/2)
        wedgeShape.lineTo(width/2, -height/2)
        wedgeShape.lineTo(width/2, height/2)
        wedgeShape.closePath()
        return new THREE.ExtrudeGeometry(wedgeShape, { depth: depth, bevelEnabled: false })
      }
      case 'star': {
        // 5-pointed star
        const starShape = new THREE.Shape()
        const outerR = radius
        const innerR = radius * 0.4
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR
          const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
          const x = r * Math.cos(angle)
          const y = r * Math.sin(angle)
          if (i === 0) starShape.moveTo(x, y)
          else starShape.lineTo(x, y)
        }
        starShape.closePath()
        return new THREE.ExtrudeGeometry(starShape, { depth: depth || 5, bevelEnabled: false })
      }

      case 'extrude': {
        // Get sketch geometry
        const sketchData = sketchId ? getSketchGeometry(sketchId, allFeatures) : null
        if (sketchData && sketchData.points.length >= 3) {
          const shape = new THREE.Shape()
          shape.moveTo(sketchData.points[0][0], sketchData.points[0][1])
          for (let i = 1; i < sketchData.points.length; i++) {
            shape.lineTo(sketchData.points[i][0], sketchData.points[i][1])
          }
          shape.closePath()

          const extrudeSettings: THREE.ExtrudeGeometryOptions = {
            depth: extrudeDepth,
            bevelEnabled: bevel?.enabled || false,
            bevelSize: bevel?.size || 0,
            bevelSegments: bevel?.segments || 1,
          }
          return new THREE.ExtrudeGeometry(shape, extrudeSettings)
        }
        // Fallback: create a simple box as placeholder
        return new THREE.BoxGeometry(width || 20, height || 20, extrudeDepth)
      }

      case 'revolve': {
        // Get sketch geometry
        const sketchData = sketchId ? getSketchGeometry(sketchId, allFeatures) : null
        if (sketchData && sketchData.points.length >= 2) {
          // Create a 2D profile for lathe
          const points: THREE.Vector2[] = sketchData.points.map(
            ([x, y]) => new THREE.Vector2(Math.abs(x), y)
          )
          const angleRad = (revolveAngle / 360) * Math.PI * 2
          return new THREE.LatheGeometry(points, revolveSegments, 0, angleRad)
        }
        // Fallback: create a simple cylinder
        return new THREE.CylinderGeometry(radius, radius, height, revolveSegments)
      }

      case 'fillet':
      case 'chamfer':
        // Fillet/chamfer are now applied directly to the parent shape
        // These cases are kept for backwards compatibility but shouldn't be created
        return new THREE.BufferGeometry()

      case 'sketch': {
        // Sketches are 2D and rendered differently - return null geometry
        return new THREE.BufferGeometry()
      }

      default:
        return new THREE.BoxGeometry(10, 10, 10)
    }
  }, [type, width, height, depth, radius, radiusTop, radiusBottom, tube, innerRadius, outerRadius, sketchId, extrudeDepth, bevel, revolveAngle, revolveSegments, filletRadius, chamferDistance, allFeatures])

  // Don't render if not visible or suppressed, but do this AFTER hooks
  if (!content || !feature.visible || feature.suppressed) {
    return null
  }

  // Special rendering for sketches (2D wireframe)
  if (type === 'sketch') {
    const shapes = content.shapes || []
    const plane = content.plane || 'XY'
    const sketchPosition = content.position || [0, 0, 0]

    return (
      <group position={[sketchPosition[0] || 0, sketchPosition[1] || 0, sketchPosition[2] || 0]}>
        {shapes.map((shape: any, idx: number) => {
          if (shape.type === 'rectangle') {
            const { x, y, width: w, height: h } = shape
            const points: [number, number, number][] = plane === 'XY'
              ? [[x, y, 0], [x + w, y, 0], [x + w, y + h, 0], [x, y + h, 0], [x, y, 0]]
              : plane === 'XZ'
              ? [[x, 0, y], [x + w, 0, y], [x + w, 0, y + h], [x, 0, y + h], [x, 0, y]]
              : [[0, x, y], [0, x + w, y], [0, x + w, y + h], [0, x, y + h], [0, x, y]]
            return <Line key={idx} points={points} color={color} lineWidth={2} />
          } else if (shape.type === 'circle') {
            const { cx, cy, radius: r } = shape
            const segments = 64
            const points: [number, number, number][] = []
            for (let i = 0; i <= segments; i++) {
              const angle = (i / segments) * Math.PI * 2
              const px = cx + r * Math.cos(angle)
              const py = cy + r * Math.sin(angle)
              if (plane === 'XY') points.push([px, py, 0])
              else if (plane === 'XZ') points.push([px, 0, py])
              else points.push([0, px, py])
            }
            return <Line key={idx} points={points} color={color} lineWidth={2} />
          } else if (shape.type === 'polygon' && shape.points?.length >= 2) {
            const pts = shape.points as [number, number][]
            const points: [number, number, number][] = pts.map(([px, py]) =>
              plane === 'XY' ? [px, py, 0] : plane === 'XZ' ? [px, 0, py] : [0, px, py]
            )
            points.push(points[0]) // Close the polygon
            return <Line key={idx} points={points} color={color} lineWidth={2} />
          }
          return null
        })}
      </group>
    )
  }

  // Don't render empty geometry (for fillet/chamfer markers on non-existent parents)
  if (geometry.attributes.position?.count === 0) {
    return null
  }

  // Get number of sides for prism types
  const getSides = () => {
    switch (type) {
      case 'prism':
      case 'triangular_prism':
        return 3
      case 'pyramid':
        return 4
      case 'pentagonal_prism':
      case 'pentagon':
        return 5
      case 'hexagonal_prism':
      case 'hexagon':
        return 6
      case 'octagonal_prism':
      case 'octagon':
        return 8
      case 'custom_prism':
        return sides
      case 'cylinder':
        return 32
      default:
        return 0
    }
  }

  // Get face name based on geometry type and face index
  const getFaceName = (faceIdx: number): string => {
    switch (type) {
      case 'cube':
      case 'box':
        return getBoxFaceName(faceIdx)
      case 'prism':
      case 'triangular_prism':
      case 'pyramid':
      case 'pentagonal_prism':
      case 'pentagon':
      case 'hexagonal_prism':
      case 'hexagon':
      case 'octagonal_prism':
      case 'octagon':
      case 'custom_prism':
      case 'cylinder':
        return getCylinderFaceName(faceIdx, getSides())
      case 'sphere':
        return `Surface (${faceIdx})`
      case 'cone':
        return faceIdx < 32 ? 'Side' : 'Base'
      default:
        return `Face ${faceIdx}`
    }
  }

  // Create selection info for faces
  const createFaceSelectionInfo = (faceIdx: number, point: THREE.Vector3): SelectionInfo => {
    const normal = getFaceNormal(geometry, faceIdx)
    return {
      featureId: feature.id,
      featureName: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
      featureType: type,
      selectionType: 'face',
      faceIndex: faceIdx,
      faceName: getFaceName(faceIdx),
      position: [point.x, point.y, point.z],
      normal: [normal.x, normal.y, normal.z]
    }
  }

  // Create selection info for edges
  const createEdgeSelectionInfo = (edge: BoxEdge, point: THREE.Vector3): SelectionInfo => {
    // Transform edge vertices to world space
    const rotation = content?.rotation || [0, 0, 0]
    const position = content?.position || [0, 0, 0]
    const euler = new THREE.Euler(
      rotation[0] * Math.PI / 180,
      rotation[1] * Math.PI / 180,
      rotation[2] * Math.PI / 180
    )

    const startWorld = new THREE.Vector3(...edge.start).applyEuler(euler).add(new THREE.Vector3(...position))
    const endWorld = new THREE.Vector3(...edge.end).applyEuler(euler).add(new THREE.Vector3(...position))

    return {
      featureId: feature.id,
      featureName: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
      featureType: type,
      selectionType: 'edge',
      edgeIndex: edge.index,
      edgeName: edge.name,
      position: [point.x, point.y, point.z],
      edgeVertices: [
        [startWorld.x, startWorld.y, startWorld.z],
        [endWorld.x, endWorld.y, endWorld.z]
      ]
    }
  }

  // Check if this is a box/cube type that supports edge selection
  const supportsEdgeSelection = type === 'cube' || type === 'box' || type === 'wedge'

  // Handle click with face/edge detection
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    // Get face index from intersection
    const faceIndex = e.faceIndex ?? 0

    // Check for edge selection on Ctrl+click for boxes
    if (e.ctrlKey && supportsEdgeSelection && onEdgeSelect) {
      const rotation = content?.rotation || [0, 0, 0]
      const position = content?.position || [0, 0, 0]
      const closestEdge = findClosestBoxEdge(e.point, width, height, depth, position, rotation)
      if (closestEdge) {
        const info = createEdgeSelectionInfo(closestEdge, e.point)
        onEdgeSelect(info)
        return
      }
    }

    if (e.shiftKey && onFaceSelect) {
      // Shift+click for face selection
      const info = createFaceSelectionInfo(faceIndex, e.point)
      onFaceSelect(info)
    }
    // Single click does nothing for feature selection - use double-click
  }

  // Handle double-click for whole feature selection
  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (onDoubleClick) {
      onDoubleClick(feature.id)
    }
  }

  // Handle right click for context menu
  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    const faceIndex = e.faceIndex ?? 0

    // Check for edge selection on right-click near edges for boxes
    if (supportsEdgeSelection) {
      const rotation = content?.rotation || [0, 0, 0]
      const position = content?.position || [0, 0, 0]
      const closestEdge = findClosestBoxEdge(e.point, width, height, depth, position, rotation)
      if (closestEdge) {
        const info = createEdgeSelectionInfo(closestEdge, e.point)
        if (onRightClick) {
          onRightClick(info, e)
        }
        return
      }
    }

    const info = createFaceSelectionInfo(faceIndex, e.point)

    if (onRightClick) {
      onRightClick(info, e)
    }
  }

  // Handle hover for face/edge highlighting
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const faceIndex = e.faceIndex ?? 0
    setHoveredFaceIndex(faceIndex)

    // Check for edge hovering on boxes when Ctrl is held or when close to edge
    if (supportsEdgeSelection) {
      const rotation = content?.rotation || [0, 0, 0]
      const position = content?.position || [0, 0, 0]
      const closestEdge = findClosestBoxEdge(e.point, width, height, depth, position, rotation)
      setHoveredEdge(closestEdge)
      if (closestEdge) {
        document.body.style.cursor = 'crosshair'
        return
      }
    }

    document.body.style.cursor = 'pointer'
  }

  // Determine if this face is highlighted
  const isFaceHighlighted = (faceIdx: number) => {
    return selectedFaceIndex === faceIdx || hoveredFaceIndex === faceIdx
  }

  return (
    <group>
      {/* Render filleted box using RoundedBox from drei */}
      {isFilletedBox ? (
        <RoundedBox
          ref={meshRef as any}
          args={[width, height, depth]}
          radius={shapeFilletRadius}
          smoothness={4}
          position={[posX, posY, posZ]}
          rotation={[rotX, rotY, rotZ]}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          onPointerMove={handlePointerMove}
          onPointerOut={() => {
            setHoveredFaceIndex(null)
            setHoveredEdge(null)
            document.body.style.cursor = 'default'
          }}
        >
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            roughness={0.4}
            metalness={0.1}
          />
        </RoundedBox>
      ) : (
        <mesh
          ref={meshRef}
          position={[posX, posY, posZ]}
          rotation={[rotX, rotY, rotZ]}
          geometry={geometry}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          onPointerMove={handlePointerMove}
          onPointerOut={() => {
            setHoveredFaceIndex(null)
            setHoveredEdge(null)
            document.body.style.cursor = 'default'
          }}
        >
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Face highlight overlay when hovering */}
      {isSelected && hoveredFaceIndex !== null && !isFilletedBox && (
        <mesh
          position={[posX, posY, posZ]}
          rotation={[rotX, rotY, rotZ]}
          geometry={geometry}
        >
          <meshBasicMaterial
            color="#22c55e"
            opacity={0.2}
            transparent
            depthTest={false}
            wireframe={false}
          />
        </mesh>
      )}

      {/* Render per-edge fillets as cylinders along the edges */}
      {edgeFillets.length > 0 && (type === 'cube' || type === 'box') && (
        <group position={[posX, posY, posZ]} rotation={[rotX, rotY, rotZ]}>
          {edgeFillets.map((fillet: { edgeIndex: number; radius: number; edgeName: string }) => {
            const edges = getBoxEdges(width, height, depth)
            const edge = edges.find(e => e.index === fillet.edgeIndex)
            if (!edge) return null

            // Calculate edge midpoint and length
            const midX = (edge.start[0] + edge.end[0]) / 2
            const midY = (edge.start[1] + edge.end[1]) / 2
            const midZ = (edge.start[2] + edge.end[2]) / 2
            const dx = edge.end[0] - edge.start[0]
            const dy = edge.end[1] - edge.start[1]
            const dz = edge.end[2] - edge.start[2]
            const edgeLength = Math.sqrt(dx * dx + dy * dy + dz * dz)

            // Calculate rotation to align cylinder with edge
            let cylRotation: [number, number, number] = [0, 0, 0]
            if (edge.type === 'vertical') {
              cylRotation = [0, 0, 0] // Cylinder default is vertical
            } else if (Math.abs(dx) > Math.abs(dz)) {
              cylRotation = [0, 0, Math.PI / 2] // Horizontal along X
            } else {
              cylRotation = [Math.PI / 2, 0, 0] // Horizontal along Z
            }

            return (
              <mesh
                key={`fillet-${fillet.edgeIndex}`}
                position={[midX, midY, midZ]}
                rotation={cylRotation}
              >
                <cylinderGeometry args={[fillet.radius, fillet.radius, edgeLength, 16]} />
                <meshStandardMaterial
                  color={contentColor}
                  roughness={0.4}
                  metalness={0.1}
                />
              </mesh>
            )
          })}
        </group>
      )}

      {/* Show edge highlight line when hovering near an edge */}
      {hoveredEdge && supportsEdgeSelection && (
        <group>
          {/* Edge highlight line */}
          <Line
            points={[
              new THREE.Vector3(...hoveredEdge.start)
                .applyEuler(new THREE.Euler(rotX, rotY, rotZ))
                .add(new THREE.Vector3(posX, posY, posZ))
                .toArray() as [number, number, number],
              new THREE.Vector3(...hoveredEdge.end)
                .applyEuler(new THREE.Euler(rotX, rotY, rotZ))
                .add(new THREE.Vector3(posX, posY, posZ))
                .toArray() as [number, number, number]
            ]}
            color="#f59e0b"
            lineWidth={4}
          />
        </group>
      )}

      {/* Show selected edge highlight */}
      {selectedEdgeIndex !== undefined && supportsEdgeSelection && (
        <group>
          {(() => {
            const edges = getBoxEdges(width, height, depth)
            const selectedEdge = edges.find(e => e.index === selectedEdgeIndex)
            if (!selectedEdge) return null
            return (
              <Line
                points={[
                  new THREE.Vector3(...selectedEdge.start)
                    .applyEuler(new THREE.Euler(rotX, rotY, rotZ))
                    .add(new THREE.Vector3(posX, posY, posZ))
                    .toArray() as [number, number, number],
                  new THREE.Vector3(...selectedEdge.end)
                    .applyEuler(new THREE.Euler(rotX, rotY, rotZ))
                    .add(new THREE.Vector3(posX, posY, posZ))
                    .toArray() as [number, number, number]
                ]}
                color="#22c55e"
                lineWidth={6}
              />
            )
          })()}
        </group>
      )}

      {/* Show face/edge indicator on hover when feature is selected */}
      {isSelected && (hoveredFaceIndex !== null || hoveredEdge) && meshRef.current && (
        <Html
          position={[posX, posY + height / 2 + 10, posZ]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-slate-900/90 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {hoveredEdge ? (
              <>
                <span className="font-medium text-amber-400">{hoveredEdge.name}</span>
                <span className="text-slate-400 ml-1">(Ctrl+Click to select, Right-click for fillet)</span>
              </>
            ) : (
              <>
                <span className="font-medium">{getFaceName(hoveredFaceIndex!)}</span>
                <span className="text-slate-400 ml-1">(Shift+Click to select, Right-click for actions)</span>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// Wireframe edges for each shape
function ShapeEdges({ feature, allFeatures }: { feature: AnyFeature; allFeatures: AnyFeature[] }) {
  const content = getFeatureContent(feature)

  // Extract primitive values to use as dependencies
  const type = content?.type || content?.primitive || 'cube'
  const width = content?.width || 10
  const height = content?.height || 10
  const depth = content?.depth || 10
  const radius = content?.radius || 5
  const tube = content?.tube || 3
  const posX = content?.position?.[0] || 0
  const posY = content?.position?.[1] || 0
  const posZ = content?.position?.[2] || 0
  const rotX = ((content?.rotation?.[0] || 0) * Math.PI) / 180
  const rotY = ((content?.rotation?.[1] || 0) * Math.PI) / 180
  const rotZ = ((content?.rotation?.[2] || 0) * Math.PI) / 180

  // Extrude/revolve specific
  const sketchId = content?.sketch_id
  const extrudeDepth = content?.depth || 10
  const bevel = content?.bevel
  const revolveAngle = content?.angle || 360
  const revolveSegments = content?.segments || 32
  const filletRadius = content?.fillet_radius || content?.radius || 2
  const chamferDistance = content?.chamfer_distance || content?.distance || 2

  // Additional shape parameters
  const radiusTop = content?.radiusTop ?? radius
  const radiusBottom = content?.radiusBottom ?? radius
  const innerRadius = content?.innerRadius || (radius * 0.5)
  const outerRadius = content?.outerRadius || radius
  const sides = content?.sides || 6

  const geometry = useMemo(() => {
    switch (type) {
      case 'cube':
      case 'box':
        return new THREE.BoxGeometry(width, height, depth)
      case 'cylinder':
        return new THREE.CylinderGeometry(radius, radius, height, 32)
      case 'sphere':
        return new THREE.SphereGeometry(radius, 32, 32)
      case 'cone':
        return new THREE.ConeGeometry(radius, height, 32)
      case 'torus':
        return new THREE.TorusGeometry(radius, tube, 16, 100)

      // Additional primitives
      case 'pyramid':
        return new THREE.ConeGeometry(radius, height, 4)
      case 'prism':
      case 'triangular_prism':
        return new THREE.CylinderGeometry(radius, radius, height, 3)
      case 'hexagonal_prism':
      case 'hexagon':
        return new THREE.CylinderGeometry(radius, radius, height, 6)
      case 'octagonal_prism':
      case 'octagon':
        return new THREE.CylinderGeometry(radius, radius, height, 8)
      case 'pentagonal_prism':
      case 'pentagon':
        return new THREE.CylinderGeometry(radius, radius, height, 5)
      case 'custom_prism':
        // For any N-sided prism, use the 'sides' parameter
        return new THREE.CylinderGeometry(radius, radius, height, sides)
      case 'capsule':
        return new THREE.CapsuleGeometry(radius, height, 16, 32)
      case 'ring':
        return new THREE.TorusGeometry(outerRadius, innerRadius, 16, 100)
      case 'tube':
      case 'pipe':
        return new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -height/2, 0),
            new THREE.Vector3(0, height/2, 0)
          ]),
          64, tube, 32, false
        )
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(radius)
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(radius)
      case 'octahedron':
        return new THREE.OctahedronGeometry(radius)
      case 'tetrahedron':
        return new THREE.TetrahedronGeometry(radius)
      case 'frustum':
      case 'truncated_cone':
        return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32)
      case 'hemisphere':
        return new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
      case 'wedge': {
        const wedgeShape = new THREE.Shape()
        wedgeShape.moveTo(-width/2, -height/2)
        wedgeShape.lineTo(width/2, -height/2)
        wedgeShape.lineTo(width/2, height/2)
        wedgeShape.closePath()
        return new THREE.ExtrudeGeometry(wedgeShape, { depth: depth, bevelEnabled: false })
      }
      case 'star': {
        const starShape = new THREE.Shape()
        const outerR = radius
        const innerR = radius * 0.4
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR
          const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
          const x = r * Math.cos(angle)
          const y = r * Math.sin(angle)
          if (i === 0) starShape.moveTo(x, y)
          else starShape.lineTo(x, y)
        }
        starShape.closePath()
        return new THREE.ExtrudeGeometry(starShape, { depth: depth || 5, bevelEnabled: false })
      }

      case 'extrude': {
        const sketchData = sketchId ? getSketchGeometry(sketchId, allFeatures) : null
        if (sketchData && sketchData.points.length >= 3) {
          const shape = new THREE.Shape()
          shape.moveTo(sketchData.points[0][0], sketchData.points[0][1])
          for (let i = 1; i < sketchData.points.length; i++) {
            shape.lineTo(sketchData.points[i][0], sketchData.points[i][1])
          }
          shape.closePath()
          const extrudeSettings: THREE.ExtrudeGeometryOptions = {
            depth: extrudeDepth,
            bevelEnabled: bevel?.enabled || false,
            bevelSize: bevel?.size || 0,
            bevelSegments: bevel?.segments || 1,
          }
          return new THREE.ExtrudeGeometry(shape, extrudeSettings)
        }
        return new THREE.BoxGeometry(width || 20, height || 20, extrudeDepth)
      }

      case 'revolve': {
        const sketchData = sketchId ? getSketchGeometry(sketchId, allFeatures) : null
        if (sketchData && sketchData.points.length >= 2) {
          const points: THREE.Vector2[] = sketchData.points.map(
            ([x, y]) => new THREE.Vector2(Math.abs(x), y)
          )
          const angleRad = (revolveAngle / 360) * Math.PI * 2
          return new THREE.LatheGeometry(points, revolveSegments, 0, angleRad)
        }
        return new THREE.CylinderGeometry(radius, radius, height, revolveSegments)
      }

      case 'fillet':
      case 'chamfer':
      case 'sketch':
        // These don't have visible edge geometry
        return null

      default:
        return new THREE.BoxGeometry(10, 10, 10)
    }
  }, [type, width, height, depth, radius, radiusTop, radiusBottom, tube, innerRadius, outerRadius, sides, sketchId, extrudeDepth, bevel, revolveAngle, revolveSegments, filletRadius, chamferDistance, allFeatures])

  const edges = useMemo(() => geometry ? new THREE.EdgesGeometry(geometry) : null, [geometry])

  // Don't render if not visible, suppressed, or no geometry (sketches)
  if (!content || !feature.visible || feature.suppressed || !edges || type === 'sketch') {
    return null
  }

  return (
    <lineSegments position={[posX, posY, posZ]} rotation={[rotX, rotY, rotZ]} geometry={edges}>
      <lineBasicMaterial color="#0d9488" linewidth={1} />
    </lineSegments>
  )
}

// Camera controller for view changes
function CameraController({ viewMode }: { viewMode: string }) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const view = CAMERA_VIEWS[viewMode as keyof typeof CAMERA_VIEWS] || CAMERA_VIEWS['3d']
    camera.position.set(...(view.position as [number, number, number]))
    camera.lookAt(...(view.target as [number, number, number]))
    camera.updateProjectionMatrix()

    if (controlsRef.current) {
      controlsRef.current.target.set(...(view.target as [number, number, number]))
      controlsRef.current.update()
    }
  }, [viewMode, camera])

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} />
}

// Axes helper using Line component from drei for thick, visible axes
function Axes() {
  // Axis length
  const axisLength = 60

  // X axis - Red
  const xPoints: [number, number, number][] = [[0, 0, 0], [axisLength, 0, 0]]
  // Y axis - Green
  const yPoints: [number, number, number][] = [[0, 0, 0], [0, axisLength, 0]]
  // Z axis - Blue
  const zPoints: [number, number, number][] = [[0, 0, 0], [0, 0, axisLength]]

  // Arrow head size
  const arrowSize = 3

  // X arrow head points
  const xArrowPoints: [number, number, number][] = [
    [axisLength - arrowSize, arrowSize * 0.5, 0],
    [axisLength, 0, 0],
    [axisLength - arrowSize, -arrowSize * 0.5, 0],
  ]

  // Y arrow head points
  const yArrowPoints: [number, number, number][] = [
    [arrowSize * 0.5, axisLength - arrowSize, 0],
    [0, axisLength, 0],
    [-arrowSize * 0.5, axisLength - arrowSize, 0],
  ]

  // Z arrow head points
  const zArrowPoints: [number, number, number][] = [
    [0, arrowSize * 0.5, axisLength - arrowSize],
    [0, 0, axisLength],
    [0, -arrowSize * 0.5, axisLength - arrowSize],
  ]

  return (
    <group>
      {/* X Axis - Red - Thick line */}
      <Line points={xPoints} color="#ef4444" lineWidth={4} />
      <Line points={xArrowPoints} color="#ef4444" lineWidth={4} />

      {/* Y Axis - Green - Thick line */}
      <Line points={yPoints} color="#22c55e" lineWidth={4} />
      <Line points={yArrowPoints} color="#22c55e" lineWidth={4} />

      {/* Z Axis - Blue - Thick line */}
      <Line points={zPoints} color="#3b82f6" lineWidth={4} />
      <Line points={zArrowPoints} color="#3b82f6" lineWidth={4} />

      {/* Axis labels using small spheres at the end */}
      <mesh position={[axisLength + 5, 0, 0]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, axisLength + 5, 0]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0, 0, axisLength + 5]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>

      {/* Origin sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

interface ThreeCanvasProps {
  features: AnyFeature[]
  selectedFeatureId?: string | null
  selectedFeatureIds?: string[]
  viewMode?: string
  showGrid?: boolean
  showAxes?: boolean
  gridSize?: number
  onSelectFeature?: (id: string) => void
  onDoubleClickFeature?: (id: string) => void
  onFaceSelect?: (info: SelectionInfo) => void
  onEdgeSelect?: (info: SelectionInfo) => void
  onContextMenu?: (info: SelectionInfo, screenPosition: { x: number, y: number }) => void
  selectedFaceInfo?: SelectionInfo | null
  selectedEdgeInfo?: SelectionInfo | null
}

export default function ThreeCanvas({
  features,
  selectedFeatureId,
  selectedFeatureIds = [],
  viewMode = '3d',
  showGrid = true,
  showAxes = true,
  gridSize = 10,
  onSelectFeature,
  onDoubleClickFeature,
  onFaceSelect,
  onEdgeSelect,
  onContextMenu,
  selectedFaceInfo,
  selectedEdgeInfo,
}: ThreeCanvasProps) {
  // Support both selectedFeatureId (single) and selectedFeatureIds (array)
  const activeSelectedIds = selectedFeatureId ? [selectedFeatureId] : selectedFeatureIds

  // Handle right click on shapes
  const handleRightClick = useCallback((info: SelectionInfo, event: ThreeEvent<MouseEvent>) => {
    if (onContextMenu) {
      // Get screen position from the native event
      const screenPos = { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY }
      onContextMenu(info, screenPos)
    }
  }, [onContextMenu])

  return (
    <Canvas
      camera={{ position: [50, 50, 50], fov: 50 }}
      style={{ background: '#ffffff' }}
      gl={{ antialias: true }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 50, 50]} intensity={0.8} castShadow />
      <directionalLight position={[-50, 50, -50]} intensity={0.4} />
      <pointLight position={[0, 50, 0]} intensity={0.3} />

      {/* Camera controls */}
      <CameraController viewMode={viewMode} />

      {/* Grid */}
      {showGrid && (
        <Grid
          args={[200, 200]}
          cellSize={gridSize}
          cellThickness={0.5}
          cellColor="#e2e8f0"
          sectionSize={gridSize * 5}
          sectionThickness={1}
          sectionColor="#cbd5e1"
          fadeDistance={300}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={false}
        />
      )}

      {/* Axes */}
      {showAxes && <Axes />}

      {/* Render all features - visibility is handled inside each component */}
      {features.map((feature) => (
        <group key={feature.id}>
          <Shape
            feature={feature}
            isSelected={activeSelectedIds.includes(feature.id)}
            allFeatures={features}
            onSelect={onSelectFeature}
            onDoubleClick={onDoubleClickFeature}
            onFaceSelect={onFaceSelect}
            onEdgeSelect={onEdgeSelect}
            onRightClick={handleRightClick}
            selectedFaceIndex={selectedFaceInfo?.featureId === feature.id ? selectedFaceInfo.faceIndex : undefined}
            selectedEdgeIndex={selectedEdgeInfo?.featureId === feature.id ? selectedEdgeInfo.edgeIndex : undefined}
          />
          <ShapeEdges feature={feature} allFeatures={features} />
        </group>
      ))}

      {/* Gizmo helper for orientation */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={['#ef4444', '#22c55e', '#3b82f6']}
          labelColor="white"
        />
      </GizmoHelper>
    </Canvas>
  )
}
