"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { AppSidebar } from "../../components/app-sidebar"
import { BackNavigation } from "../../components/back-navigation"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import {
  Upload,
  Link,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  ArrowRight,
  FolderPlus,
  Clock,
  FileCheck,
  AlertTriangle
} from "lucide-react"
import { validateAcademicURL, validateAcademicText, validateAcademicFile, sanitizeInput } from "../../lib/validators"
import { useRealtimeValidation } from "../../hooks/use-validation"

interface ValidationError {
  field: string
  message: string
  type?: 'error' | 'warning'
}

export default function UploadPage() {
  const router = useRouter()
  const [uploadType, setUploadType] = useState<"file" | "url" | "text">("file")
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [title, setTitle] = useState("")
  const [project, setProject] = useState("")
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [existingProjects, setExistingProjects] = useState<Array<{id: string, name: string}>>([])

  useEffect(() => {
    // Load existing projects from localStorage
    const savedProjects = JSON.parse(localStorage.getItem('resyft_projects') || '[]')
    setExistingProjects(savedProjects.map((proj: any) => ({
      id: proj.id,
      name: proj.name
    })))
  }, [])
  
  // Real-time validation hooks
  const urlValidation = useRealtimeValidation(url, 'url', {
    debounceMs: 800,
    minLengthBeforeValidation: 10
  })
  
  const textValidation = useRealtimeValidation(text, 'text', {
    debounceMs: 1000,
    minLengthBeforeValidation: 50
  })

  const validateFile = (file: File): ValidationError[] => {
    const validationResult = validateAcademicFile(file)
    const errors: ValidationError[] = []
    
    validationResult.errors.forEach(error => {
      errors.push({
        field: 'file',
        message: error,
        type: 'error'
      })
    })
    
    validationResult.warnings?.forEach(warning => {
      errors.push({
        field: 'file',
        message: warning,
        type: 'warning'
      })
    })
    
    return errors
  }

  const validateUrl = async (url: string): Promise<ValidationError[]> => {
    const validationResult = await validateAcademicURL(url)
    const errors: ValidationError[] = []
    
    validationResult.errors.forEach(error => {
      errors.push({
        field: 'url',
        message: error,
        type: 'error'
      })
    })
    
    validationResult.warnings?.forEach(warning => {
      errors.push({
        field: 'url',
        message: warning,
        type: 'warning'
      })
    })
    
    return errors
  }

  const validateText = (text: string): ValidationError[] => {
    const validationResult = validateAcademicText(text, {
      checkLanguage: true,
      checkQuality: true
    })
    const errors: ValidationError[] = []
    
    validationResult.errors.forEach(error => {
      errors.push({
        field: 'text',
        message: error,
        type: 'error'
      })
    })
    
    validationResult.warnings?.forEach(warning => {
      errors.push({
        field: 'text',
        message: warning,
        type: 'warning'
      })
    })
    
    return errors
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const fileErrors = validateFile(droppedFile)
      
      if (fileErrors.length === 0) {
        setFile(droppedFile)
        setErrors([])
      } else {
        setErrors(fileErrors)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const fileErrors = validateFile(selectedFile)
      
      if (fileErrors.length === 0) {
        setFile(selectedFile)
        setErrors([])
      } else {
        setErrors(fileErrors)
      }
    }
  }

  const handleSubmit = async () => {
    setErrors([])
    let validationErrors: ValidationError[] = []
    
    // Validate based on upload type
    if (uploadType === "file") {
      if (!file) {
        validationErrors.push({
          field: 'file',
          message: 'Please select a file to upload'
        })
      } else {
        validationErrors = validateFile(file)
      }
    } else if (uploadType === "url") {
      validationErrors = await validateUrl(url)
    } else if (uploadType === "text") {
      const sanitizedText = sanitizeInput(text)
      setText(sanitizedText)
      validationErrors = validateText(sanitizedText)
    }
    
    // Validate title
    if (!title) {
      validationErrors.push({
        field: 'title',
        message: 'Please provide a title for this document'
      })
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setProcessing(true)
    
    try {
      // Prepare payload for backend
      let paperData: any = {
        title,
        extraction_type: 'all'
      }
      
      // Handle different upload types
      if (uploadType === "file" && file) {
        // For file upload, we'd need to convert to text or handle file upload differently
        paperData.paper_text = "File upload processing not yet implemented - using text extraction"
        paperData.paper_url = ""
      } else if (uploadType === "url") {
        paperData.paper_url = url
        paperData.paper_text = ""
      } else if (uploadType === "text") {
        paperData.paper_text = text
        paperData.paper_url = ""
      }
      
      // Call the extraction API
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paperData)
      })
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Store the result in localStorage for later access
      const savedProjects = JSON.parse(localStorage.getItem('resyft_projects') || '[]')
      const paperEntry = {
        id: result.id || `paper_${Date.now()}`,
        title,
        uploadType,
        uploadedAt: new Date().toISOString(),
        status: 'completed',
        analysisResult: result,
        ...(uploadType === "url" && { url }),
        ...(uploadType === "file" && file && { fileName: file.name, fileSize: file.size }),
        ...(uploadType === "text" && { textLength: text.length })
      }
      
      if (project && project !== "none") {
        // Add to existing project
        const updatedProjects = savedProjects.map((proj: any) => {
          if (proj.id === project) {
            return {
              ...proj,
              papers: [...proj.papers, paperEntry],
              updatedAt: new Date().toISOString()
            }
          }
          return proj
        })
        localStorage.setItem('resyft_projects', JSON.stringify(updatedProjects))
      } else {
        // Store as individual paper
        const individualPapers = JSON.parse(localStorage.getItem('resyft_individual_papers') || '[]')
        individualPapers.push(paperEntry)
        localStorage.setItem('resyft_individual_papers', JSON.stringify(individualPapers))
      }
      
      setSuccess(true)
      setTimeout(() => {
        if (project && project !== "none") {
          router.push(`/projects/${project}`)
        } else {
          router.push('/dashboard')
        }
      }, 1500)
    } catch (error) {
      console.error('Upload error:', error)
      setErrors([{
        field: 'general',
        message: 'Failed to upload paper. Please try again.'
      }])
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
              <h1 className="text-xl playfair-semibold">Upload Documents</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Instructions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Tip:</strong> For long-term research, consider creating a project first to organize multiple papers around your thesis or topic.
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2 text-blue-600 p-0 h-auto"
                    onClick={() => router.push('/projects/new')}
                  >
                    Create Project
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>

            {/* Main Upload Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Add Document</CardTitle>
                  <CardDescription>
                    Upload any document type - PDF, Word, text files, or paste content directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload Type Tabs */}
                  <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="file">
                        <FileText className="w-4 h-4 mr-2" />
                        File Upload
                      </TabsTrigger>
                      <TabsTrigger value="url">
                        <Link className="w-4 h-4 mr-2" />
                        URL
                      </TabsTrigger>
                      <TabsTrigger value="text">
                        <FileText className="w-4 h-4 mr-2" />
                        Text
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-4">
                      <div
                        className={`
                          border-2 border-dashed rounded-lg p-8 text-center transition-colors
                          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                          ${file ? 'bg-green-50 border-green-300' : ''}
                        `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        {file ? (
                          <div className="space-y-2">
                            <FileCheck className="w-12 h-12 mx-auto text-green-600" />
                            <p className="merriweather-regular text-green-900">{file.name}</p>
                            <p className="text-sm text-green-700">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFile(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Upload className="w-12 h-12 mx-auto text-gray-400" />
                            <div>
                              <p className="text-gray-600">
                                Drag and drop your PDF here, or
                              </p>
                              <Label htmlFor="file-upload" className="cursor-pointer">
                                <span className="text-blue-600 hover:text-blue-700 merriweather-regular">
                                  browse files
                                </span>
                              </Label>
                              <Input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept=".pdf,.txt"
                                onChange={handleFileChange}
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              PDF or TXT • Max 10MB
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="url" className="space-y-4">
                      <div>
                        <Label htmlFor="url">Paper URL</Label>
                        <div className="relative">
                          <Input
                            id="url"
                            type="url"
                            placeholder="https://arxiv.org/pdf/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className={`mt-2 pr-10 ${
                              urlValidation.errors.length > 0 ? 'border-red-500 focus:ring-red-500' : 
                              urlValidation.warnings.length > 0 ? 'border-yellow-500 focus:ring-yellow-500' :
                              url && urlValidation.isValid ? 'border-green-500 focus:ring-green-500' : ''
                            }`}
                          />
                          {urlValidation.isValidating && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-1">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            </div>
                          )}
                          {!urlValidation.isValidating && url && urlValidation.isValid && urlValidation.errors.length === 0 && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 w-4 h-4 text-green-600" />
                          )}
                          {!urlValidation.isValidating && urlValidation.errors.length > 0 && (
                            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 w-4 h-4 text-red-600" />
                          )}
                          {!urlValidation.isValidating && urlValidation.errors.length === 0 && urlValidation.warnings.length > 0 && (
                            <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        
                        {/* Real-time validation feedback */}
                        {urlValidation.errors.length > 0 && (
                          <div className="mt-2 text-xs text-red-600">
                            {urlValidation.errors[0]}
                          </div>
                        )}
                        {urlValidation.warnings.length > 0 && urlValidation.errors.length === 0 && (
                          <div className="mt-2 text-xs text-yellow-600">
                            {urlValidation.warnings[0]}
                          </div>
                        )}
                        {!urlValidation.errors.length && !urlValidation.warnings.length && (
                          <p className="text-xs text-gray-500 mt-2">
                            Supported: arXiv, PubMed, Nature, Science, IEEE, and more
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4">
                      <div>
                        <Label htmlFor="text">Paper Text</Label>
                        <div className="relative">
                          <Textarea
                            id="text"
                            placeholder="Paste the full text of the research paper here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className={`mt-2 min-h-[200px] ${
                              textValidation.errors.length > 0 ? 'border-red-500 focus:ring-red-500' : 
                              textValidation.warnings.length > 0 ? 'border-yellow-500 focus:ring-yellow-500' :
                              text.length >= 100 && textValidation.isValid ? 'border-green-500 focus:ring-green-500' : ''
                            }`}
                          />
                          {textValidation.isValidating && (
                            <div className="absolute right-3 top-3">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Real-time validation feedback */}
                        {textValidation.errors.length > 0 && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {textValidation.errors[0]}
                            </AlertDescription>
                          </Alert>
                        )}
                        {textValidation.warnings.length > 0 && textValidation.errors.length === 0 && (
                          <Alert className="border-yellow-200 bg-yellow-50 mt-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-xs text-yellow-800">
                              {textValidation.warnings[0]}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="flex justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            Min: 100 characters • Max: 50,000 characters
                          </p>
                          <p className={`text-xs ${
                            text.length < 100 ? 'text-red-600' : 
                            text.length > 50000 ? 'text-red-600' : 
                            'text-gray-600'
                          }`}>
                            {text.length} / 50,000
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Paper Details */}
                  <Separator />
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Document Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter the document title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="project">Add to Project (Optional)</Label>
                      <Select value={project} onValueChange={setProject}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a project or leave empty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Project</SelectItem>
                          {existingProjects.map(proj => (
                            <SelectItem key={proj.id} value={proj.id}>
                              {proj.name}
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => router.push('/projects/new')}
                          >
                            <FolderPlus className="w-4 h-4 mr-2" />
                            Create New Project
                          </Button>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Error and Warning Messages */}
                  {errors.filter(e => e.type === 'error' || !e.type).length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {errors.filter(e => e.type === 'error' || !e.type).map((error, index) => (
                            <li key={index}>{error.message}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {errors.filter(e => e.type === 'warning').length > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <ul className="list-disc list-inside space-y-1">
                          {errors.filter(e => e.type === 'warning').map((error, index) => (
                            <li key={index}>{error.message}</li>
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
                        Document uploaded successfully! Redirecting to dashboard...
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={processing || success}
                      className="min-w-[120px] bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Success!
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Processing Time Notice */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <p className="merriweather-regular">Processing Time</p>
                    <p>Documents typically take 30-60 seconds to process and extract insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}