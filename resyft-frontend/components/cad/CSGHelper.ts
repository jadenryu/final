import * as THREE from 'three'
import { ADDITION, SUBTRACTION, INTERSECTION, Brush, Evaluator } from 'three-bvh-csg'

const evaluator = new Evaluator()

export function performCSG(
  operation: 'union' | 'subtract' | 'intersect',
  targetMesh: THREE.Mesh,
  toolMesh: THREE.Mesh
): THREE.Mesh {
  // Convert meshes to CSG brushes
  const targetBrush = new Brush(targetMesh.geometry)
  targetBrush.position.copy(targetMesh.position)
  targetBrush.rotation.copy(targetMesh.rotation)
  targetBrush.scale.copy(targetMesh.scale)
  targetBrush.updateMatrixWorld()

  const toolBrush = new Brush(toolMesh.geometry)
  toolBrush.position.copy(toolMesh.position)
  toolBrush.rotation.copy(toolMesh.rotation)
  toolBrush.scale.copy(toolMesh.scale)
  toolBrush.updateMatrixWorld()

  // Perform the operation
  let resultBrush: Brush
  switch (operation) {
    case 'union':
      resultBrush = evaluator.evaluate(targetBrush, toolBrush, ADDITION)
      break
    case 'subtract':
      resultBrush = evaluator.evaluate(targetBrush, toolBrush, SUBTRACTION)
      break
    case 'intersect':
      resultBrush = evaluator.evaluate(targetBrush, toolBrush, INTERSECTION)
      break
    default:
      resultBrush = targetBrush
  }

  // Create mesh from result
  const material = (targetMesh.material as THREE.Material).clone()
  const resultMesh = new THREE.Mesh(resultBrush.geometry, material)
  resultMesh.position.set(0, 0, 0)
  
  return resultMesh
}