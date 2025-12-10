"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "../../../components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { useCADStore } from "../../../lib/cad/store"
import {
  ArrowLeft,
  Loader2,
  Settings,
  Move,
  RotateCcw,
  Maximize2,
  MousePointer2,
  Hand,
  ZoomIn,
} from "lucide-react"
import { PropertiesPanel } from "./components/PropertiesPanel"
import { SettingsDialog } from "./components/SettingsDialog"
import { ChatSidebar } from "./components/ChatSidebar"
import { FeaturesSidebar } from "./components/FeaturesSidebar"
import { EditorHeader } from "./components/EditorHeader"
import { ViewControls } from "./components/ViewControls"
import { ToolbarInline } from "./components/ToolbarInline"
import { useChat } from "./hooks/useChat"

// Dynamic import for Three.js canvas to avoid SSR issues
const ThreeCanvas = dynamic(() => import("../../../components/cad/ThreeCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <div className="text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p>Loading 3D View...</p>
      </div>
    </div>
  ),
})

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    projects,
    setActiveProject,
    editor,
    setSelectedFeatures,
    setViewMode,
    updateProject,
  } = useCADStore()

  // Use the chat hook
  const {
    chatInput,
    setChatInput,
    messages,
    chatEndRef,
    sendMessage,
    isGenerating,
  } = useChat(projectId)

  // Local state for UI
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
  const [activeTool, setActiveTool] = useState<'select' | 'move' | 'rotate' | 'scale' | 'pan'>('select')

  const project = projects.find(p => p.id === projectId)

  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId)
    }
  }, [projectId, setActiveProject])

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Project not found</h2>
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Top Toolbar (now a component) */}
      <EditorHeader
        projectId={projectId}
        projectName={project.name}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
        onOpenSettings={() => setShowSettingsDialog(true)}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        projectId={projectId}
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Features */}
        <FeaturesSidebar
          isOpen={leftSidebarOpen}
          features={project.features}
          projectId={projectId}
          selectedFeatureIds={editor.selectedFeatureIds}
          onSelectFeature={(id) => setSelectedFeatures([id])}
        />

        {/* Canvas Area */}
        <div className="flex-1 relative bg-white">
          <ThreeCanvas
            features={project.features}
            selectedFeatureIds={editor.selectedFeatureIds}
            viewMode={editor.viewMode}
            showGrid={project.settings.showGrid}
            showAxes={project.settings.showAxes}
            gridSize={project.settings.gridSize}
          />

          {/* CAD Tool Toolbar */}
          <ToolbarInline
            selectedFeatureIds={editor.selectedFeatureIds}
            onToggleProperties={() => {
              if (editor.selectedFeatureIds.length > 0) {
                setShowPropertiesPanel(!showPropertiesPanel)
              }
            }}
          />

          {/* View Controls (now a component) */}
          <ViewControls
            viewMode={editor.viewMode}
            onViewModeChange={setViewMode}
            showGrid={project.settings.showGrid}
            onToggleGrid={() => updateProject(projectId, {
              settings: { ...project.settings, showGrid: !project.settings.showGrid }
            })}
            gridSize={project.settings.gridSize}
            onGridSizeChange={(size) => updateProject(projectId, {
              settings: { ...project.settings, gridSize: size }
            })}
          />

          {/* Properties Panel */}
          {showPropertiesPanel && editor.selectedFeatureIds.length > 0 && (() => {
            const selectedFeature = project.features.find(f => f.id === editor.selectedFeatureIds[0])
            if (!selectedFeature) return null
            return (
              <PropertiesPanel
                feature={selectedFeature}
                projectId={projectId}
                onClose={() => setShowPropertiesPanel(false)}
              />
            )
          })()}
        </div>

        {/* Right Sidebar - Chat */}
        <ChatSidebar
          isOpen={rightSidebarOpen}
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendMessage={sendMessage}
          isGenerating={isGenerating}
          chatEndRef={chatEndRef}
        />
      </div>
    </div>
  )
}
