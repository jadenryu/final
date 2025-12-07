import { NextRequest, NextResponse } from 'next/server'

interface PaperAnalysisResult {
  methods: string
  sample_size: number | null
  key_statistics: any
  conclusions: string
  important_quotes: string[]
  reliability_score: number
  relevance_score: number
  suggested_text: string
}

export async function POST(request: NextRequest) {
  try {
    const { paper_url = '', paper_text = '', extraction_type = 'all', custom_prompt } = await request.json()

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    
    // Validate input
    if (!paper_text && !paper_url) {
      return NextResponse.json(
        { error: 'Either paper_text or paper_url must be provided' },
        { status: 400 }
      )
    }

    // For URL analysis, return error for now (can be implemented later)
    if (paper_url && !paper_text) {
      return NextResponse.json({
        error: 'URL analysis not yet implemented. Please paste the paper text directly.',
        suggestion: 'Copy and paste the research paper content into the text field.'
      }, { status: 400 })
    }

    // Validate text length
    if (paper_text && paper_text.length < 100) {
      return NextResponse.json(
        { error: 'Paper text too short. Please provide at least 100 characters of research content.' },
        { status: 400 }
      )
    }

    console.log(`📡 Frontend: Calling backend at ${backendUrl}/api/extract`)
    console.log(`📝 Extraction type: ${extraction_type}, Text length: ${paper_text?.length || 0}`)

    // Call backend extraction service
    const backendResponse = await fetch(`${backendUrl}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paper_url,
        paper_text,
        extraction_type,
        project_id: custom_prompt ? 'custom-prompt' : undefined
      })
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend service unavailable' }))
      throw new Error(`Backend error: ${backendResponse.status} - ${errorData.error || 'Unknown error'}`)
    }

    const jobData = await backendResponse.json()
    
    if (!jobData.jobId) {
      throw new Error('Backend did not return job ID')
    }

    console.log(`🔄 Frontend: Job created with ID: ${jobData.jobId}`)

    // Poll for job completion with timeout
    const maxAttempts = 60 // 2 minutes with 2-second intervals
    let attempts = 0
    let jobResult = null

    while (attempts < maxAttempts && !jobResult) {
      attempts++
      
      // Wait 2 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      try {
        const statusResponse = await fetch(`${backendUrl}/api/extract/status/${jobData.jobId}`)
        
        if (!statusResponse.ok) {
          console.warn(`⚠️ Status check failed: ${statusResponse.status}`)
          continue
        }
        
        const status = await statusResponse.json()
        console.log(`🔍 Job ${jobData.jobId} status: ${status.state}, progress: ${status.progress}%`)
        
        if (status.state === 'completed' && status.result) {
          jobResult = status.result
          break
        } else if (status.state === 'failed') {
          throw new Error(`Job failed: ${status.failedReason || 'Unknown error'}`)
        }
        
      } catch (pollError) {
        console.warn(`⚠️ Polling error on attempt ${attempts}:`, pollError)
        
        // Continue polling unless we're out of attempts
        if (attempts >= maxAttempts) {
          throw new Error(`Job polling failed after ${attempts} attempts`)
        }
      }
    }

    if (!jobResult) {
      throw new Error(`Job did not complete within timeout (${maxAttempts * 2} seconds)`)
    }

    console.log(`✅ Frontend: Analysis completed successfully`)

    // Transform backend result to match frontend expectations
    const result = {
      methods: jobResult.methods || 'No methodology information extracted',
      sample_size: jobResult.sample_size,
      key_statistics: jobResult.key_statistics || jobResult.numerical_data || 'No statistical data extracted',
      conclusions: jobResult.conclusions || 'No conclusions extracted from the paper',
      important_quotes: Array.isArray(jobResult.important_quotes) 
        ? jobResult.important_quotes 
        : ['No quotes extracted from the paper'],
      reliability_score: Math.max(0, Math.min(1, jobResult.reliability_score || 0.7)),
      relevance_score: Math.max(0, Math.min(1, jobResult.relevance_score || 0.8)),
      suggested_text: jobResult.suggested_text || jobResult.conclusions || 'Analysis completed successfully',
      _full_result: {
        suggested_text: jobResult.suggested_text || jobResult.conclusions
      }
    }

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('🚨 Frontend Analysis Error:', error)
    
    // Return meaningful error response
    return NextResponse.json({
      methods: 'Analysis failed due to technical error',
      sample_size: null,
      key_statistics: 'Unable to extract statistics',
      conclusions: 'Analysis could not be completed. Please try again.',
      important_quotes: ['Technical error prevented analysis'],
      reliability_score: 0,
      relevance_score: 0,
      suggested_text: 'Analysis unavailable due to system error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      _full_result: {
        suggested_text: 'Please try again or contact support if the issue persists'
      }
    }, { status: 200 }) // Return 200 to show results even on error
  }
}