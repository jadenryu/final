import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Patch, PrimitiveContent } from './types'
const mod = require('three-bvh-csg')

// ============================================================================
// Project Types
// ============================================================================

export interface CADProject {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  thumbnail?: string
  features: Feature[]
  settings: ProjectSettings
}

export interface Feature {
  id: string
  name: string
  type: 'primitive' | 'sketch' | 'extrude' | 'revolve' | 'fillet' | 'chamfer' | 'group'
  visible: boolean
  locked: boolean
  suppressed: boolean
  patch: Patch
  children?: Feature[]
}

export interface ProjectSettings {
  units: 'mm' | 'cm' | 'm' | 'in'
  gridSize: number
  snapToGrid: boolean
  showAxes: boolean
  showGrid: boolean
  backgroundColor: string
}

// ============================================================================
// Editor State
// ============================================================================

export interface EditorState {
  selectedFeatureIds: string[]
  hoveredFeatureId: string | null
  tool: 'select' | 'pan' | 'zoom' | 'measure'
  viewMode: '3d' | 'front' | 'top' | 'right' | 'isometric'
  showFeatureTree: boolean
  showProperties: boolean
  isGenerating: boolean
}

// ============================================================================
// Store Interface
// ============================================================================

interface CADStore {
  // Projects
  projects: CADProject[]
  activeProjectId: string | null

  // Editor
  editor: EditorState

  // Chat/Generation
  messages: ChatMessage[]

  // Project Actions
  createProject: (name: string, description?: string) => CADProject
  updateProject: (id: string, updates: Partial<CADProject>) => void
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => CADProject | null
  setActiveProject: (id: string | null) => void
  getActiveProject: () => CADProject | null

  // Feature Actions
  addFeature: (projectId: string, feature: Feature) => void
  updateFeature: (projectId: string, featureId: string, updates: Partial<Feature>) => void
  deleteFeature: (projectId: string, featureId: string) => void
  booleanFeature: (projectId: string, targetFeatureId: string, tool: 'UNION' | 'SUBTRACT' | 'INTERSECT', sourceFeatureId: string) => void
  reorderFeatures: (projectId: string, featureIds: string[]) => void
  toggleFeatureVisibility: (projectId: string, featureId: string) => void
  toggleFeatureSuppression: (projectId: string, featureId: string) => void

  // Editor Actions
  setSelectedFeatures: (ids: string[]) => void
  setHoveredFeature: (id: string | null) => void
  setTool: (tool: EditorState['tool']) => void
  setViewMode: (mode: EditorState['viewMode']) => void
  toggleFeatureTree: () => void
  toggleProperties: () => void
  setIsGenerating: (value: boolean) => void

  // Chat Actions
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void

  // Utility
  exportProject: (id: string) => string
  importProject: (json: string) => CADProject | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  patches?: Patch[]
}

// ============================================================================
// Default Values
// ============================================================================

const defaultProjectSettings: ProjectSettings = {
  units: 'mm',
  gridSize: 10,
  snapToGrid: true,
  showAxes: true,
  showGrid: true,
  backgroundColor: '#1a1a2e'
}

const defaultEditorState: EditorState = {
  selectedFeatureIds: [],
  hoveredFeatureId: null,
  tool: 'select',
  viewMode: '3d',
  showFeatureTree: true,
  showProperties: true,
  isGenerating: false
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useCADStore = create<CADStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      editor: defaultEditorState,
      messages: [],

      // Project Actions
      createProject: (name, description = '') => {
        const newProject: CADProject = {
          id: `proj_${Date.now()}`,
          name,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
          features: [],
          settings: { ...defaultProjectSettings }
        }
        set(state => ({
          projects: [...state.projects, newProject],
          activeProjectId: newProject.id
        }))
        return newProject
      },

      updateProject: (id, updates) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          )
        }))
      },

      deleteProject: (id) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId
        }))
      },

      duplicateProject: (id) => {
        const project = get().projects.find(p => p.id === id)
        if (!project) return null

        const newProject: CADProject = {
          ...project,
          id: `proj_${Date.now()}`,
          name: `${project.name} (Copy)`,
          createdAt: new Date(),
          updatedAt: new Date(),
          features: project.features.map(f => ({
            ...f,
            id: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }))
        }
        set(state => ({ projects: [...state.projects, newProject] }))
        return newProject
      },

      setActiveProject: (id) => {
        set({ activeProjectId: id, messages: [] })
      },

      getActiveProject: () => {
        const state = get()
        return state.projects.find(p => p.id === state.activeProjectId) || null
      },

      // Feature Actions
      addFeature: (projectId, feature) => {
        set(state => {
          const projects = state.projects.map(p => {
            if (p.id !== projectId) return p

            // Check if this is a boolean operation
            const content = feature.patch.content as any
            if (content.primitive === 'union' || content.primitive === 'subtract' || content.primitive === 'intersect') {
              // Perform CSG operation
              try {
                const { Evaluator, Brush, ADDITION, SUBTRACTION, INTERSECTION } = mod

                const targetFeature = p.features.find(f => f.id === content.target_id)
                const toolFeature = p.features.find(f => f.id === content.tool_id)

                if (!targetFeature || !toolFeature) {
                  console.error('Boolean operation: target or tool feature not found')
                  return p
                }

                // Get or create geometries for both features
                const targetGeom = (targetFeature.patch as any)?.geometry
                const toolGeom = (toolFeature.patch as any)?.geometry

                if (!targetGeom || !toolGeom) {
                  console.error('Boolean operation: missing geometry on features')
                  return p
                }

                const targetBrush = new Brush(targetGeom)
                const toolBrush = new Brush(toolGeom)
                targetBrush.updateMatrixWorld()
                toolBrush.updateMatrixWorld()

                const evaluator = new Evaluator()

                const op =
                  content.primitive === 'union' ? ADDITION :
                  content.primitive === 'subtract' ? SUBTRACTION :
                  INTERSECTION

                const resultMesh = evaluator.evaluate(targetBrush, toolBrush, op)

                // Store the resulting geometry on the feature patch
                const updatedFeature: Feature = {
                  ...feature,
                  patch: {
                    ...feature.patch,
                    content: {
                      ...content,
                      // Keep the original IDs for reference
                    },
                    geometry: resultMesh.geometry
                  } as any
                }

                return {
                  ...p,
                  features: [...p.features, updatedFeature],
                  updatedAt: new Date()
                }
              } catch (error) {
                console.error('Boolean operation failed:', error)
                return p
              }
            }

            // Regular feature addition
            return { ...p, features: [...p.features, feature], updatedAt: new Date() }
          })

          return { ...state, projects }
        })
      },

      updateFeature: (projectId, featureId, updates) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  features: p.features.map(f =>
                    f.id === featureId ? { ...f, ...updates } : f
                  ),
                  updatedAt: new Date()
                }
              : p
          )
        }))
      },

      deleteFeature: (projectId, featureId) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
            ...p,
            features: p.features.filter(f => f.id !== featureId),
            updatedAt: new Date()
          }
              : p
          ),
          editor: {
            ...state.editor,
            selectedFeatureIds: state.editor.selectedFeatureIds.filter(id => id !== featureId)
          }
        }))
            },
            
            booleanFeature: (projectId, targetFeatureId, tool, sourceFeatureId) => {
        set(state => {
          // Lazy import to avoid bundling three-bvh-csg into non-CAD flows
          let Evaluator: any, Brush: any, ADDITION: any, SUBTRACTION: any, INTERSECTION: any
          try {
            Evaluator = mod.Evaluator
            Brush = mod.Brush
            ADDITION = mod.ADDITION
            SUBTRACTION = mod.SUBTRACTION
            INTERSECTION = mod.INTERSECTION
          } catch {
            // If the lib isn't available just return state unchanged
            return state
          }

          const projects = state.projects.map(p => {
            if (p.id !== projectId) return p

            const targetFeature = p.features.find(f => f.id === targetFeatureId)
            const sourceFeature = p.features.find(f => f.id === sourceFeatureId)
            if (!targetFeature || !sourceFeature) return p

            // Expect geometries to be present on feature patches
            const targetGeom = (targetFeature.patch as any)?.geometry
            const sourceGeom = (sourceFeature.patch as any)?.geometry
            if (!targetGeom || !sourceGeom) return p

            const targetBrush = new Brush(targetGeom)
            const sourceBrush = new Brush(sourceGeom)
            targetBrush.updateMatrixWorld()
            sourceBrush.updateMatrixWorld()

            const evaluator = new Evaluator()

            const op =
              tool === 'UNION' ? ADDITION :
              tool === 'SUBTRACT' ? SUBTRACTION :
              INTERSECTION

            const resultMesh = evaluator.evaluate(targetBrush, sourceBrush, op)

            const updatedFeature: Feature = {
              ...targetFeature,
              patch: {
          feature_id: targetFeatureId,
          action: tool,
          // Store resulting geometry for downstream rendering
          content: (resultMesh.geometry as unknown as PrimitiveContent),
          // Also keep geometry on patch for future boolean ops
          ...( { geometry: resultMesh.geometry } as any )
              } as Patch
            }

            return {
              ...p,
              features: p.features.map(f => (f.id === targetFeatureId ? updatedFeature : f)),
              updatedAt: new Date()
            }
          })

          return { ...state, projects }
        })
            },

            reorderFeatures: (projectId, featureIds) => {
        set(state => ({
          projects: state.projects.map(p => {
            if (p.id !== projectId) return p
            const featureMap = new Map(p.features.map(f => [f.id, f]))
            const reorderedFeatures = featureIds
              .map(id => featureMap.get(id))
              .filter((f): f is Feature => f !== undefined)
            return { ...p, features: reorderedFeatures, updatedAt: new Date() }
          })
        }))
      },

      toggleFeatureVisibility: (projectId, featureId) => {
        const project = get().projects.find(p => p.id === projectId)
        const feature = project?.features.find(f => f.id === featureId)
        if (feature) {
          get().updateFeature(projectId, featureId, { visible: !feature.visible })
        }
      },

      toggleFeatureSuppression: (projectId, featureId) => {
        const project = get().projects.find(p => p.id === projectId)
        const feature = project?.features.find(f => f.id === featureId)
        if (feature) {
          get().updateFeature(projectId, featureId, { suppressed: !feature.suppressed })
        }
      },

      // Editor Actions
      setSelectedFeatures: (ids) => {
        set(state => ({ editor: { ...state.editor, selectedFeatureIds: ids } }))
      },

      setHoveredFeature: (id) => {
        set(state => ({ editor: { ...state.editor, hoveredFeatureId: id } }))
      },

      setTool: (tool) => {
        set(state => ({ editor: { ...state.editor, tool } }))
      },

      setViewMode: (mode) => {
        set(state => ({ editor: { ...state.editor, viewMode: mode } }))
      },

      toggleFeatureTree: () => {
        set(state => ({
          editor: { ...state.editor, showFeatureTree: !state.editor.showFeatureTree }
        }))
      },

      toggleProperties: () => {
        set(state => ({
          editor: { ...state.editor, showProperties: !state.editor.showProperties }
        }))
      },

      setIsGenerating: (value) => {
        set(state => ({ editor: { ...state.editor, isGenerating: value } }))
      },

      // Chat Actions
      addMessage: (message) => {
        set(state => ({ messages: [...state.messages, message] }))
      },

      clearMessages: () => {
        set({ messages: [] })
      },

      // Utility
      exportProject: (id) => {
        const project = get().projects.find(p => p.id === id)
        if (!project) return ''
        return JSON.stringify(project, null, 2)
      },

      importProject: (json) => {
        try {
          const project = JSON.parse(json) as CADProject
          project.id = `proj_${Date.now()}`
          project.createdAt = new Date()
          project.updatedAt = new Date()
          set(state => ({ projects: [...state.projects, project] }))
          return project
        } catch {
          return null
        }
      }
    }),
    {
      name: 'cad-store',
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId
      })
    }
  )
)
