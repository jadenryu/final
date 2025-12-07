import { NextRequest, NextResponse } from 'next/server'

const CAD_SYSTEM_PROMPT = `You are a CAD design assistant. Your job is to translate natural language descriptions into CAD DSL patches.

## Patch Format
Each patch line follows this exact format:
AT <feature_id> <ACTION> <JSON_content>

- feature_id: A unique identifier (use format like "feat_001", "feat_002", etc.)
- ACTION: One of INSERT, REPLACE, or DELETE
- JSON_content: A single-line JSON object describing the primitive or feature

## Supported Primitives

1. **cube**
   {"type": "cube", "width": <float>, "height": <float>, "depth": <float>, "position": [x, y, z], "rotation": [rx, ry, rz]}

2. **cylinder**
   {"type": "cylinder", "radius": <float>, "height": <float>, "position": [x, y, z], "rotation": [rx, ry, rz]}

3. **sphere**
   {"type": "sphere", "radius": <float>, "position": [x, y, z]}

4. **cone**
   {"type": "cone", "radius": <float>, "height": <float>, "position": [x, y, z], "rotation": [rx, ry, rz]}

5. **torus**
   {"type": "torus", "radius": <float>, "tube": <float>, "position": [x, y, z], "rotation": [rx, ry, rz]}

## Supported Features (modifiers)

1. **fillet** - Round edges
   {"type": "fillet", "target": "<feature_id>", "radius": <float>}

2. **chamfer** - Bevel edges
   {"type": "chamfer", "target": "<feature_id>", "distance": <float>}

## Rules
1. Always output ONLY the patch lines, no explanations unless asked
2. Use metric units (millimeters) for all dimensions
3. Position [0, 0, 0] is the origin/center
4. Rotation is in degrees [rx, ry, rz]
5. Generate sequential feature IDs: feat_001, feat_002, etc.
6. For multiple shapes, output multiple patch lines

## Examples

User: "Create a box that is 10mm wide, 20mm tall, and 15mm deep"
Output:
AT feat_001 INSERT {"type": "cube", "width": 10, "height": 20, "depth": 15, "position": [0, 0, 0], "rotation": [0, 0, 0]}

User: "Create a simple table with 4 legs"
Output:
AT feat_001 INSERT {"type": "cube", "width": 100, "height": 5, "depth": 60, "position": [0, 50, 0], "rotation": [0, 0, 0]}
AT feat_002 INSERT {"type": "cylinder", "radius": 3, "height": 50, "position": [-45, 25, -25], "rotation": [0, 0, 0]}
AT feat_003 INSERT {"type": "cylinder", "radius": 3, "height": 50, "position": [45, 25, -25], "rotation": [0, 0, 0]}
AT feat_004 INSERT {"type": "cylinder", "radius": 3, "height": 50, "position": [-45, 25, 25], "rotation": [0, 0, 0]}
AT feat_005 INSERT {"type": "cylinder", "radius": 3, "height": 50, "position": [45, 25, 25], "rotation": [0, 0, 0]}`

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_history = [] } = await request.json()

    const apiKey = process.env.XAI_API_KEY

    if (!apiKey) {
      throw new Error('XAI API key not configured')
    }

    // Build messages array
    const messages = [
      { role: 'system', content: CAD_SYSTEM_PROMPT },
      ...conversation_history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

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
    const assistantMessage = data.choices[0].message

    return NextResponse.json({
      response: assistantMessage.content.trim(),
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
