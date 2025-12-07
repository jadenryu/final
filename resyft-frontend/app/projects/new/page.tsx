"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Badge } from "../../../components/ui/badge"
import { Separator } from "../../../components/ui/separator"
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group"
import { Switch } from "../../../components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Progress } from "../../../components/ui/progress"
import { AppSidebar } from "../../../components/app-sidebar"
import { BackNavigation } from "../../../components/back-navigation"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../../components/ui/sidebar"
import {
  FolderPlus,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Target,
  BookOpen,
  Hash,
  Calendar,
  Users,
  X,
  Brain,
  Lightbulb,
  Search,
  FileText,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertTriangle
} from "lucide-react"

interface ProjectFormData {
  name: string
  description: string
  thesis: string
  researchType: 'exploratory' | 'hypothesis' | 'systematic' | 'meta'
  methodology: string
  keywords: string[]
  field: string
  subfield: string
  deadline: string
  collaborators: string[]
  tags: string[]
  extractionFocus: {
    methodology: boolean
    results: boolean
    statistics: boolean
    limitations: boolean
    futureWork: boolean
  }
  autoAnalysis: boolean
  citationTracking: boolean
}

export default function NewProjectPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    thesis: "",
    researchType: 'exploratory',
    methodology: "",
    keywords: [],
    field: "",
    subfield: "",
    deadline: "",
    collaborators: [],
    tags: [],
    extractionFocus: {
      methodology: true,
      results: true,
      statistics: true,
      limitations: false,
      futureWork: false
    },
    autoAnalysis: true,
    citationTracking: true
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [newKeyword, setNewKeyword] = useState("")
  const [newTag, setNewTag] = useState("")
  const [newCollaborator, setNewCollaborator] = useState("")
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  const researchFields = [
    "Computer Science",
    "Biology",
    "Medicine",
    "Physics",
    "Chemistry",
    "Psychology",
    "Economics",
    "Environmental Science",
    "Engineering",
    "Mathematics",
    "Social Sciences",
    "Other"
  ]
  
  const subfieldsByField: Record<string, string[]> = {
    "Computer Science": ["Machine Learning", "AI", "Computer Vision", "NLP", "Systems", "Theory", "HCI", "Security"],
    "Biology": ["Molecular Biology", "Genetics", "Ecology", "Neuroscience", "Cell Biology", "Biochemistry"],
    "Medicine": ["Clinical Research", "Epidemiology", "Public Health", "Pharmacology", "Pathology"],
    "Physics": ["Quantum Physics", "Astrophysics", "Particle Physics", "Condensed Matter", "Theoretical Physics"],
    "Chemistry": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry"],
    "Psychology": ["Cognitive Psychology", "Clinical Psychology", "Social Psychology", "Developmental Psychology"],
    "Economics": ["Microeconomics", "Macroeconomics", "Behavioral Economics", "Development Economics"],
    "Environmental Science": ["Climate Science", "Conservation", "Sustainability", "Environmental Policy"],
    "Engineering": ["Mechanical", "Electrical", "Civil", "Chemical", "Biomedical", "Software"],
    "Mathematics": ["Pure Mathematics", "Applied Mathematics", "Statistics", "Computational Mathematics"],
    "Social Sciences": ["Sociology", "Anthropology", "Political Science", "Geography"],
    "Other": []
  }
  
  const researchTypeDescriptions = {
    exploratory: "Investigating a new area or phenomenon without a specific hypothesis",
    hypothesis: "Testing a specific hypothesis or theory with defined variables",
    systematic: "Comprehensive review of existing literature on a specific topic",
    meta: "Statistical analysis of results from multiple studies"
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    if (!formData.name) {
      errors.push("Project name is required")
    }
    
    if (!formData.description) {
      errors.push("Project description is required")
    }
    
    if (!formData.thesis) {
      errors.push("Research thesis/topic is required")
    }
    
    if (formData.thesis.length < 50) {
      errors.push("Research thesis should be at least 50 characters for clarity")
    }
    
    if (formData.keywords.length === 0) {
      errors.push("At least one research keyword is required")
    }
    
    if (!formData.field) {
      errors.push("Research field is required")
    }
    
    if (formData.name.length > 100) {
      errors.push("Project name must be less than 100 characters")
    }
    
    if (formData.description.length > 500) {
      errors.push("Description must be less than 500 characters")
    }
    
    return errors
  }

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }))
      setNewTag("")
    }
  }
  
  const handleAddKeyword = () => {
    if (newKeyword && !formData.keywords.includes(newKeyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword]
      }))
      setNewKeyword("")
    }
  }
  
  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }
  
  const generateSuggestedKeywords = () => {
    // Generate keyword suggestions based on thesis
    if (formData.thesis.length > 20) {
      const commonWords = ['the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were']
      const words = formData.thesis.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4 && !commonWords.includes(word))
        .slice(0, 5)
      
      return words
    }
    return []
  }
  
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.description && formData.field
      case 2:
        return formData.thesis.length >= 50 && formData.keywords.length > 0
      case 3:
        return true // Optional settings
      default:
        return false
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleAddCollaborator = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (newCollaborator && emailRegex.test(newCollaborator)) {
      if (!formData.collaborators.includes(newCollaborator)) {
        setFormData(prev => ({
          ...prev,
          collaborators: [...prev.collaborators, newCollaborator]
        }))
        setNewCollaborator("")
      }
    } else if (newCollaborator) {
      setErrors(["Please enter a valid email address"])
      setTimeout(() => setErrors([]), 3000)
    }
  }

  const handleRemoveCollaborator = (email: string) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c !== email)
    }))
  }

  const handleSubmit = async () => {
    const validationErrors = validateForm()
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setProcessing(true)
    setErrors([])
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Save to localStorage for demo
      const projects = JSON.parse(localStorage.getItem('resyft_projects') || '[]')
      const newProject = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        papers: [],
        status: 'active'
      }
      projects.push(newProject)
      localStorage.setItem('resyft_projects', JSON.stringify(projects))
      
      setSuccess(true)
      setTimeout(() => {
        router.push(`/projects/${newProject.id}`)
      }, 1000)
    } catch (error) {
      setErrors(["Failed to create project. Please try again."])
      setProcessing(false)
    }
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <BackNavigation />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-xl playfair-semibold">Create New Project</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Info Alert */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Projects help you organize research papers around a specific thesis or topic. 
                  All papers added to this project will be analyzed with your research goals in mind.
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Progress Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm merriweather-regular">Step {currentStep} of 3</span>
                  <span className="text-sm text-gray-500">
                    {currentStep === 1 ? 'Basic Information' : currentStep === 2 ? 'Research Definition' : 'Advanced Settings'}
                  </span>
                </div>
                <Progress value={currentStep * 33.33} className="h-2" />
              </div>
            </motion.div>
            
            {/* Main Form Card */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderPlus className="w-5 h-5" />
                    Project Details
                  </CardTitle>
                  <CardDescription>
                    Define your research project parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs value={currentStep.toString()} onValueChange={(v) => setCurrentStep(parseInt(v))}>
                    <TabsList className="hidden">
                      <TabsTrigger value="1">Basic</TabsTrigger>
                      <TabsTrigger value="2">Research</TabsTrigger>
                      <TabsTrigger value="3">Settings</TabsTrigger>
                    </TabsList>
                    
                    {/* Step 1: Basic Information */}
                    <TabsContent value="1" className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Project Name *</Label>
                          <Input
                            id="name"
                            placeholder="e.g., Climate Change Impact Study"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="mt-2"
                            maxLength={100}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.name.length}/100 characters
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="description">Description *</Label>
                          <Textarea
                            id="description"
                            placeholder="Briefly describe your research goals and objectives..."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="mt-2 min-h-[100px]"
                            maxLength={500}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.description.length}/500 characters
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="field">Research Field *</Label>
                          <Select 
                            value={formData.field} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, field: value, subfield: '' }))}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select your research field" />
                            </SelectTrigger>
                            <SelectContent>
                              {researchFields.map(field => (
                                <SelectItem key={field} value={field}>
                                  {field}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {formData.field && subfieldsByField[formData.field]?.length > 0 && (
                          <div>
                            <Label htmlFor="subfield">Subfield (Optional)</Label>
                            <Select 
                              value={formData.subfield} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, subfield: value }))}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select a subfield" />
                              </SelectTrigger>
                              <SelectContent>
                                {subfieldsByField[formData.field].map(subfield => (
                                  <SelectItem key={subfield} value={subfield}>
                                    {subfield}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Step 2: Research Definition */}
                    <TabsContent value="2" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="merriweather-regular flex items-center gap-2">
                          <Brain className="w-4 h-4" />
                          Define Your Research
                        </h3>
                        
                        <div>
                          <Label>Research Type *</Label>
                          <RadioGroup 
                            value={formData.researchType} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, researchType: value as any }))}
                            className="mt-2 space-y-3"
                          >
                            {Object.entries(researchTypeDescriptions).map(([type, description]) => (
                              <div key={type} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value={type} id={type} className="mt-1" />
                                <Label htmlFor={type} className="cursor-pointer flex-1">
                                  <div className="merriweather-regular capitalize">{type} Research</div>
                                  <div className="text-xs text-gray-500 mt-1">{description}</div>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>

                        <div>
                          <Label htmlFor="thesis">
                            Research {formData.researchType === 'hypothesis' ? 'Hypothesis' : 'Question/Topic'} *
                          </Label>
                          <Textarea
                            id="thesis"
                            placeholder={
                              formData.researchType === 'hypothesis' 
                                ? "State your hypothesis clearly. Example: 'Increased social media usage correlates with decreased attention span in adolescents'"
                                : "Describe your research question or area of investigation. Be as specific as possible."
                            }
                            value={formData.thesis}
                            onChange={(e) => setFormData(prev => ({ ...prev, thesis: e.target.value }))}
                            className="mt-2 min-h-[100px]"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.thesis.length < 50 && formData.thesis.length > 0 && (
                              <span className="text-yellow-600">Add {50 - formData.thesis.length} more characters for clarity</span>
                            )}
                            {formData.thesis.length >= 50 && (
                              <span className="text-green-600">✓ Good length</span>
                            )}
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="methodology">Methodology Approach (Optional)</Label>
                          <Textarea
                            id="methodology"
                            placeholder="Briefly describe your intended research methodology or approach"
                            value={formData.methodology}
                            onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
                            className="mt-2 min-h-[80px]"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="keywords">Research Keywords *</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              id="keywords"
                              placeholder="Add key research terms"
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleAddKeyword}
                            >
                              Add
                            </Button>
                          </div>
                          
                          {/* Suggested Keywords */}
                          {formData.keywords.length === 0 && formData.thesis.length > 20 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-2">Suggested keywords from your thesis:</p>
                              <div className="flex flex-wrap gap-2">
                                {generateSuggestedKeywords().map(keyword => (
                                  <Badge 
                                    key={keyword} 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-blue-50"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        keywords: [...prev.keywords, keyword]
                                      }))
                                    }}
                                  >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {formData.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {formData.keywords.map(keyword => (
                                <Badge key={keyword} variant="secondary" className="gap-1">
                                  <Search className="w-3 h-3" />
                                  {keyword}
                                  <button
                                    onClick={() => handleRemoveKeyword(keyword)}
                                    className="ml-1 hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Step 3: Advanced Settings */}
                    <TabsContent value="3" className="space-y-6">
                      <div className="space-y-6">
                        {/* Extraction Focus */}
                        <div>
                          <h3 className="merriweather-regular flex items-center gap-2 mb-4">
                            <FileText className="w-4 h-4" />
                            Extraction Focus
                          </h3>
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">What should the AI prioritize when analyzing papers?</p>
                            {Object.entries({
                              methodology: 'Research Methodology',
                              results: 'Results & Findings',
                              statistics: 'Statistical Data',
                              limitations: 'Study Limitations',
                              futureWork: 'Future Research Directions'
                            }).map(([key, label]) => (
                              <div key={key} className="flex items-center justify-between">
                                <Label htmlFor={key} className="text-sm font-normal">{label}</Label>
                                <Switch
                                  id={key}
                                  checked={formData.extractionFocus[key as keyof typeof formData.extractionFocus]}
                                  onCheckedChange={(checked) => setFormData(prev => ({
                                    ...prev,
                                    extractionFocus: {
                                      ...prev.extractionFocus,
                                      [key]: checked
                                    }
                                  }))}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Automation Settings */}
                        <div>
                          <h3 className="merriweather-regular flex items-center gap-2 mb-4">
                            <Lightbulb className="w-4 h-4" />
                            Automation
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="autoAnalysis" className="text-sm font-normal">Auto-analyze new papers</Label>
                                <p className="text-xs text-gray-500">Automatically extract insights when papers are added</p>
                              </div>
                              <Switch
                                id="autoAnalysis"
                                checked={formData.autoAnalysis}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoAnalysis: checked }))}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="citationTracking" className="text-sm font-normal">Track citations</Label>
                                <p className="text-xs text-gray-500">Monitor citation relationships between papers</p>
                              </div>
                              <Switch
                                id="citationTracking"
                                checked={formData.citationTracking}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, citationTracking: checked }))}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label htmlFor="tags">Project Tags</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              id="tags"
                              placeholder="Add keyword tags"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleAddTag}
                            >
                              Add
                            </Button>
                          </div>
                          {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {formData.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="gap-1">
                                  <Hash className="w-3 h-3" />
                                  {tag}
                                  <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-1 hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="deadline">Project Deadline</Label>
                          <Input
                            id="deadline"
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="collaborators">Collaborators</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              id="collaborators"
                              type="email"
                              placeholder="Enter collaborator email"
                              value={newCollaborator}
                              onChange={(e) => setNewCollaborator(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCollaborator())}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleAddCollaborator}
                            >
                              Invite
                            </Button>
                          </div>
                          {formData.collaborators.length > 0 && (
                            <div className="space-y-2 mt-3">
                              {formData.collaborators.map(email => (
                                <div key={email} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    {email}
                                  </span>
                                  <button
                                    onClick={() => handleRemoveCollaborator(email)}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Error Messages */}
                  {errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success Message */}
                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Project created successfully! Redirecting...
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <div>
                      {currentStep > 1 && (
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(prev => prev - 1)}
                          disabled={processing}
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Previous
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/projects')}
                        disabled={processing}
                      >
                        Cancel
                      </Button>
                      
                      {currentStep < 3 ? (
                        <Button
                          onClick={() => setCurrentStep(prev => prev + 1)}
                          disabled={!canProceedToNextStep()}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSubmit}
                          disabled={processing || success || !canProceedToNextStep()}
                          className="min-w-[140px] bg-blue-600 text-white hover:bg-blue-700"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : success ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Created!
                            </>
                          ) : (
                            <>
                              <FolderPlus className="w-4 h-4 mr-2" />
                              Create Project
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}