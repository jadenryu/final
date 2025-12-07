import { NextRequest, NextResponse } from 'next/server'

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001'

export async function GET(request: NextRequest) {
  try {
    // For now, we'll use a hardcoded user ID since we don't have auth yet
    const userId = 'demo-user-123'

    const response = await fetch(`${AI_SERVICE_URL}/classes?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      classes: data.classes || []
    })

  } catch (error) {
    console.error('Classes fetch error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch classes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, course_code, semester, instructor } = await request.json()

    if (!name || !course_code) {
      return NextResponse.json(
        { error: 'Name and course_code are required' },
        { status: 400 }
      )
    }

    // For now, we'll use a hardcoded user ID since we don't have auth yet
    const userId = 'demo-user-123'

    const response = await fetch(`${AI_SERVICE_URL}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        name,
        course_code,
        semester: semester || 'Current',
        instructor: instructor || 'TBD'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `AI service error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      class: {
        id: data.class_id,
        name: data.name,
        course_code: data.course_code,
        semester: data.semester,
        instructor: data.instructor,
        color_theme: getRandomColorTheme(),
        document_count: 0,
        last_activity: 'Just created'
      }
    })

  } catch (error) {
    console.error('Class creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create class',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to assign random color themes
function getRandomColorTheme(): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}