"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { ScrollArea } from "../components/ui/scroll-area"
import { Badge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../components/ui/sheet"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { AppSidebar } from "../components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar"
import {
  Send,
  User,
  RefreshCw,
  Search,
  BookOpen,
  FileText,
  Plus,
  Upload,
  GraduationCap,
  Brain,
  Zap,
  Loader2,
  AlertCircle,
  Sparkles,
  Users,
  Calendar,
  BarChart3
} from "lucide-react"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  class_id?: string
  tools_used?: string[]
  error?: boolean
}

interface ClassItem {
  id: string
  name: string
  course_code: string
  semester: string
  instructor: string
  color_theme: string
  document_count: number
  last_activity: string
}

// Simple typing indicator component
function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
        <div className="flex items-center gap-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          <div className="w-1 h-1 rounded-full bg-blue-200"></div>
        </div>
      </div>

      <div className="max-w-4xl mr-8 md:mr-16">
        <div className="bg-slate-50 text-slate-900 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-sm text-slate-600">Analyzing your course materials...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SchoolProductivityHome() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showCreateClassModal, setShowCreateClassModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const landingInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Initialize with empty classes - users will create their own
  useEffect(() => {
    setClasses([])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (message?: string, fromLanding?: boolean) => {
    const inputElement = fromLanding ? landingInputRef.current : chatInputRef.current
    const messageToSend = message || (inputElement?.value?.trim() || "")
    if (!messageToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      class_id: selectedClassId || undefined
    }

    setMessages(prev => [...prev, userMessage])
    if (inputElement) inputElement.value = ""
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Generate AI response
      const aiResponseData = await generateAIResponse(messageToSend)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseData.response,
        timestamp: new Date(),
        class_id: selectedClassId || undefined,
        tools_used: aiResponseData.tools_used
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Message handling error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. This could be due to a temporary service issue. Please try again in a moment.",
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const generateAIResponse = async (input: string): Promise<{ response: string, tools_used?: string[] }> => {
    try {
      const conversationHistory = messages
        .filter(m => !m.error)
        .map(m => ({
          role: m.role,
          content: m.content,
          class_id: m.class_id,
          ...(m.tools_used && { tools_used: m.tools_used })
        }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          class_id: selectedClassId,
          conversation_history: conversationHistory.slice(-10)
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.response) {
        return {
          response: data.response,
          tools_used: data.tools_used || []
        }
      } else {
        throw new Error('No valid response generated')
      }

    } catch (error) {
      console.error('AI Response Error:', error)
      const selectedClass = classes.find(c => c.id === selectedClassId)
      const className = selectedClass ? selectedClass.name : "your courses"

      return {
        response: `I understand you're asking about "${input}" in ${className}. I can help you search through your course materials, find relevant information, and answer questions based on your uploaded documents. Please make sure you've uploaded course materials for the best results.`,
        tools_used: []
      }
    }
  }

  const clearConversation = () => {
    setMessages([])
  }

  const createClass = (classData: { name: string; course_code: string; semester: string; instructor: string; color_theme: string }) => {
    const newClass: ClassItem = {
      id: Date.now().toString(),
      name: classData.name,
      course_code: classData.course_code,
      semester: classData.semester,
      instructor: classData.instructor,
      color_theme: classData.color_theme,
      document_count: 0,
      last_activity: "Just created"
    }
    setClasses(prev => [...prev, newClass])
    setShowCreateClassModal(false)
  }

  const uploadDocument = async (classId: string, file: File) => {
    try {
      setIsLoading(true)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', 'lecture_notes')

      const response = await fetch(`http://localhost:8001/classes/${classId}/documents`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Upload failed: ${response.status}`)
      }

      const result = await response.json()

      // Update the class document count
      setClasses(prev => prev.map(cls =>
        cls.id === classId
          ? { ...cls, document_count: cls.document_count + 1, last_activity: "Just now" }
          : cls
      ))

      setShowUploadModal(false)

      // Show success message or notification here if needed
      console.log('✅ Document uploaded successfully:', result)

    } catch (error) {
      console.error('❌ Document upload failed:', error)
      // You could add a toast notification here for better UX
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (example: string) => {
    handleSubmit(example)
  }

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId)
    setMessages([]) // Clear messages when switching classes
  }

  // Landing page when no messages
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center px-6 font-merriweather">
      <div className="w-full max-w-6xl mx-auto">

        {/* Main Heading */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="w-12 h-12 text-indigo-600" />
            <h1 className="text-4xl md:text-5xl playfair-bold text-slate-900 leading-tight">
              Study Smarter with AI
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Upload your course materials and get instant answers. Our AI studies your documents so you can focus on learning what matters most.
          </p>
        </div>

        {/* Class Selection */}
        {classes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl playfair-semibold text-slate-900">Your Classes</h2>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                {classes.length} Active
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {classes.map((classItem) => (
                <Card
                  key={classItem.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedClassId === classItem.id
                      ? 'ring-2 ring-indigo-500 bg-indigo-50'
                      : 'hover:border-slate-300'
                  }`}
                  onClick={() => handleClassSelect(classItem.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: classItem.color_theme }}
                          />
                          <span className="text-sm font-medium text-slate-600">
                            {classItem.course_code}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 leading-tight">
                          {classItem.name}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {classItem.instructor} • {classItem.semester}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>{classItem.document_count} documents</span>
                      <span>{classItem.last_activity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-indigo-300 focus-within:shadow-md p-5">
              {/* Class context indicator */}
              {selectedClassId && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm text-slate-600">
                    Asking about: <span className="font-medium text-slate-900">
                      {classes.find(c => c.id === selectedClassId)?.name || "Selected Class"}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedClassId(null)}
                    className="ml-auto text-slate-400 hover:text-slate-600 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              )}

              {/* Main input row */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    ref={landingInputRef}
                    type="text"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(undefined, true)
                      }
                    }}
                    placeholder={
                      selectedClassId
                        ? "Ask a question about this class..."
                        : "Select a class and ask a question about your course materials..."
                    }
                    className="w-full text-lg border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-slate-400"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleSubmit(undefined, true)
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-5 py-2.5 transition-colors flex-shrink-0"
                  disabled={isLoading || !selectedClassId}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm h-8 px-3 rounded-lg"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm h-8 px-3 rounded-lg"
                    onClick={() => setShowCreateClassModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Class
                  </Button>
                </div>
                <div className="text-xs text-slate-600">
                  {selectedClassId ? "Press Enter to ask" : "Select a class first"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Study Tools Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl playfair-semibold text-slate-900">AI Study Tools</h2>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Powered by Your Documents
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Smart Search */}
            <div
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => selectedClassId && handleExampleClick("Find the main concepts from today's lecture")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="playfair-regular text-slate-900 mb-2">Smart Search</h3>
                  <p className="text-slate-600 text-sm leading-relaxed merriweather-light">
                    Find concepts, definitions, and key points across all your course materials instantly
                  </p>
                </div>
              </div>
            </div>

            {/* Study Sessions */}
            <div
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => selectedClassId && handleExampleClick("Help me review for the upcoming exam")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors flex-shrink-0">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="playfair-regular text-slate-900 mb-2">Study Sessions</h3>
                  <p className="text-slate-600 text-sm leading-relaxed merriweather-light">
                    Get personalized study plans and review sessions based on your materials
                  </p>
                </div>
              </div>
            </div>

            {/* Document Analysis */}
            <div
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => selectedClassId && handleExampleClick("Summarize the key points from my uploaded readings")}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="playfair-regular text-slate-900 mb-2">Document Analysis</h3>
                  <p className="text-slate-600 text-sm leading-relaxed merriweather-light">
                    Get summaries, key points, and connections between your course documents
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowCreateClassModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Class
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          </div>
          <p className="text-sm text-slate-500">Your AI study assistant • Powered by Resyft</p>
        </div>
      </div>
    </div>
  )

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-lg playfair-semibold text-slate-900">
                  {selectedClassId
                    ? classes.find(c => c.id === selectedClassId)?.name || "Class Study Assistant"
                    : "AI Study Assistant"
                  }
                </h1>
                <p className="text-xs text-slate-500 merriweather-regular">
                  {selectedClassId
                    ? `${classes.find(c => c.id === selectedClassId)?.course_code} • Document-based AI`
                    : "Select a class to get started"
                  }
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                className="border-slate-200 hover:bg-slate-50 rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-50/50 to-white">
          {messages.length === 0 ? (
            <LandingPage />
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4 md:p-6 lg:p-8">
                  <div className="max-w-5xl mx-auto space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className={`max-w-4xl ${
                          message.role === 'user' ? 'ml-8 md:ml-16' : 'mr-8 md:mr-16'
                        }`}>
                          <div className={`rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-indigo-500 text-white ml-auto'
                              : message.error
                                ? 'bg-red-50 border border-red-200 text-red-800'
                                : 'bg-slate-50 text-slate-900'
                          }`}>
                              {message.error && (
                                <div className="flex items-center gap-2 mb-3">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-sm merriweather-regular text-red-700">Service Error</span>
                                </div>
                              )}

                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.content}
                              </div>

                              {message.tools_used && message.tools_used.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-3 h-3 text-indigo-600" />
                                    <span className="text-xs merriweather-bold text-slate-700">Tools used:</span>
                                  </div>
                                  {message.tools_used.map((toolId, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200 transition-colors px-2 py-1 rounded-full"
                                    >
                                      {toolId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && <TypingIndicator />}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t bg-white/90 backdrop-blur-sm p-4 md:p-6 shadow-sm">
                  <div className="max-w-5xl mx-auto">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-indigo-300 p-4">
                        {/* Class context indicator */}
                        {selectedClassId && (
                          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm text-slate-600">
                              Asking about: <span className="font-medium text-slate-900">
                                {classes.find(c => c.id === selectedClassId)?.name}
                              </span>
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <input
                            ref={chatInputRef}
                            type="text"
                            placeholder={
                              selectedClassId
                                ? "Ask about your course materials..."
                                : "Select a class first to ask questions..."
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                              }
                            }}
                            className="flex-1 text-base border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-slate-400"
                            disabled={isLoading || !selectedClassId}
                            autoComplete="off"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isLoading || !selectedClassId}
                            className="bg-indigo-500 hover:bg-indigo-600 rounded-xl px-4 py-2 transition-colors flex-shrink-0"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-slate-600 merriweather-regular">Press Enter to send</div>
                          <div className="text-xs text-slate-500">Document-based AI</div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </SidebarInset>

      {/* Create Class Modal */}
      <CreateClassModal
        open={showCreateClassModal}
        onOpenChange={setShowCreateClassModal}
        onCreateClass={createClass}
      />

      {/* Upload Document Modal */}
      <UploadDocumentModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        classes={classes}
        onUpload={uploadDocument}
        isLoading={isLoading}
      />
    </SidebarProvider>
  )
}

// Create Class Modal Component
function CreateClassModal({
  open,
  onOpenChange,
  onCreateClass
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateClass: (classData: { name: string; course_code: string; semester: string; instructor: string; color_theme: string }) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    course_code: '',
    semester: '',
    instructor: '',
    color_theme: '#3B82F6'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.course_code) {
      onCreateClass(formData)
      setFormData({
        name: '',
        course_code: '',
        semester: '',
        instructor: '',
        color_theme: '#3B82F6'
      })
    }
  }

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#F59E0B', label: 'Orange' },
    { value: '#EF4444', label: 'Red' },
    { value: '#06B6D4', label: 'Cyan' }
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create New Class</SheetTitle>
          <SheetDescription>
            Add a new class to organize your study materials and documents.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Class Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Introduction to Computer Science"
              required
            />
          </div>
          <div>
            <Label htmlFor="course_code">Course Code</Label>
            <Input
              id="course_code"
              value={formData.course_code}
              onChange={(e) => setFormData(prev => ({ ...prev, course_code: e.target.value }))}
              placeholder="e.g. CS101"
              required
            />
          </div>
          <div>
            <Label htmlFor="semester">Semester</Label>
            <Input
              id="semester"
              value={formData.semester}
              onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
              placeholder="e.g. Fall 2024"
            />
          </div>
          <div>
            <Label htmlFor="instructor">Instructor</Label>
            <Input
              id="instructor"
              value={formData.instructor}
              onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
              placeholder="e.g. Dr. Smith"
            />
          </div>
          <div>
            <Label htmlFor="color_theme">Color Theme</Label>
            <Select value={formData.color_theme} onValueChange={(value) => setFormData(prev => ({ ...prev, color_theme: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a color" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Create Class
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// Upload Document Modal Component
function UploadDocumentModal({
  open,
  onOpenChange,
  classes,
  onUpload,
  isLoading
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classes: ClassItem[]
  onUpload: (classId: string, file: File) => void
  isLoading?: boolean
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedClassId && selectedFile) {
      onUpload(selectedClassId, selectedFile)
      setSelectedClassId('')
      setSelectedFile(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Upload Document</SheetTitle>
          <SheetDescription>
            Upload a document to one of your classes for AI-powered assistance.
          </SheetDescription>
        </SheetHeader>
        {classes.length === 0 ? (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You need to create a class first before uploading documents.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="class">Select Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cls.color_theme }}
                        />
                        {cls.name} ({cls.course_code})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file">Document File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                required
              />
              {selectedFile && (
                <p className="text-sm text-slate-600 mt-1">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={!selectedClassId || !selectedFile || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Document'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}