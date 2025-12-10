"use client"

import { ScrollArea } from "../../../../components/ui/scroll-area"
import { Box, Layers } from "lucide-react"
import { type Feature } from "../../../../lib/cad/store"
import { FeatureTreeItem } from "./FeatureTreeItem"

interface FeaturesSidebarProps {
  isOpen: boolean
  features: Feature[]
  projectId: string
  selectedFeatureIds: string[]
  onSelectFeature: (id: string) => void
}

export function FeaturesSidebar({
  isOpen,
  features,
  projectId,
  selectedFeatureIds,
  onSelectFeature,
}: FeaturesSidebarProps) {
  return (
    <aside
      className="bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0"
      style={{
        width: isOpen ? '256px' : '0px',
        minWidth: isOpen ? '256px' : '0px',
        transition: 'width 200ms ease-out, min-width 200ms ease-out'
      }}
    >
      <div 
        className="w-64 flex flex-col h-full" 
        style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 150ms ease-out' }}
      >
        <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            Features
          </h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {features.length}
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {features.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <Box className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No features yet</p>
                <p className="text-xs mt-1 text-slate-500">Use AI chat to create shapes</p>
              </div>
            ) : (
              features.map(feature => (
                <FeatureTreeItem
                  key={feature.id}
                  feature={feature}
                  projectId={projectId}
                  isSelected={selectedFeatureIds.includes(feature.id)}
                  onSelect={onSelectFeature}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}
