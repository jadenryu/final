"use client"

import { useRouter, usePathname } from 'next/navigation'
import { Button } from './ui/button'
import { ArrowLeft, Home } from 'lucide-react'

export function BackNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  // Define navigation hierarchy
  const getBackRoute = (currentPath: string) => {
    const segments = currentPath.split('/').filter(Boolean)
    
    // Special cases
    if (currentPath === '/projects/new') return '/projects'
    if (currentPath.startsWith('/projects/') && segments.length === 3) return '/projects' // Individual project pages
    if (currentPath === '/support') return '/overview'
    if (currentPath === '/settings') return '/overview'
    if (currentPath === '/upload') return '/overview'
    if (currentPath === '/quick-analysis') return '/overview'
    if (currentPath === '/search') return '/overview'
    
    // Default: go to parent or overview
    if (segments.length > 1) {
      return `/${segments.slice(0, -1).join('/')}`
    }
    
    return '/overview'
  }

  // Don't show back button on main pages
  const hideOnPages = ['/', '/overview', '/login', '/signup', '/onboarding']
  if (hideOnPages.includes(pathname)) {
    return null
  }

  const backRoute = getBackRoute(pathname)
  const isRootLevel = pathname === '/projects' || pathname === '/dashboard'

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(backRoute)}
        className="text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      
      {!isRootLevel && (
        <>
          <div className="w-px h-4 bg-gray-300" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/overview')}
            className="text-gray-500 hover:text-gray-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Overview
          </Button>
        </>
      )}
    </div>
  )
}