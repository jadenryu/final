"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Target,
  Upload,
  FolderOpen,
  Search,
  Settings
} from "lucide-react"

interface TourStep {
  id: string
  title: string
  content: string
  target: string
  position: "top" | "bottom" | "left" | "right"
  icon?: React.ReactNode
  action?: {
    text: string
    onClick: () => void
  }
}

interface GuidedTourProps {
  tourId: string
  steps: TourStep[]
  onComplete?: () => void
  onSkip?: () => void
}

export function GuidedTour({ tourId, steps, onComplete, onSkip }: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedTours, setCompletedTours] = useState<string[]>([])

  useEffect(() => {
    // Check if tour has been completed
    const completed = JSON.parse(localStorage.getItem('resyft_completed_tours') || '[]')
    setCompletedTours(completed)

    if (!completed.includes(tourId)) {
      // Show tour after a delay
      const timer = setTimeout(() => setIsActive(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [tourId])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    const updated = [...completedTours, tourId]
    localStorage.setItem('resyft_completed_tours', JSON.stringify(updated))
    setCompletedTours(updated)
    setIsActive(false)
    onComplete?.()
  }

  const handleSkip = () => {
    setIsActive(false)
    onSkip?.()
  }

  if (!isActive) return null

  const step = steps[currentStep]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Enhanced Backdrop with better visibility */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />
        
        {/* Tour Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
        >
          <Card className="w-[420px] shadow-2xl border-2 border-blue-300 bg-white/95 backdrop-blur-md">
            <CardContent className="p-0">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {step.icon || <Lightbulb className="w-5 h-5 text-blue-600" />}
                    <h3 className="playfair-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {currentStep + 1}/{steps.length}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={handleSkip}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-gray-700 leading-relaxed mb-4">
                  {step.content}
                </p>

                {step.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={step.action.onClick}
                    className="mb-4 w-full"
                  >
                    {step.action.text}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          index === currentStep ? 'bg-blue-600 scale-110' : 
                          index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <Button size="sm" onClick={handleNext}>
                    {currentStep === steps.length - 1 ? (
                      <>
                        Finish
                        <CheckCircle className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export function HelpTooltip({ 
  content, 
  title, 
  children, 
  position = "top" 
}: {
  content: string
  title?: string
  children: React.ReactNode
  position?: "top" | "bottom" | "left" | "right"
}) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none ${
              position === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-2" :
              position === "bottom" ? "top-full left-1/2 -translate-x-1/2 mt-2" :
              position === "left" ? "right-full top-1/2 -translate-y-1/2 mr-2" :
              "left-full top-1/2 -translate-y-1/2 ml-2"
            }`}
          >
            {title && (
              <div className="playfair-semibold mb-1">{title}</div>
            )}
            <div>{content}</div>
            <div
              className={`absolute w-2 h-2 bg-gray-900 rotate-45 ${
                position === "top" ? "top-full left-1/2 -translate-x-1/2 -mt-1" :
                position === "bottom" ? "bottom-full left-1/2 -translate-x-1/2 -mb-1" :
                position === "left" ? "left-full top-1/2 -translate-y-1/2 -ml-1" :
                "right-full top-1/2 -translate-y-1/2 -mr-1"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Pre-defined tours for different pages
export const DASHBOARD_TOUR: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Resyft!",
    content: "Let's take a quick tour to help you get started with your research analysis platform.",
    target: "",
    position: "top",
    icon: <Target className="w-5 h-5 text-blue-600" />
  },
  {
    id: "quick-actions",
    title: "Quick Actions",
    content: "These cards provide fast access to common tasks like uploading papers, creating projects, and searching the database.",
    target: "",
    position: "top",
    icon: <ArrowRight className="w-5 h-5 text-blue-600" />
  },
  {
    id: "upload-paper",
    title: "Upload Your First Paper",
    content: "Start by uploading a research paper. You can upload PDFs, paste URLs from academic sources, or input text directly.",
    target: "",
    position: "top",
    icon: <Upload className="w-5 h-5 text-blue-600" />,
    action: {
      text: "Upload Paper Now",
      onClick: () => window.location.href = "/upload"
    }
  },
  {
    id: "create-project",
    title: "Organize with Projects",
    content: "Create projects to organize papers around specific research topics or thesis statements. This helps AI provide better, contextual analysis.",
    target: "",
    position: "top",
    icon: <FolderOpen className="w-5 h-5 text-blue-600" />
  },
  {
    id: "settings",
    title: "Customize Analysis",
    content: "Visit Settings to customize how AI analyzes your papers - from quote extraction to summary length and statistical preferences.",
    target: "",
    position: "top",
    icon: <Settings className="w-5 h-5 text-blue-600" />
  }
]

export const UPLOAD_TOUR: TourStep[] = [
  {
    id: "upload-types",
    title: "Three Ways to Add Papers",
    content: "You can upload PDF files, paste URLs from academic sources, or input text directly. Each method provides the same comprehensive analysis.",
    target: "",
    position: "top",
    icon: <Upload className="w-5 h-5 text-blue-600" />
  },
  {
    id: "validation",
    title: "Smart Validation",
    content: "Resyft automatically validates URLs to ensure they're from trusted academic sources like arXiv, PubMed, Nature, and more.",
    target: "",
    position: "top"
  },
  {
    id: "project-suggestion",
    title: "Project Integration",
    content: "Consider creating projects for long-term research. This allows AI to analyze papers in context of your specific research goals.",
    target: "",
    position: "top",
    icon: <FolderOpen className="w-5 h-5 text-blue-600" />
  }
]

export const PROJECT_TOUR: TourStep[] = [
  {
    id: "project-overview",
    title: "Project Management",
    content: "Projects help organize your research around specific topics, thesis statements, or research questions.",
    target: "",
    position: "top",
    icon: <FolderOpen className="w-5 h-5 text-blue-600" />
  },
  {
    id: "thesis-context",
    title: "Research Thesis",
    content: "Define your research thesis or hypothesis. This helps AI analyze papers specifically in context of your research goals.",
    target: "",
    position: "top",
    icon: <Target className="w-5 h-5 text-blue-600" />
  },
  {
    id: "paper-management",
    title: "Source Management",
    content: "View all papers in this project, track analysis progress, and access extracted quotes, statistics, and summaries.",
    target: "",
    position: "top"
  }
]