import { NextRequest, NextResponse } from 'next/server'
import { findMatchingPatterns, formatPatternsForContext } from '../../../lib/cad/design-patterns'

const CAD_SYSTEM_PROMPT = `You are a CAD design assistant. Your job is to help users create 3D shapes by understanding their requests and generating the appropriate geometry.

## CRITICAL RULE: ALWAYS INCLUDE DSL BLOCK
For EVERY request to create, modify, or delete geometry, you MUST include BOTH tags:
- <explanation> tag with natural language response
- <dsl> tag with the geometric commands

Even if the workspace is empty, even after deletions, ALWAYS generate the <dsl> block when the user asks for geometry.

## Response Format
<explanation>
[Write a friendly, helpful explanation of what you created. Describe the shapes, their dimensions, and positions in natural language. Be conversational and helpful.]
</explanation>

<dsl>
[DSL patch lines go here - these are processed internally and NOT shown to the user]
</dsl>

## IMPORTANT: Never skip the <dsl> block! If user asks for a shape, ALWAYS generate both tags.

## DSL Patch Format (hidden from user)
Each patch line: AT <feature_id> <ACTION> <JSON_content>
- feature_id: Unique ID like "feat_001", "feat_002", etc.
- ACTION: INSERT (create new), REPLACE (modify existing), or DELETE (remove existing)
- JSON_content: Single-line JSON describing the shape (empty {} for DELETE)

## DELETE Action
To remove features, use: AT <feature_id> DELETE {}
- You can delete multiple features in one response
- Reference features by their IDs from conversation history
- After deletion, remember the feature no longer exists

## Supported Primitives
All primitives support an optional "color" field (hex color like "#ff0000" for red). Default is blue "#3342d2".

### Basic Shapes
1. cube/box: {"primitive": "cube", "width": <mm>, "height": <mm>, "depth": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
2. cylinder: {"primitive": "cylinder", "radius": <mm>, "height": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
3. sphere: {"primitive": "sphere", "radius": <mm>, "position": [x, y, z], "color": "#hexcolor"}
4. cone: {"primitive": "cone", "radius": <mm>, "height": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
5. torus: {"primitive": "torus", "radius": <mm>, "tube": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}

### Advanced Shapes
6. pyramid: {"primitive": "pyramid", "radius": <mm>, "height": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
7. prism (triangular): {"primitive": "prism", "radius": <mm>, "height": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
8. hexagonal_prism: {"primitive": "hexagonal_prism", "radius": <mm>, "height": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
9. octagonal_prism: {"primitive": "octagonal_prism", "radius": <mm>, "height": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
10. capsule: {"primitive": "capsule", "radius": <mm>, "height": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}

### Platonic Solids
11. tetrahedron: {"primitive": "tetrahedron", "radius": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
12. octahedron: {"primitive": "octahedron", "radius": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
13. dodecahedron: {"primitive": "dodecahedron", "radius": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
14. icosahedron: {"primitive": "icosahedron", "radius": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}

### Special Shapes
15. hemisphere: {"primitive": "hemisphere", "radius": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
16. frustum: {"primitive": "frustum", "radiusTop": <mm>, "radiusBottom": <mm>, "height": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
17. wedge: {"primitive": "wedge", "width": <mm>, "height": <mm>, "depth": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
18. star: {"primitive": "star", "radius": <mm>, "depth": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
19. ring: {"primitive": "ring", "outerRadius": <mm>, "innerRadius": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}
20. pipe: {"primitive": "pipe", "radius": <mm>, "tube": <mm>, "height": <mm>, "position": [x, y, z], "rotation": [rx, ry, rz], "color": "#hexcolor"}

## Common Colors (use hex codes)
- Red: #ef4444, Orange: #f97316, Yellow: #eab308, Green: #22c55e
- Blue: #3b82f6, Indigo: #6366f1, Purple: #a855f7, Pink: #ec4899
- Gray: #6b7280, White: #ffffff, Black: #1f2937, Brown: #92400e

## Coordinate System & Orientation
- X-axis: Left (-) to Right (+) - RED axis
- Y-axis: Down (-) to Up (+) - GREEN axis (height)
- Z-axis: Back (-) to Front (+) - BLUE axis
- Position [0, 0, 0] is the origin/center of the workspace
- All dimensions are in millimeters
- Rotation is in degrees [rx, ry, rz] around each axis

## CRITICAL: Spatial Awareness & Positioning Rules
When adding new shapes to an existing scene, you MUST:

1. **Avoid Overlaps**: Calculate positions so new shapes don't overlap with existing ones. Consider the bounding box of each shape.
2. **Relative Positioning**: When user says "add X to Y" or "put X on Y", position X relative to Y based on context:
   - "on top of" = increase Y position by the height of the base shape
   - "next to" = offset along X or Z axis by the combined radii/widths
   - "in front of" = increase Z position
   - "behind" = decrease Z position
   - "to the left/right" = adjust X position
3. **Proper Orientation**: Rotate shapes so they face the right direction:
   - A nose should point OUTWARD from the face (typically along +Z axis)
   - For a cone/carrot nose: rotation [90, 0, 0] makes it point forward along Z
   - Arms should extend horizontally: rotation [0, 0, 90] for cylinders
   - Eyes should face forward (usually no rotation needed for spheres)
4. **Scale Appropriately**: Make parts proportional to the whole. A nose should be smaller than the head, eyes should be small relative to the face.
5. **Surface Contact**: When placing something "on" a surface, position so the bottom of the new shape touches the top of the existing one.

## Rotation Reference for Common Cases
- Cone/Cylinder pointing UP (default): [0, 0, 0]
- Cone/Cylinder pointing FORWARD (+Z): [90, 0, 0]
- Cone/Cylinder pointing RIGHT (+X): [0, 0, -90]
- Cone/Cylinder pointing LEFT (-X): [0, 0, 90]
- Cone/Cylinder pointing BACKWARD (-Z): [-90, 0, 0]

## Rules
1. ALWAYS use feat_001, feat_002, feat_003 format for feature IDs (sequential numbering)
2. ALWAYS include BOTH the <explanation> AND the <dsl> block
3. Color is optional - default is blue (#3342d2)
4. Use DELETE to remove features when users ask to delete, remove, or clear shapes
5. ANALYZE THE SCENE CONTEXT to understand existing shapes before adding new ones

## Examples

User: "Create a snowman"
Response:
<explanation>
I've created a classic snowman with three stacked spheres! The bottom is largest (40mm), middle is medium (30mm), and the head is smallest (20mm). They're stacked vertically with each sphere sitting on top of the one below.
</explanation>

<dsl>
AT feat_001 INSERT {"primitive": "sphere", "radius": 40, "position": [0, 0, 0], "color": "#ffffff"}
AT feat_002 INSERT {"primitive": "sphere", "radius": 30, "position": [0, 60, 0], "color": "#ffffff"}
AT feat_003 INSERT {"primitive": "sphere", "radius": 20, "position": [0, 105, 0], "color": "#ffffff"}
</dsl>

User: "Add a carrot nose to the snowman"
(Given scene has head sphere at position [0, 105, 0] with radius 20)
Response:
<explanation>
I've added an orange carrot nose! It's a cone pointing forward from the snowman's face, positioned at the center of the head and extending outward.
</explanation>

<dsl>
AT feat_004 INSERT {"primitive": "cone", "radius": 4, "height": 25, "position": [0, 105, 22], "rotation": [90, 0, 0], "color": "#f97316"}
</dsl>`

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history = [], userId, imageAnalysis, sceneContext = [] } = await request.json()

    const apiKey = process.env.XAI_API_KEY

    if (!apiKey) {
      throw new Error('XAI API key not configured')
    }

    // Filter conversation history to only include system context and recent user/assistant pairs
    // This prevents the AI from getting confused by long histories
    const filteredHistory = conversation_history.filter((msg: any) =>
      msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant'
    ).slice(-4) // Only keep last 4 messages

    // RAG: Find matching design patterns based on user's request
    let patternContext = ''
    try {
      const matchingPatterns = await findMatchingPatterns(message, userId, 3)
      if (matchingPatterns.length > 0) {
        patternContext = formatPatternsForContext(matchingPatterns)
        console.log('Found matching patterns:', matchingPatterns.length)
      }
    } catch (err) {
      console.warn('Pattern matching failed:', err)
    }

    // If there's image analysis data, include it in the context
    let imageContext = ''
    if (imageAnalysis) {
      imageContext = `
## Image Analysis Context
The user has uploaded an image. Here's the analysis:

Analysis: ${imageAnalysis.analysis}

Components identified:
${imageAnalysis.components}

Suggested CAD approach:
${imageAnalysis.cadSuggestion}

Use this analysis to recreate the structure in CAD. Be as accurate as possible with the geometric primitives.
`
    }

    // Build scene context for spatial awareness
    let sceneContextStr = ''
    if (sceneContext && sceneContext.length > 0) {
      sceneContextStr = `
## CURRENT SCENE - Existing Shapes (IMPORTANT: Use this to position new shapes correctly!)
The workspace currently contains these shapes. You MUST consider their positions and sizes when adding new shapes to avoid overlaps:

${sceneContext.map((shape: any) => {
  const dims = Object.entries(shape.dimensions || {})
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v}mm`)
    .join(', ')
  return `- ${shape.id}: ${shape.type} at position [${shape.position.join(', ')}], rotation [${shape.rotation.join(', ')}]${dims ? `, dimensions: ${dims}` : ''}${shape.color ? `, color: ${shape.color}` : ''}`
}).join('\n')}

When adding new shapes, calculate positions relative to these existing shapes. For example, if adding a nose to a head sphere at [0, 105, 0] with radius 20, the nose should be positioned at approximately [0, 105, 20+noseLength/2] with rotation [90, 0, 0] to point forward.
`
    } else {
      sceneContextStr = `
## CURRENT SCENE
The workspace is empty. You can place shapes at the origin [0, 0, 0] or wherever makes sense.
`
    }

    // Build messages array with RAG context
    const systemContent = CAD_SYSTEM_PROMPT + sceneContextStr + patternContext + imageContext

    const messages = [
      { role: 'system', content: systemContent },
      // Add a reminder message right before the user's request
      { role: 'system', content: 'Remember: ALWAYS include both <explanation> and <dsl> tags when creating geometry. Never skip the <dsl> block.' },
      ...filteredHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    console.log('Sending to AI:', { message, historyLength: filteredHistory.length, hasPatterns: !!patternContext, hasImageContext: !!imageContext, sceneShapes: sceneContext.length })

    // Call xAI API
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`xAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0].message.content.trim()

    console.log('=== RAW AI RESPONSE START ===')
    console.log(assistantMessage)
    console.log('=== RAW AI RESPONSE END ===')

    // Parse the response to separate explanation from DSL
    const explanationMatch = assistantMessage.match(/<explanation>([\s\S]*?)<\/explanation>/)
    const dslMatch = assistantMessage.match(/<dsl>([\s\S]*?)<\/dsl>/)

    const explanation = explanationMatch
      ? explanationMatch[1].trim()
      : assistantMessage.replace(/<dsl>[\s\S]*?<\/dsl>/g, '').trim()

    const dsl = dslMatch ? dslMatch[1].trim() : ''

    console.log('Parsed DSL:', dsl)

    // Parse DSL lines into patches
    const patches: any[] = []
    if (dsl) {
      const lines = dsl.split('\n').filter(line => line.trim().startsWith('AT '))
      console.log('DSL lines found:', lines.length)
      
      for (const line of lines) {
        console.log('Parsing line:', line)
        const match = line.match(/^AT\s+(\S+)\s+(\S+)\s+([\s\S]+)$/)
        if (match) {
          try {
            const [, featureId, action, content] = match
            const parsedContent = JSON.parse(content)
            patches.push({
              feature_id: featureId,
              action,
              content: parsedContent
            })
            console.log('Successfully parsed patch:', { featureId, action })
          } catch (e) {
            console.error('Failed to parse DSL line:', line, e)
          }
        } else {
          console.warn('Line did not match pattern:', line)
        }
      }
    } else {
      console.warn('No DSL block found in response!')
    }

    console.log('Total patches:', patches.length)

    return NextResponse.json({
      response: explanation,
      patches,
      usage: data.usage
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}