"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { useCADStore } from "../../lib/cad/store"
import {
  Plus,
  Search,
  Box,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Layers,
  Clock,
  FolderOpen,
  Sparkles,
  ArrowRight,
  Grid,
  List,
} from "lucide-react"
import Link from "next/link"

export default function CADProjectsPage() {
  const router = useRouter()
  const {
    projects,
    createProject,
    deleteProject,
    duplicateProject,
    exportProject,
    importProject,
  } = useCADStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort by most recently updated
  const sortedProjects = [...filteredProjects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return

    const project = createProject(newProjectName.trim(), newProjectDescription.trim())
    setShowNewProjectDialog(false)
    setNewProjectName("")
    setNewProjectDescription("")
    router.push(`/editor/${project.id}`)
  }

  const handleExport = (projectId: string) => {
    const json = exportProject(projectId)
    if (json) {
      const project = projects.find(p => p.id === projectId)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project?.name || 'project'}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const project = importProject(content)
      if (project) {
        router.push(`/editor/${project.id}`)
      }
    }
    reader.readAsText(file)

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Box className="w-8 h-8 text-brand-600" />
                <span className="text-xl font-semibold text-gray-900">modlr</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                onClick={() => setShowNewProjectDialog(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title & Controls */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your CAD Projects</h1>
          <p className="text-gray-600">Create and manage your 3D CAD designs</p>
        </div>

        {/* Search & View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`rounded-r-none ${viewMode === "grid" ? "bg-brand-600 text-white hover:bg-brand-700" : ""}`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={`rounded-l-none ${viewMode === "list" ? "bg-brand-600 text-white hover:bg-brand-700" : ""}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-gray-600 mb-6">
          <span>{sortedProjects.length} projects</span>
          <span>•</span>
          <span>{sortedProjects.reduce((acc, p) => acc + p.features.length, 0)} total features</span>
        </div>

        {/* Projects Grid/List */}
        {sortedProjects.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Create your first CAD project to start designing 3D models with AI assistance"}
              </p>
              {!searchQuery && (
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setShowNewProjectDialog(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                  <Link href="/studio">
                    <Button variant="outline">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Try Quick Studio
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Add New Project Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className="h-full border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[200px]"
                onClick={() => setShowNewProjectDialog(true)}
              >
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mb-4 group-hover:bg-brand-200 transition-colors">
                    <Plus className="w-7 h-7 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 group-hover:text-brand-600 transition-colors">
                    New Project
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Create a new CAD design
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {sortedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: (index + 1) * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all hover:border-brand-200 group h-full">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => router.push(`/editor/${project.id}`)}
                      >
                        <CardTitle className="text-lg group-hover:text-brand-600 transition-colors">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/editor/${project.id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Open Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateProject(project.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport(project.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            Export JSON
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteProject(project.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent
                    className="cursor-pointer"
                    onClick={() => router.push(`/editor/${project.id}`)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Layers className="w-4 h-4" />
                          <span>{project.features.length} features</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(project.updatedAt)}</span>
                        </div>
                      </div>

                      {/* Feature preview badges */}
                      {project.features.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.features.slice(0, 4).map((feature) => {
                            const content = feature.patch?.content as any
                            const type = content?.type || content?.primitive || 'shape'
                            return (
                              <Badge key={feature.id} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            )
                          })}
                          {project.features.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.features.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        className="w-full mt-2 text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                      >
                        Open Project
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer hover:border-brand-200"
                  onClick={() => router.push(`/editor/${project.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                            {project.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {project.features.length} features
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {formatDate(project.updatedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created {formatDate(project.createdAt)}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/editor/${project.id}`)
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Open Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            duplicateProject(project.id)
                          }}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleExport(project.id)
                          }}>
                            <Download className="w-4 h-4 mr-2" />
                            Export JSON
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteProject(project.id)
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="w-5 h-5 text-brand-600" />
              Create New Project
            </DialogTitle>
            <DialogDescription>
              Start a new CAD project to design 3D models with AI assistance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                placeholder="e.g., Mechanical Part Design"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDescription">Description (optional)</Label>
              <Textarea
                id="projectDescription"
                placeholder="Brief description of your project..."
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
