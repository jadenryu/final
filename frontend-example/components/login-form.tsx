'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { createClient } from '../lib/supabase'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/projects')
    }
    setLoading(false)
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSignIn} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl playfair-bold">Welcome Back</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Sign in to continue analyzing research papers
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input 
            id="password" 
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </div>
      
      {message && (
        <div className="mt-4 p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
          {message}
        </div>
      )}
      
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="underline underline-offset-4 text-blue-600 hover:text-blue-700">
          Sign up
        </a>
      </div>
    </form>
  )
}
