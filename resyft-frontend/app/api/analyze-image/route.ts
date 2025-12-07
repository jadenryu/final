import { NextRequest, NextResponse } from 'next/server'

const IMAGE_ANALYSIS_PROMPT = `You are a CAD geometry analyzer specialized in converting images to 3D CAD models. Analyze this image and identify ALL geometric shapes that can be recreated using 3D CAD primitives.

## Available CAD Primitives
- cube/box: {"primitive": "cube", "width": mm, "height": mm, "depth": mm}
- cylinder: {"primitive": "cylinder", "radius": mm, "height": mm}
- sphere: {"primitive": "sphere", "radius": mm}
- cone: {"primitive": "cone", "radius": mm, "height": mm}
- torus: {"primitive": "torus", "radius": mm, "tube": mm}
- pyramid: {"primitive": "pyramid", "radius": mm, "height": mm}
- prism: {"primitive": "prism", "radius": mm, "height": mm} (triangular)
- hexagonal_prism: {"primitive": "hexagonal_prism", "radius": mm, "height": mm}
- pentagonal_prism: {"primitive": "pentagonal_prism", "radius": mm, "height": mm}
- capsule: {"primitive": "capsule", "radius": mm, "height": mm}
- hemisphere: {"primitive": "hemisphere", "radius": mm}
- frustum: {"primitive": "frustum", "radiusTop": mm, "radiusBottom": mm, "height": mm}
- wedge: {"primitive": "wedge", "width": mm, "height": mm, "depth": mm}
- star: {"primitive": "star", "radius": mm, "depth": mm}

## COORDINATE SYSTEM
- X-axis: Left (-) to Right (+)
- Y-axis: Down (-) to Up (+) - THIS IS THE VERTICAL AXIS
- Z-axis: Back (-) to Front (+)
- Origin [0, 0, 0] is at the center of the workspace
- All dimensions in millimeters

## CRITICAL: POSITIONING & ORIENTATION RULES

### Avoiding Overlaps
1. CALCULATE exact positions so shapes DO NOT overlap
2. For shapes stacked vertically: position Y = (bottom shape Y) + (bottom shape height/2) + (current shape height/2)
3. For shapes side by side: offset X or Z by the sum of their half-widths/radii
4. Account for the shape's CENTER being at its position (not corner)

### Position Calculations
- Cube/Box center is at its geometric center. A 20mm tall box at Y=10 spans from Y=0 to Y=20
- Cylinder center is at mid-height. A 30mm tall cylinder at Y=15 spans from Y=0 to Y=30
- Sphere center is at its center. A 10mm radius sphere at Y=10 spans from Y=0 to Y=20
- Cone base is at Y - height/2, tip is at Y + height/2

### Rotation Reference (in degrees)
- Cylinder/Cone pointing UP (default): rotation [0, 0, 0]
- Cylinder/Cone pointing FORWARD (+Z): rotation [90, 0, 0]
- Cylinder/Cone pointing RIGHT (+X): rotation [0, 0, -90]
- Cylinder/Cone pointing LEFT (-X): rotation [0, 0, 90]
- Cylinder/Cone pointing BACKWARD (-Z): rotation [-90, 0, 0]

### Surface Contact
When placing a shape ON TOP of another:
- New shape Y = base_shape_Y + (base_height/2) + (new_height/2)

Example: Sphere (radius 10) on top of cube (height 20, at Y=10):
- Cube top surface is at Y = 10 + 10 = 20
- Sphere center should be at Y = 20 + 10 = 30

## REQUIRED OUTPUT FORMAT
You MUST respond with ONLY a valid JSON object:

{
  "description": "Brief description of what you see",
  "shapes": [
    {
      "primitive": "cube",
      "width": 50,
      "height": 20,
      "depth": 50,
      "position": [0, 10, 0],
      "rotation": [0, 0, 0],
      "color": "#3342d2"
    },
    {
      "primitive": "sphere",
      "radius": 15,
      "position": [0, 35, 0],
      "rotation": [0, 0, 0],
      "color": "#ef4444"
    }
  ],
  "total_shapes": 2,
  "confidence": "high"
}

## CRITICAL RULES
1. Output ONLY the JSON object - no markdown, no code blocks, no extra text
2. CALCULATE positions mathematically to prevent overlaps
3. First shape typically starts at Y = height/2 (so bottom touches Y=0)
4. Each subsequent stacked shape: Y = previous_top + current_height/2
5. Rotate shapes to match their orientation in the image
6. Use hex color codes matching the image colors
7. Scale everything proportionally (assume ~100mm total height if unknown)`

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

    console.log('Analyzing image with xAI Vision API...')

    // Call xAI Vision API with latest model
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-vision-latest',
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
        max_tokens: 3000
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

    console.log('Vision API raw response:', analysisText)

    // Parse the JSON response
    let parsedResult
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) ||
                        analysisText.match(/```\s*([\s\S]*?)\s*```/)

      const jsonStr = jsonMatch ? jsonMatch[1].trim() : analysisText
      parsedResult = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse vision response as JSON:', parseError)
      // Return error with raw response for debugging
      return NextResponse.json({
        success: false,
        error: 'Failed to parse image analysis',
        rawResponse: analysisText,
        usage: data.usage
      })
    }

    // Convert shapes to CAD patches format
    const patches = (parsedResult.shapes || []).map((shape: any, index: number) => ({
      feature_id: `feat_${String(index + 1).padStart(3, '0')}`,
      action: 'INSERT',
      content: {
        primitive: shape.primitive,
        ...shape,
        position: shape.position || [0, 0, 0],
        rotation: shape.rotation || [0, 0, 0],
        color: shape.color || '#3342d2'
      }
    }))

    return NextResponse.json({
      success: true,
      description: parsedResult.description || 'Image analyzed',
      shapes: parsedResult.shapes || [],
      patches: patches,
      totalShapes: parsedResult.total_shapes || patches.length,
      confidence: parsedResult.confidence || 'medium',
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
