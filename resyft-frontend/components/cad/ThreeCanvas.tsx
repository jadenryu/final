"use client"

import { useRef, useEffect, useMemo } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Line } from "@react-three/drei"
import * as THREE from "three"
import type { Feature } from "../../lib/cad/store"

// Camera positions for different views
const CAMERA_VIEWS = {
  '3d': { position: [50, 50, 50], target: [0, 0, 0] },
  'front': { position: [0, 0, 100], target: [0, 0, 0] },
  'top': { position: [0, 100, 0], target: [0, 0, 0] },
  'right': { position: [100, 0, 0], target: [0, 0, 0] },
  'isometric': { position: [70, 70, 70], target: [0, 0, 0] },
}

// Helper to get sketch geometry from store features
function getSketchGeometry(sketchId: string, features: Feature[]): { points: [number, number][]; plane: string } | null {
  const sketchFeature = features.find(f => f.id === sketchId)
  if (!sketchFeature) return null

  const content = sketchFeature.patch?.content as any
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
function Shape({ feature, isSelected, allFeatures }: { feature: Feature; isSelected: boolean; allFeatures: Feature[] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const content = feature.patch?.content as any

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
  const contentColor = content?.color || "#14b8a6"

  // Fillet/chamfer specific values
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

      case 'fillet': {
        // Fillet visualization: show rounded edges as a torus segment at edge locations
        // In a real CAD system, this would modify the parent geometry
        // For visualization, we show a small torus to indicate filleted edge
        return new THREE.TorusGeometry(filletRadius, filletRadius * 0.3, 8, 32)
      }

      case 'chamfer': {
        // Chamfer visualization: show as a small beveled box
        // In a real CAD system, this would cut the edge at 45 degrees
        const chamferSize = chamferDistance
        return new THREE.BoxGeometry(chamferSize, chamferSize, chamferSize)
      }

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

  return (
    <mesh
      ref={meshRef}
      position={[posX, posY, posZ]}
      rotation={[rotX, rotY, rotZ]}
      geometry={geometry}
    >
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  )
}

// Wireframe edges for each shape
function ShapeEdges({ feature, allFeatures }: { feature: Feature; allFeatures: Feature[] }) {
  const content = feature.patch?.content as any

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
        return new THREE.TorusGeometry(filletRadius, filletRadius * 0.3, 8, 32)

      case 'chamfer':
        return new THREE.BoxGeometry(chamferDistance, chamferDistance, chamferDistance)

      case 'sketch':
        // Sketches don't have edge geometry - they're rendered as lines
        return null

      default:
        return new THREE.BoxGeometry(10, 10, 10)
    }
  }, [type, width, height, depth, radius, radiusTop, radiusBottom, tube, innerRadius, outerRadius, sketchId, extrudeDepth, bevel, revolveAngle, revolveSegments, filletRadius, chamferDistance, allFeatures])

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
  features: Feature[]
  selectedFeatureIds: string[]
  viewMode: string
  showGrid: boolean
  showAxes: boolean
  gridSize?: number
  onSelectFeature?: (id: string) => void
}

export default function ThreeCanvas({
  features,
  selectedFeatureIds,
  viewMode,
  showGrid,
  showAxes,
  gridSize = 10,
}: ThreeCanvasProps) {
  return (
    <Canvas
      camera={{ position: [50, 50, 50], fov: 50 }}
      style={{ background: '#ffffff' }}
      gl={{ antialias: true }}
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
            isSelected={selectedFeatureIds.includes(feature.id)}
            allFeatures={features}
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
