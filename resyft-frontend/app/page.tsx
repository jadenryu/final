"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Label } from "../components/ui/label"
import { useCADStore } from "../lib/cad/store"
import {
  PenTool,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Copy,
  Edit,
  Download,
  Upload,
  FolderOpen,
  Clock,
  Box,
  Layers,
  Settings,
  Grid3X3
} from "lucide-react"

export default function ProjectDashboard() {
  const router = useRouter()
  const { projects, createProject, deleteProject, duplicateProject, setActiveProject, exportProject, importProject } = useCADStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [importJson, setImportJson] = useState("")
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return
    const project = createProject(newProjectName.trim(), newProjectDescription.trim())
    setNewProjectName("")
    setNewProjectDescription("")
    setIsCreateDialogOpen(false)
    router.push(`/editor/${project.id}`)
  }

  const handleOpenProject = (projectId: string) => {
    setActiveProject(projectId)
    router.push(`/editor/${projectId}`)
  }

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project? This cannot be undone.")) {
      deleteProject(projectId)
    }
  }

  const handleDuplicateProject = (projectId: string) => {
    duplicateProject(projectId)
  }

  const handleExportProject = (projectId: string) => {
    const json = exportProject(projectId)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projects.find(p => p.id === projectId)?.name || 'project'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportProject = () => {
    if (!importJson.trim()) return
    const project = importProject(importJson.trim())
    if (project) {
      setImportJson("")
      setIsImportDialogOpen(false)
    } else {
      alert("Invalid project file. Please check the format.")
    }
  }

  const handleRenameProject = (projectId: string, newName: string) => {
    if (!newName.trim()) return
    useCADStore.getState().updateProject(projectId, { name: newName.trim() })
    setEditingProject(null)
    setEditName("")
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <PenTool className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">CAD Designer</h1>
                <p className="text-sm text-slate-500">AI-Powered Generative CAD</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Project</DialogTitle>
                    <DialogDescription>
                      Paste the JSON content of a previously exported project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder="Paste project JSON here..."
                      className="w-full h-48 p-3 border rounded-lg font-mono text-sm resize-none"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleImportProject} className="bg-teal-600 hover:bg-teal-700">
                      Import Project
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Start a new CAD design project from scratch.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="My CAD Project"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Input
                        id="description"
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                        placeholder="A brief description of your project"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      className="bg-teal-600 hover:bg-teal-700"
                      disabled={!newProjectName.trim()}
                    >
                      Create Project
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-10"
            />
          </div>
          <div className="text-sm text-slate-500">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            {projects.length === 0 ? (
              <>
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  Create your first CAD project to start designing with AI assistance.
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No matching projects</h3>
                <p className="text-slate-500">Try a different search term.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200 hover:border-teal-300"
                onClick={() => handleOpenProject(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingProject === project.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleRenameProject(project.id, editName)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameProject(project.id, editName)
                            if (e.key === 'Escape') setEditingProject(null)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-8"
                        />
                      ) : (
                        <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                      )}
                      {project.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => handleOpenProject(project.id)}>
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditingProject(project.id)
                          setEditName(project.name)
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateProject(project.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportProject(project.id)}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Thumbnail placeholder */}
                  <div className="aspect-video bg-slate-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {project.features.length > 0 ? (
                      <div className="text-center">
                        <Grid3X3 className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                        <span className="text-xs text-slate-500">{project.features.length} features</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Box className="w-8 h-8 text-slate-300 mx-auto" />
                        <span className="text-xs text-slate-400">Empty project</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      <span>{project.features.length} features</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(project.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* New Project Card */}
            <Card
              className="border-dashed border-2 border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer flex items-center justify-center min-h-[280px]"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-teal-600" />
                </div>
                <p className="font-medium text-slate-700">Create New Project</p>
                <p className="text-sm text-slate-500 mt-1">Start from scratch</p>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
