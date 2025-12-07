"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

// This page redirects to the CAD editor for the project
export default function ProjectRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  useEffect(() => {
    // Redirect to the CAD editor
    router.replace(`/editor/${projectId}`)
  }, [projectId, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Opening project editor...</p>
      </div>
    </div>
  )
}
