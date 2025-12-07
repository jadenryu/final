"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import {
  Play,
  ArrowRight,
  ArrowLeft,
  X,
  Lightbulb,
  FileText,
  Search,
  Settings,
  CheckCircle,
  Users,
  Calendar,
  Hash
} from 'lucide-react'

interface TutorialStep {
  id: string
  title: string
  description: string
  element?: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  content?: React.ReactNode
  action?: () => void
  highlight?: string[]
}

interface ProjectTutorialProps {
  onComplete: () => void
  onSkip: () => void
}

export function ProjectTutorial({ onComplete, onSkip }: ProjectTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [demoProject, setDemoProject] = useState<any>(null)

  const createDemoProject = () => {
    return {
      id: "demo-1",
      name: "My First Research Project",
      description: "Understanding the impact of AI on academic research workflows",
      thesis: "AI tools significantly improve research efficiency and accuracy when used appropriately",
      field: "Computer Science",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      collaborators: ["demo.user@university.edu"],
      tags: ["AI", "research", "efficiency"],
      createdAt: new Date().toISOString(),
      papers: Array(3).fill(null),
      status: "active" as const
    }
  }

  const tutorialSteps: TutorialStep[] = [
    {
      id: "welcome",
      title: "Welcome to Resyft! 👋",
      description: "Let's take a quick tour of how projects work. This interactive guide will show you all the key features in under 2 minutes.",
      position: "center",
      content: (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg playfair-semibold">Ready to explore?</h3>
            <p className="text-sm text-gray-600">We'll create a demo project and show you around</p>
          </div>
        </div>
      )
    },
    {
      id: "create-project",
      title: "Creating Your First Project",
      description: "Every research journey starts with a project. Let's create a demo project to show you how it works.",
      position: "center",
      element: "#tutorial-new-project",
      highlight: ["#tutorial-new-project"],
      action: () => {
        setDemoProject(createDemoProject())
      }
    },
    {
      id: "project-overview",
      title: "Project Overview",
      description: "Here's your project! Each project card shows key information like status, paper count, and deadlines.",
      position: "top",
      element: "#tutorial-project-card",
      highlight: ["#tutorial-project-card"]
    },
    {
      id: "project-details",
      title: "Project Details",
      description: "Projects contain your thesis statement, research field, collaborators, and tags to help organize your work.",
      position: "right",
      element: "#tutorial-project-details",
      highlight: ["#tutorial-project-details"]
    },
    {
      id: "project-actions",
      title: "Project Actions",
      description: "Use this menu to edit, archive, or delete projects. You can also add collaborators and manage settings.",
      position: "left", 
      element: "#tutorial-project-menu",
      highlight: ["#tutorial-project-menu"]
    },
    {
      id: "search-filter",
      title: "Search & Filter",
      description: "As you create more projects, use the search bar and filters to quickly find what you need.",
      position: "bottom",
      element: "#tutorial-search",
      highlight: ["#tutorial-search", "#tutorial-filters"]
    },
    {
      id: "view-modes",
      title: "View Modes",
      description: "Switch between grid and list views based on your preference. Both show the same information in different layouts.",
      position: "bottom",
      element: "#tutorial-view-modes",
      highlight: ["#tutorial-view-modes"]
    },
    {
      id: "complete",
      title: "You're All Set! 🎉",
      description: "Now you know the basics of managing projects in Resyft. Ready to create your real first project?",
      position: "center",
      content: (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg playfair-semibold">Tutorial Complete!</h3>
            <p className="text-sm text-gray-600">The demo project will be removed and you can start fresh</p>
          </div>
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      const step = tutorialSteps[currentStep]
      if (step.action) {
        step.action()
      }
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
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
    }, 300)
  }

  const handleSkip = () => {
    setIsVisible(false)
    setTimeout(() => {
      onSkip()
    }, 300)
  }

  const currentStepData = tutorialSteps[currentStep]

  // Highlight effect for targeted elements
  useEffect(() => {
    if (currentStepData.highlight) {
      currentStepData.highlight.forEach(selector => {
        const element = document.querySelector(selector)
        if (element) {
          element.classList.add('tutorial-highlight')
        }
      })
    }

    return () => {
      // Clean up highlights
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight')
      })
    }
  }, [currentStep, currentStepData])

  if (!isVisible) return null

  return (
    <>
      {/* Tutorial Overlay */}
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Card className="w-full max-w-lg shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    <span className="text-sm merriweather-regular text-blue-600">
                      Step {currentStep + 1} of {tutorialSteps.length}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {currentStepData.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {currentStepData.content && (
                  <div className="mb-6">
                    {currentStepData.content}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {tutorialSteps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <Button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Demo Project Display */}
      {demoProject && currentStep >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 z-40 w-80"
        >
          <Card id="tutorial-project-card" className="tutorial-card shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1" id="tutorial-project-details">
                  <CardTitle className="text-base">{demoProject.name}</CardTitle>
                  <Badge className="mt-2 bg-green-100 text-green-700">
                    {demoProject.status}
                  </Badge>
                </div>
                <div id="tutorial-project-menu">
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-2">
                {demoProject.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{demoProject.papers.length} papers</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Due {new Date(demoProject.deadline).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{demoProject.collaborators.length} collaborators</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {demoProject.tags.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Hash className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tutorial Styles */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .tutorial-card {
          border: 2px solid rgb(59, 130, 246);
          background: white;
        }
      `}</style>
    </>
  )
}