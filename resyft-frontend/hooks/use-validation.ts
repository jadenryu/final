import { useState, useEffect, useCallback } from 'react'
import { validateAcademicURL, validateAcademicText, sanitizeInput } from '../lib/validators'

interface ValidationState {
  isValidating: boolean
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function useRealtimeValidation(
  value: string,
  type: 'url' | 'text',
  options?: {
    debounceMs?: number
    validateOnMount?: boolean
    minLengthBeforeValidation?: number
  }
) {
  const [validation, setValidation] = useState<ValidationState>({
    isValidating: false,
    isValid: true,
    errors: [],
    warnings: []
  })

  const debounceMs = options?.debounceMs || 500
  const minLength = options?.minLengthBeforeValidation || (type === 'url' ? 10 : 50)

  const validate = useCallback(async (input: string) => {
    if (!input || input.length < minLength) {
      setValidation({
        isValidating: false,
        isValid: true,
        errors: [],
        warnings: []
      })
      return
    }

    setValidation(prev => ({ ...prev, isValidating: true }))

    try {
      let result
      if (type === 'url') {
        result = await validateAcademicURL(input)
      } else {
        const sanitized = sanitizeInput(input)
        result = validateAcademicText(sanitized, {
          checkLanguage: true,
          checkQuality: false // Don't check quality in real-time as it's expensive
        })
      }

      setValidation({
        isValidating: false,
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings || []
      })
    } catch (error) {
      setValidation({
        isValidating: false,
        isValid: false,
        errors: ['Validation failed. Please try again.'],
        warnings: []
      })
    }
  }, [type, minLength])

  useEffect(() => {
    if (!value && !options?.validateOnMount) {
      setValidation({
        isValidating: false,
        isValid: true,
        errors: [],
        warnings: []
      })
      return
    }

    const timer = setTimeout(() => {
      validate(value)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [value, debounceMs, validate, options?.validateOnMount])

  return validation
}

// Hook for URL accessibility checking
export function useURLAccessibility(url: string, enabled: boolean = false) {
  const [isChecking, setIsChecking] = useState(false)
  const [isAccessible, setIsAccessible] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !url) {
      setIsAccessible(null)
      setError(null)
      return
    }

    const checkAccessibility = async () => {
      setIsChecking(true)
      setError(null)

      try {
        // For now, we'll just validate the URL format
        // In production, you'd make an API call to check accessibility
        const urlObj = new URL(url)
        setIsAccessible(true)
      } catch (err) {
        setIsAccessible(false)
        setError('URL is not accessible or incorrectly formatted')
      } finally {
        setIsChecking(false)
      }
    }

    const timer = setTimeout(checkAccessibility, 1000)
    return () => clearTimeout(timer)
  }, [url, enabled])

  return { isChecking, isAccessible, error }
}