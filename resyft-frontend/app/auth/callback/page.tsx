'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(
          new URLSearchParams(window.location.search).get('code') || ''
        )
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login?error=auth_failed')
        } else {
          // Redirect to projects page after successful auth
          router.push('/projects')
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        router.push('/login?error=unexpected')
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 inter-regular">Confirming your account...</p>
      </div>
    </div>
  )
}