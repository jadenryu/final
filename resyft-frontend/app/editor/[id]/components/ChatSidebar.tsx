"use client"

import { RefObject } from "react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { ScrollArea } from "../../../../components/ui/scroll-area"
import { Send, Loader2, MessageSquare } from "lucide-react"

interface ChatMessage {
  role: string
  content: string
}

interface ChatSidebarProps {
  isOpen: boolean
  messages: ChatMessage[]
  chatInput: string
  setChatInput: (value: string) => void
  sendMessage: () => void
  isGenerating: boolean
  chatEndRef: RefObject<HTMLDivElement>
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          message.role === 'user'
            ? 'bg-teal-600 text-white'
            : 'bg-slate-100 text-slate-900'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  )
}

export function ChatSidebar({
  isOpen,
  messages,
  chatInput,
  setChatInput,
  sendMessage,
  isGenerating,
  chatEndRef,
}: ChatSidebarProps) {
  return (
    <aside
      className="bg-white border-l border-slate-200 flex flex-col overflow-hidden flex-shrink-0"
      style={{
        width: isOpen ? '320px' : '0px',
        minWidth: isOpen ? '320px' : '0px',
        transition: 'width 200ms ease-out, min-width 200ms ease-out'
      }}
    >
      <div 
        className="w-80 flex flex-col h-full" 
        style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 150ms ease-out' }}
      >
        <div className="p-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            AI Assistant
          </h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Describe what you want to create</p>
                <p className="text-xs mt-2 text-slate-500">
                  Example: "Create a cube 50mm wide, 30mm tall"
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <ChatMessageBubble key={idx} message={msg} />
            ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span className="text-sm text-slate-500">Generating...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Describe a shape..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={isGenerating}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!chatInput.trim() || isGenerating}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
