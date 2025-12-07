"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { MessageCircle, Star } from 'lucide-react'

interface SectionNavTab {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

const sectionTabs: SectionNavTab[] = [
  {
    id: 'faq',
    label: 'FAQ',
    href: '#faq-section',
    icon: MessageCircle
  },
  {
    id: 'reviews',
    label: 'Reviews',
    href: '#reviews-section', 
    icon: Star
  }
]

export function SectionNav() {
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const scrollToSection = (href: string, tabId: string) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      })
      setActiveTab(tabId)
      
      // Clear active state after animation
      setTimeout(() => setActiveTab(null), 2000)
    }
  }

  return (
    <div className="fixed top-20 right-6 z-40 flex flex-col gap-2">
      {sectionTabs.map((tab, index) => (
        <motion.div
          key={tab.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Button
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => scrollToSection(tab.href, tab.id)}
            className={`
              flex items-center gap-2 shadow-lg backdrop-blur-sm
              ${activeTab === tab.id 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white/90 text-gray-700 border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
          </Button>
        </motion.div>
      ))}
    </div>
  )
}