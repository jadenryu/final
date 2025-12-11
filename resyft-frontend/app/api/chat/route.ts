import { NextRequest, NextResponse } from 'next/server'
import { findMatchingPatterns, formatPatternsForContext } from '../../../lib/cad/design-patterns'
import { CAD_SYSTEM_PROMPT } from './prompt'
export const runtime = 'nodejs'

// Load prompt file safely
// Load the CAD system prompt from a local file at startup (static content)
// Place prompt.txt in app/api/chat/prompt.txt or move it to /public/prompt.txt and adjust the path accordingly.



export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversation_history = [], userId, imageAnalysis, sceneContext = [] } = body

    const apiKey = process.env.XAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured', details: 'XAI_API_KEY environment variable is not set' },
        { status: 500 }
      )
    }

    // Filter conversation history to only include system context and recent user/assistant pairs
    const filteredHistory = conversation_history.filter((msg: any) =>
      msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant'
    ).slice(-4)

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

    // List of known primitive shapes the system can render natively
    const knownPrimitives = [
      'cube', 'box', 'cylinder', 'sphere', 'cone', 'torus',
      'pyramid', 'prism', 'triangular_prism', 'hexagonal_prism', 'octagonal_prism',
      'pentagonal_prism', 'custom_prism', 'capsule', 'ring', 'pipe', 'tube',
      'dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron',
      'frustum', 'hemisphere', 'wedge', 'star',
      // Common names/aliases
      'hexagon', 'octagon', 'pentagon', 'triangle', 'circle', 'rectangle', 'square'
    ]

    // Check if the user's message mentions any shape-related terms not in our known list
    // This helps determine if we should force web search for unknown geometry
    const messageLower = message.toLowerCase()
    const containsKnownPrimitive = knownPrimitives.some(p => messageLower.includes(p))

    // Force web search if user is asking about shapes/geometry but we don't recognize the specific type
    // or if they're asking questions that need real-world knowledge
    const geometryTerms = ['prism', 'polygon', 'shape', 'geometry', 'solid', 'polyhedron', 'create', 'make', 'build', 'design']
    const questionTerms = ['what is', 'how to', 'how do', 'can you', 'what does', 'explain', 'describe']
    const realWorldTerms = ['realistic', 'real world', 'actual', 'accurate', 'proper', 'correct']

    const isAskingAboutGeometry = geometryTerms.some(t => messageLower.includes(t))
    const isAskingQuestion = questionTerms.some(t => messageLower.includes(t))
    const wantsRealWorld = realWorldTerms.some(t => messageLower.includes(t))

    // Force search ON if: asking about geometry but no known primitive, asking questions, or wants real-world accuracy
    // Otherwise use AUTO mode so AI can decide when it needs to search
    const forceWebSearch = (isAskingAboutGeometry && !containsKnownPrimitive) || isAskingQuestion || wantsRealWorld

    // Call xAI API with Live Search enabled
    // Mode "auto" lets the AI decide when to search (default for known shapes)
    // Mode "on" forces search for unknown shapes or questions
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        // Enable Live Search - always available, AI decides when needed
        search_parameters: {
          mode: forceWebSearch ? 'on' : 'auto',
          max_search_results: 15,
          return_citations: true
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('xAI API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'AI API error', details: `${response.status}: ${errorText.substring(0, 200)}` },
        { status: 502 }
      )
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