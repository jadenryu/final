"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { ScrollArea } from "../components/ui/scroll-area"
import { Badge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const landingInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Sample classes data - replace with API call
  useEffect(() => {
    setClasses([
      {
        id: "1",
        name: "Introduction to Computer Science",
        course_code: "CS101",
        semester: "Fall 2024",
        instructor: "Dr. Smith",
        color_theme: "#3B82F6",
        document_count: 12,
        last_activity: "2 hours ago"
      },
      {
        id: "2",
        name: "Calculus I",
        course_code: "MATH151",
        semester: "Fall 2024",
        instructor: "Prof. Johnson",
        color_theme: "#10B981",
        document_count: 8,
        last_activity: "1 day ago"
      },
      {
        id: "3",
        name: "Psychology 101",
        course_code: "PSYC101",
        semester: "Fall 2024",
        instructor: "Dr. Williams",
        color_theme: "#8B5CF6",
        document_count: 15,
        last_activity: "3 days ago"
      }
    ])
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
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-sm h-8 px-3 rounded-lg"
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
            <Button variant="outline" className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Create New Class
            </Button>
            <Button variant="outline" className="rounded-xl">
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
            <Button variant="outline" className="rounded-xl">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
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
    </SidebarProvider>
  )
}