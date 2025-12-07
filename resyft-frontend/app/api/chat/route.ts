import { NextRequest, NextResponse } from 'next/server'

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
All primitives support an optional "color" field (hex color like "#ff0000" for red). Default is teal "#14b8a6".

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
- Red: #ef4444, Orange: #f97316, Yellow: #eab308, Green: #22c55e, Teal: #14b8a6
- Blue: #3b82f6, Indigo: #6366f1, Purple: #a855f7, Pink: #ec4899
- Gray: #6b7280, White: #ffffff, Black: #1f2937, Brown: #92400e

## Rules
1. Position [0, 0, 0] is the origin/center of the workspace
2. All dimensions are in millimeters
3. Rotation is in degrees [rx, ry, rz]
4. ALWAYS use feat_001, feat_002, feat_003 format for feature IDs (ignore any feature IDs in conversation history)
5. ALWAYS include BOTH the <explanation> AND the <dsl> block
6. Color is optional - default is teal (#14b8a6)
7. Use DELETE to remove features when users ask to delete, remove, or clear shapes

## Examples

User: "Create a box that is 50mm wide, 30mm tall"

Response:
<explanation>
I've created a box for you! It's 50mm wide, 30mm tall, and 50mm deep, positioned at the center of the workspace.
</explanation>

<dsl>
AT feat_001 INSERT {"primitive": "cube", "width": 50, "height": 30, "depth": 50, "position": [0, 0, 0], "rotation": [0, 0, 0]}
</dsl>

User: "Delete the box"

Response:
<explanation>
I've removed the box from the workspace. The area is now clear!
</explanation>

<dsl>
AT feat_001 DELETE {}
</dsl>

User: "Create another cube"

Response:
<explanation>
I've created a new cube for you! It's 50mm on each side and positioned at the center.
</explanation>

<dsl>
AT feat_001 INSERT {"primitive": "cube", "width": 50, "height": 50, "depth": 50, "position": [0, 0, 0], "rotation": [0, 0, 0]}
</dsl>`

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history = [] } = await request.json()

    const apiKey = process.env.XAI_API_KEY

    if (!apiKey) {
      throw new Error('XAI API key not configured')
    }

    // Filter conversation history to only include system context and recent user/assistant pairs
    // This prevents the AI from getting confused by long histories
    const filteredHistory = conversation_history.filter((msg: any) => 
      msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant'
    ).slice(-4) // Only keep last 4 messages

    // Build messages array
    const messages = [
      { role: 'system', content: CAD_SYSTEM_PROMPT },
      // Add a reminder message right before the user's request
      { role: 'system', content: 'Remember: ALWAYS include both <explanation> and <dsl> tags when creating geometry. Never skip the <dsl> block.' },
      ...filteredHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    console.log('Sending to AI:', { message, historyLength: filteredHistory.length })

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