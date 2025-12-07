"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "../lib/utils"
import {
  Home,
  Search,
  Upload,
  FolderOpen,
  Settings,
  User,
  Zap,
  BarChart3,
  Plus,
  X
} from "lucide-react"

interface NavTab {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  closable?: boolean
}

const defaultTabs: NavTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="w-4 h-4" />,
    closable: false
  }
]

const availablePages = [
  { href: "/search", label: "Search", icon: <Search className="w-4 h-4" /> },
  { href: "/upload", label: "Upload", icon: <Upload className="w-4 h-4" /> },
  { href: "/projects", label: "Projects", icon: <FolderOpen className="w-4 h-4" /> },
  { href: "/quick-analysis", label: "Quick Analysis", icon: <Zap className="w-4 h-4" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  { href: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> }
]

export function NavTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const [tabs, setTabs] = useState<NavTab[]>(defaultTabs)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showAddMenu, setShowAddMenu] = useState(false)

  useEffect(() => {
    // Load saved tabs from localStorage
    const savedTabs = localStorage.getItem("resyft_nav_tabs")
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs)
        // Reconstruct tabs with icons from availablePages
        const reconstructedTabs = parsed.map((savedTab: any) => {
          const page = availablePages.find(p => p.href === savedTab.href)
          return {
            ...savedTab,
            icon: page?.icon || <Home className="w-4 h-4" />
          }
        })
        setTabs(reconstructedTabs)
      } catch {
        setTabs(defaultTabs)
      }
    }

    // Set active tab based on current pathname
    const currentTab = tabs.find(tab => pathname.startsWith(tab.href))
    if (currentTab) {
      setActiveTab(currentTab.id)
    } else {
      // Auto-add current page as tab if not in tabs
      const page = availablePages.find(p => pathname.startsWith(p.href))
      if (page && !tabs.find(t => t.href === page.href)) {
        addTab(page.href, page.label, page.icon)
      }
    }
  }, [pathname])

  useEffect(() => {
    // Save tabs to localStorage whenever they change (only serialize non-cyclic data)
    const serializableTabs = tabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      href: tab.href,
      closable: tab.closable
    }))
    localStorage.setItem("resyft_nav_tabs", JSON.stringify(serializableTabs))
  }, [tabs])

  const addTab = (href: string, label: string, icon: React.ReactNode) => {
    const newTab: NavTab = {
      id: `tab-${Date.now()}`,
      label,
      href,
      icon,
      closable: true
    }
    
    setTabs(prev => [...prev, newTab])
    setActiveTab(newTab.id)
    router.push(href)
    setShowAddMenu(false)
  }

  const removeTab = (tabId: string) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId)
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)
    
    // If removing active tab, switch to adjacent tab
    if (activeTab === tabId && newTabs.length > 0) {
      const newActiveTab = newTabs[Math.max(0, tabIndex - 1)]
      setActiveTab(newActiveTab.id)
      router.push(newActiveTab.href)
    }
  }

  const switchTab = (tab: NavTab) => {
    setActiveTab(tab.id)
    router.push(tab.href)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center h-12 px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 mr-8">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs playfair-bold">R</span>
          </div>
          <span className="playfair-semibold text-sm">Resyft</span>
        </div>

        {/* Tabs */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative group"
            >
              <button
                onClick={() => switchTab(tab)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                  "hover:bg-muted/50",
                  activeTab === tab.id 
                    ? "bg-muted text-foreground merriweather-regular" 
                    : "text-muted-foreground"
                )}
              >
                {tab.icon}
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.closable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeTab(tab.id)
                    }}
                    className="ml-1 opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </button>
              
              {/* Active indicator */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.div>
          ))}

          {/* Add Tab Button */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md transition-all",
                "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                showAddMenu && "bg-muted"
              )}
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Add Tab Menu */}
            {showAddMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-2 w-48 bg-popover border rounded-md shadow-lg py-1 z-50"
              >
                {availablePages
                  .filter(page => !tabs.find(t => t.href === page.href))
                  .map(page => (
                    <button
                      key={page.href}
                      onClick={() => addTab(page.href, page.label, page.icon)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                    >
                      {page.icon}
                      <span>{page.label}</span>
                    </button>
                  ))}
                {availablePages.filter(page => !tabs.find(t => t.href === page.href)).length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    All pages are open
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-4">
          <button className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Minimal tab style for smaller screens
export function MobileNavTabs() {
  const pathname = usePathname()
  const router = useRouter()

  const mainTabs = [
    { href: "/dashboard", label: "Home", icon: <Home className="w-5 h-5" /> },
    { href: "/search", label: "Search", icon: <Search className="w-5 h-5" /> },
    { href: "/upload", label: "Upload", icon: <Upload className="w-5 h-5" /> },
    { href: "/projects", label: "Projects", icon: <FolderOpen className="w-5 h-5" /> },
    { href: "/profile", label: "Profile", icon: <User className="w-5 h-5" /> }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {mainTabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 flex-1",
                "transition-all",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              <span className="text-xs">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeMobileTab"
                  className="absolute top-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}