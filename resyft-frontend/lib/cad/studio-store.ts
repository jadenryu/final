import { create } from 'zustand'

export interface FeatureContent {
  primitive: string
  width?: number
  height?: number
  depth?: number
  radius?: number
  tube?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  [key: string]: any
}

export interface StudioFeature {
  id: string
  content: FeatureContent
  visible: boolean
  locked: boolean
  suppressed: boolean
}

interface StudioStore {
  features: StudioFeature[]
  selectedFeatureId: string | null
  addFeature: (feature: StudioFeature) => void
  updateFeature: (id: string, updates: Partial<StudioFeature>) => void
  deleteFeature: (id: string) => void
  selectFeature: (id: string | null) => void
  clearFeatures: () => void
}

export const useStudioStore = create<StudioStore>((set) => ({
  features: [],
  selectedFeatureId: null,

  addFeature: (feature) => {
    set((state) => ({
      features: [...state.features, feature],
    }))
  },

  updateFeature: (id, updates) => {
    set((state) => ({
      features: state.features.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    }))
  },

  deleteFeature: (id) => {
    set((state) => ({
      features: state.features.filter((f) => f.id !== id),
      selectedFeatureId:
        state.selectedFeatureId === id ? null : state.selectedFeatureId,
    }))
  },

  selectFeature: (id) => {
    set({ selectedFeatureId: id })
  },

  clearFeatures: () => {
    set({ features: [], selectedFeatureId: null })
  },
}))
