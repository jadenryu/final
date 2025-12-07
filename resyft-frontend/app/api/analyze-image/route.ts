import { NextRequest, NextResponse } from 'next/server'

const IMAGE_ANALYSIS_PROMPT = `You are a CAD design analyst. Analyze this image and identify all geometric shapes, structures, and components visible.

## Your Task
1. Identify all distinct 3D shapes in the image (cubes, cylinders, spheres, cones, etc.)
2. Estimate their relative dimensions and positions
3. Describe the overall structure and how components relate to each other
4. Note any details like windows, doors, decorative elements, or functional parts

## Output Format
Provide your analysis in this exact format:

<analysis>
[Describe what you see in the image, the overall structure, and its purpose]
</analysis>

<components>
[List each identifiable component with estimated dimensions]
- Component 1: [shape type], approximately [dimensions], located at [position description]
- Component 2: [shape type], approximately [dimensions], located at [position description]
...
</components>

<cad_suggestion>
[Provide a natural language description of how to recreate this in CAD, suitable for passing to a CAD AI assistant]
</cad_suggestion>

Be as detailed as possible in identifying geometric primitives. For complex shapes, break them down into simpler components (cubes, cylinders, spheres, cones, pyramids, etc.).`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const imageUrl = formData.get('imageUrl') as string | null

    const apiKey = process.env.XAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'XAI API key not configured' },
        { status: 500 }
      )
    }

    let imageContent: any

    if (file) {
      // Handle uploaded file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')

      // Determine MIME type
      const mimeType = file.type || 'image/jpeg'

      imageContent = {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64}`,
          detail: 'high'
        }
      }
    } else if (imageUrl) {
      // Handle URL-based image
      imageContent = {
        type: 'image_url',
        image_url: {
          url: imageUrl,
          detail: 'high'
        }
      }
    } else {
      return NextResponse.json(
        { error: 'No image provided. Send either an image file or imageUrl.' },
        { status: 400 }
      )
    }

    // Call xAI Vision API
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-vision-1212',
        messages: [
          {
            role: 'user',
            content: [
              imageContent,
              {
                type: 'text',
                text: IMAGE_ANALYSIS_PROMPT
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('xAI Vision API error:', errorText)
      return NextResponse.json(
        { error: `Vision API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    const analysisText = data.choices[0].message.content.trim()

    // Parse the analysis
    const analysisMatch = analysisText.match(/<analysis>([\s\S]*?)<\/analysis>/)
    const componentsMatch = analysisText.match(/<components>([\s\S]*?)<\/components>/)
    const suggestionMatch = analysisText.match(/<cad_suggestion>([\s\S]*?)<\/cad_suggestion>/)

    const analysis = analysisMatch ? analysisMatch[1].trim() : ''
    const components = componentsMatch ? componentsMatch[1].trim() : ''
    const cadSuggestion = suggestionMatch ? suggestionMatch[1].trim() : ''

    return NextResponse.json({
      success: true,
      analysis,
      components,
      cadSuggestion,
      rawResponse: analysisText,
      usage: data.usage
    })

  } catch (error) {
    console.error('Image analysis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
