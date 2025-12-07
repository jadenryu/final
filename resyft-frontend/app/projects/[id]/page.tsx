"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { Separator } from "../../../components/ui/separator"
import { Progress } from "../../../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { AppSidebar } from "../../../components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../../components/ui/sidebar"
import {
  Target,
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
  MoreVertical,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  Star,
  BookOpen,
  BarChart3,
  Quote,
  Settings,
  Share,
  Filter,
  SortAsc,
  Eye,
  CheckCircle,
  AlertCircle,
  Upload,
  Copy
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"

interface Paper {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  doi?: string
  url?: string
  addedAt: string
  status: 'processing' | 'completed' | 'error'
  summary?: string
  quotes?: string[]
  statistics?: string[]
  relevanceScore: number
  tags: string[]
}

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
  papers: Paper[]
  status: 'active' | 'archived' | 'completed'
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [papers, setPapers] = useState<Paper[]>([])
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const loadProject = () => {
      // Load project from localStorage
      const savedProjects = localStorage.getItem('resyft_projects')
      if (savedProjects) {
        const projects = JSON.parse(savedProjects)
        const foundProject = projects.find((p: Project) => p.id === projectId)
        if (foundProject) {
          setProject(foundProject)
          // Use actual papers from the project, not demo papers
          const actualPapers = foundProject.papers || []
          setPapers(actualPapers)
          setFilteredPapers(actualPapers)
        }
      }
      setLoading(false)
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId])

  useEffect(() => {
    let filtered = [...papers]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(paper =>
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        paper.journal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(paper => paper.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "relevance":
          return b.relevanceScore - a.relevanceScore
        case "year":
          return b.year - a.year
        default:
          return 0
      }
    })

    setFilteredPapers(filtered)
  }, [searchQuery, statusFilter, sortBy, papers])

  const handleDeletePaper = (paperId: string) => {
    const updatedPapers = papers.filter(p => p.id !== paperId)
    setPapers(updatedPapers)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'processing':
        return 'bg-yellow-100 text-yellow-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading project...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!project) {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl playfair-semibold text-gray-900 mb-2">Project Not Found</h2>
              <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
              <Button onClick={() => router.push('/projects')}>
                Back to Projects
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <h1 className="text-lg playfair-semibold">{project.name}</h1>
                  <p className="text-sm text-gray-600">{papers.length} papers</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button onClick={() => router.push('/upload')} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Paper
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="papers" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Papers ({papers.length})
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Project Info */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Research Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="merriweather-regular text-gray-900 mb-2">Description</h4>
                          <p className="text-gray-600">{project.description}</p>
                        </div>
                        <div>
                          <h4 className="merriweather-regular text-gray-900 mb-2">Research Thesis</h4>
                          <p className="text-gray-600 italic">"{project.thesis}"</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map(tag => (
                            <Badge key={tag} variant="outline">
                              <Hash className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Papers */}
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Recent Papers</CardTitle>
                          <Button variant="ghost" size="sm" onClick={() => setActiveTab("papers")}>
                            View All
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {papers.slice(0, 3).map(paper => (
                            <div key={paper.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <h4 className="merriweather-regular text-sm line-clamp-1">{paper.title}</h4>
                                <p className="text-xs text-gray-600">
                                  {paper.authors[0]} et al. • {paper.journal} • {paper.year}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(paper.status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(paper.status)}
                                    {paper.status}
                                  </div>
                                </Badge>
                                {paper.status === 'completed' && (
                                  <Badge variant="outline" className="text-xs">
                                    {paper.relevanceScore}% match
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Project Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Project Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">Total Papers</span>
                          </div>
                          <span className="playfair-semibold">{papers.length}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Analyzed</span>
                          </div>
                          <span className="playfair-semibold">
                            {papers.filter(p => p.status === 'completed').length}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Quote className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">Quotes Extracted</span>
                          </div>
                          <span className="playfair-semibold">
                            {papers.reduce((acc, p) => acc + (p.quotes?.length || 0), 0)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-orange-500" />
                            <span className="text-sm">Statistics Found</span>
                          </div>
                          <span className="playfair-semibold">
                            {papers.reduce((acc, p) => acc + (p.statistics?.length || 0), 0)}
                          </span>
                        </div>

                        {project.deadline && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                              </div>
                              <Progress 
                                value={Math.min(100, ((Date.now() - new Date(project.createdAt).getTime()) / (new Date(project.deadline).getTime() - new Date(project.createdAt).getTime())) * 100)} 
                                className="h-2" 
                              />
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Collaborators */}
                    {project.collaborators.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Collaborators
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {project.collaborators.map(email => (
                              <div key={email} className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs merriweather-regular text-blue-700">
                                    {email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span>{email}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Papers Tab */}
              <TabsContent value="papers" className="space-y-6 mt-6">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search papers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[130px]">
                        <SortAsc className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/upload')}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Add Paper
                    </Button>
                  </div>
                </div>

                {/* Papers List */}
                <div className="space-y-4">
                  {filteredPapers.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="playfair-semibold text-lg mb-2">No papers found</h3>
                        <p className="text-gray-600 mb-4">
                          {searchQuery ? "Try adjusting your search terms" : "Start by adding your first research paper"}
                        </p>
                        <Button onClick={() => router.push('/upload')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Paper
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredPapers.map((paper, index) => (
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className="playfair-semibold text-lg mb-2 hover:text-blue-600 cursor-pointer">
                                  {paper.title}
                                </h3>
                                <p className="text-gray-600 text-sm mb-2">
                                  {paper.authors.join(", ")} • {paper.journal} • {paper.year}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(paper.status)}>
                                    <div className="flex items-center gap-1">
                                      {getStatusIcon(paper.status)}
                                      {paper.status}
                                    </div>
                                  </Badge>
                                  {paper.status === 'completed' && (
                                    <Badge variant="outline">
                                      {paper.relevanceScore}% relevance
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    Added {new Date(paper.addedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {paper.url && (
                                    <DropdownMenuItem>
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      View Original
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Analysis
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeletePaper(paper.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {paper.status === 'completed' && (
                              <div className="space-y-4">
                                {paper.summary && (
                                  <div>
                                    <h4 className="merriweather-regular text-sm mb-2">Summary</h4>
                                    <p className="text-gray-600 text-sm">{paper.summary}</p>
                                  </div>
                                )}

                                {paper.quotes && paper.quotes.length > 0 && (
                                  <div>
                                    <h4 className="merriweather-regular text-sm mb-2">Key Quotes</h4>
                                    <div className="space-y-2">
                                      {paper.quotes.map((quote, idx) => (
                                        <div key={idx} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500 relative group">
                                          <blockquote className="text-sm text-gray-700 italic">
                                            "{quote}"
                                          </blockquote>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => copyToClipboard(quote)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {paper.statistics && paper.statistics.length > 0 && (
                                  <div>
                                    <h4 className="merriweather-regular text-sm mb-2">Key Statistics</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {paper.statistics.map((stat, idx) => (
                                        <div key={idx} className="text-sm bg-gray-50 p-2 rounded group relative">
                                          {stat}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => copyToClipboard(stat)}
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {paper.tags.length > 0 && (
                                  <div>
                                    <div className="flex flex-wrap gap-1">
                                      {paper.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Research Insights</CardTitle>
                    <CardDescription>
                      AI-generated insights from your analyzed papers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg playfair-semibold text-gray-900 mb-2">Insights Coming Soon</h3>
                      <p className="text-gray-600">
                        Advanced analytics and insights will be available once you have more analyzed papers.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Settings</CardTitle>
                    <CardDescription>
                      Manage project configuration and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg playfair-semibold text-gray-900 mb-2">Settings Panel</h3>
                      <p className="text-gray-600">
                        Project-specific settings and extraction preferences will be available here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}