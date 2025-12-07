"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ProjectTutorial } from "../../components/project-tutorial"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { Progress } from "../../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import { AppSidebar } from "../../components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import {
  FolderOpen,
  Plus,
  Search,
  Calendar,
  FileText,
  Users,
  Clock,
  ArrowUpDown,
  Grid,
  List,
  Hash,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Lightbulb
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"

interface Project {
  id: string
  name: string
  description: string
  thesis: string
  field: string
  deadline?: string
  collaborators: string[]
  tags: string[]
  createdAt: string
  papers: any[]
  status: 'active' | 'archived' | 'completed'
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    // Load projects from localStorage
    const loadProjects = () => {
      const savedProjects = localStorage.getItem('resyft_projects')
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects)
        setProjects(parsed)
        setFilteredProjects(parsed)
      } else {
        // No saved projects - check if should show tutorial
        const hasSeenTutorial = localStorage.getItem('resyft_projects_tutorial_seen')
        if (!hasSeenTutorial) {
          setShowTutorial(true)
        }
        setProjects([])
        setFilteredProjects([])
      }
      setLoading(false)
    }

    loadProjects()
  }, [])

  useEffect(() => {
    let filtered = [...projects]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(project => project.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "name":
          return a.name.localeCompare(b.name)
        case "papers":
          return b.papers.length - a.papers.length
        default:
          return 0
      }
    })

    setFilteredProjects(filtered)
  }, [searchQuery, statusFilter, sortBy, projects])

  const handleDeleteProject = (projectId: string) => {
    const updated = projects.filter(p => p.id !== projectId)
    setProjects(updated)
    localStorage.setItem('resyft_projects', JSON.stringify(updated))
  }

  const handleArchiveProject = (projectId: string) => {
    const updated = projects.map(p =>
      p.id === projectId ? { ...p, status: 'archived' as const } : p
    )
    setProjects(updated)
    localStorage.setItem('resyft_projects', JSON.stringify(updated))
  }

  const handleTutorialComplete = () => {
    localStorage.setItem('resyft_projects_tutorial_seen', 'true')
    setShowTutorial(false)
  }

  const handleTutorialSkip = () => {
    localStorage.setItem('resyft_projects_tutorial_seen', 'true')
    setShowTutorial(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'archived':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getProgress = (project: Project) => {
    if (!project.deadline) return null
    const now = new Date()
    const created = new Date(project.createdAt)
    const deadline = new Date(project.deadline)
    const total = deadline.getTime() - created.getTime()
    const elapsed = now.getTime() - created.getTime()
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        {showTutorial && (
          <ProjectTutorial 
            onComplete={handleTutorialComplete}
            onSkip={handleTutorialSkip}
          />
        )}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-xl playfair-semibold">Research Projects</h1>
            </div>
            <Button 
              id="tutorial-new-project"
              onClick={() => router.push('/projects/new')} 
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">
          {/* Filters and Controls */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div id="tutorial-search" className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div id="tutorial-filters" className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="papers">Paper Count</SelectItem>
                  </SelectContent>
                </Select>

                <div id="tutorial-view-modes" className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-r-none ${viewMode === "grid" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`rounded-l-none ${viewMode === "list" ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-gray-600">
              <span>{filteredProjects.length} projects</span>
              <span>•</span>
              <span>{filteredProjects.reduce((acc, p) => acc + p.papers.length, 0)} total papers</span>
              <span>•</span>
              <span>{filteredProjects.filter(p => p.status === 'active').length} active</span>
            </div>
          </div>

          {/* Projects Grid/List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-32 bg-gray-100" />
                  <CardContent className="h-24 bg-gray-50" />
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="playfair-semibold text-lg mb-2">No projects found</h3>
                <p className="text-gray-600 mb-4 merriweather-light">
                  {searchQuery ? "Try adjusting your search terms" : "Create your first project to get started"}
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => router.push('/projects/new')}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                  {!searchQuery && (
                    <Button 
                      variant="outline"
                      onClick={() => setShowTutorial(true)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Take Tutorial
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle 
                            className="text-base hover:text-blue-600 transition-colors"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            {project.name}
                          </CardTitle>
                          <Badge className={`mt-2 ${getStatusColor(project.status)}`}>
                            {project.status}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/edit`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchiveProject(project.id)}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent 
                      className="space-y-3"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {project.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>{project.papers.length} papers</span>
                        </div>
                        
                        {project.deadline && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {project.collaborators.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{project.collaborators.length} collaborators</span>
                          </div>
                        )}
                      </div>

                      {project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Hash className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {project.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {getProgress(project) !== null && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Progress</span>
                            <span>{Math.round(getProgress(project)!)}%</span>
                          </div>
                          <Progress value={getProgress(project)!} className="h-1.5" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="playfair-semibold hover:text-blue-600 transition-colors">
                              {project.name}
                            </h3>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {project.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {project.papers.length} papers
                            </span>
                            {project.deadline && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due {new Date(project.deadline).toLocaleDateString()}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Created {new Date(project.createdAt).toLocaleDateString()}
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
                              router.push(`/projects/${project.id}/edit`)
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleArchiveProject(project.id)
                            }}>
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProject(project.id)
                              }}
                              className="text-red-600"
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
      </SidebarInset>
    </SidebarProvider>
  )
}