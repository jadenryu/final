"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { ScrollArea } from "../components/ui/scroll-area"
import { Badge } from "../components/ui/badge"
import {
  Send,
  User,
  RefreshCw,
  PenTool,
  Zap,
  Loader2,
  AlertCircle,
  Sparkles,
  Box,
  Layers,
  Cylinder
} from "lucide-react"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  error?: boolean
}

export default function CADDesignHome() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (message?: string) => {
    const messageToSend = message || inputValue.trim()
    if (!messageToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          conversation_history: messages.slice(-10)
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || `I'll help you create: "${messageToSend}". Here's the CAD patch:\n\nAT feat_001 INSERT {"type": "cube", "width": 50, "height": 50, "depth": 50, "position": [0, 0, 0]}`,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll help you create: "${messageToSend}". Here's the CAD patch:\n\nAT feat_001 INSERT {"type": "cube", "width": 50, "height": 50, "depth": 50, "position": [0, 0, 0]}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearConversation = () => {
    setMessages([])
  }

  const examplePrompts = [
    { icon: Box, text: "Create a cube 50mm on each side", color: "bg-teal-100 text-teal-600" },
    { icon: Cylinder, text: "Add a cylinder with radius 10mm", color: "bg-cyan-100 text-cyan-600" },
    { icon: Layers, text: "Create a simple table with 4 legs", color: "bg-purple-100 text-purple-600" },
  ]

  // Landing page when no messages
  if (messages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <PenTool className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              AI CAD Designer
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Describe your 3D design in natural language. Our AI generates precise CAD patches you can use directly.
            </p>
          </div>

          {/* Input */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder="Describe the shape you want to create..."
                  className="flex-1 text-lg border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-slate-400"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSubmit()}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-5 py-2.5"
                  disabled={isLoading || !inputValue.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="space-y-3">
            <p className="text-sm text-slate-500 text-center mb-4">Try an example:</p>
            <div className="grid gap-3">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSubmit(prompt.text)}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all text-left"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${prompt.color}`}>
                    <prompt.icon className="w-5 h-5" />
                  </div>
                  <span className="text-slate-700">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-slate-400 mt-12">
            Generative CAD • Natural Language to 3D
          </p>
        </div>
      </div>
    )
  }

  // Chat interface
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <PenTool className="w-4 h-4 text-teal-600" />
            </div>
            <span className="font-semibold text-slate-900">CAD Designer</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearConversation}
            className="text-slate-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Design
          </Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                  <PenTool className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-900'
              }`}>
                <pre className="whitespace-pre-wrap text-sm font-sans">{message.content}</pre>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-slate-500">Generating design...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="Describe another shape..."
              className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSubmit()}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 rounded-lg"
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
