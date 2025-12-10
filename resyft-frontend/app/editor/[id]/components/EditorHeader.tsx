"use client"

import { useRouter } from "next/navigation"
import { Button } from "../../../../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu"
import { useCADStore } from "../../../../lib/cad/store"
import {
  ArrowLeft,
  Settings,
  Download,
  Undo,
  Redo,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
} from "lucide-react"

interface EditorHeaderProps {
  projectId: string
  projectName: string
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  onToggleLeftSidebar: () => void
  onToggleRightSidebar: () => void
  onOpenSettings: () => void
}

export function EditorHeader({
  projectId,
  projectName,
  leftSidebarOpen,
  rightSidebarOpen,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onOpenSettings,
}: EditorHeaderProps) {
  const router = useRouter()
  const { exportProject } = useCADStore()

  const handleExport = () => {
    const json = exportProject(projectId)
    if (json) {
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName || 'project'}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <header className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-4 flex-shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/')}
        className="text-slate-300 hover:text-white hover:bg-slate-700"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Projects
      </Button>

      <div className="h-6 w-px bg-slate-700" />

      <h1 className="text-sm font-medium text-white truncate max-w-xs">{projectName}</h1>

      <div className="flex-1" />

      {/* Sidebar toggles */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleLeftSidebar}
        className={`text-slate-300 hover:text-white hover:bg-slate-700 ${leftSidebarOpen ? 'bg-slate-700' : ''}`}
        title="Toggle Features Panel"
      >
        {leftSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleRightSidebar}
        className={`text-slate-300 hover:text-white hover:bg-slate-700 ${rightSidebarOpen ? 'bg-slate-700' : ''}`}
        title="Toggle AI Chat"
      >
        {rightSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
      </Button>

      <div className="h-6 w-px bg-slate-700" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700" disabled>
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700" disabled>
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-slate-700" />

      {/* Settings dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
            <Settings className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenSettings}>
            <Settings className="w-4 h-4 mr-2" />
            Project Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
