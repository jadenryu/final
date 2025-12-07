import { NextResponse } from 'next/server'
import { xai } from '@ai-sdk/xai'
import { generateObject } from 'ai'
import { z } from 'zod'

// Define the schema for slicer settings using Zod
const SlicerSettingsSchema = z.object({
  layerHeight: z.number().min(0.05).max(0.5).describe('Layer height in mm (0.1 for fine detail, 0.2 for standard, 0.3 for fast)'),
  infillDensity: z.number().int().min(0).max(100).describe('Infill density as percentage (15-20% for decorative, 40%+ for functional)'),
  infillPattern: z.enum(['grid', 'triangles', 'hexagons']).describe('Infill pattern type'),
  supportEnabled: z.boolean().describe('Whether supports are needed (true if overhangs > 45 degrees)'),
  adhesionType: z.enum(['none', 'skirt', 'brim', 'raft']).describe('Bed adhesion type'),
  printSpeed: z.number().int().min(20).max(150).describe('Print speed in mm/s'),
  wallThickness: z.number().int().min(1).max(10).describe('Number of wall perimeters'),
  topLayers: z.number().int().min(1).max(20).describe('Number of top solid layers'),
  bottomLayers: z.number().int().min(1).max(20).describe('Number of bottom solid layers'),
  travelSpeed: z.number().int().min(50).max(300).describe('Travel speed in mm/s'),
  retractionEnabled: z.boolean().describe('Whether retraction is enabled'),
  retractionDistance: z.number().min(0).max(15).describe('Retraction distance in mm'),
  retractionSpeed: z.number().int().min(10).max(100).describe('Retraction speed in mm/s'),
  reasoning: z.string().describe('Brief explanation of why these settings were chosen based on the model geometry'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { features, settings, action } = body

    // Action: 'suggest' = get AI-recommended settings, 'slice' = generate G-code
    if (action === 'suggest') {
      return await suggestSettings(features)
    } else if (action === 'slice') {
      return await generateGCode(features, settings)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Slicer error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// Use Grok with structured outputs for type-safe slicer settings
async function suggestSettings(features: any[]) {
  const XAI_API_KEY = process.env.XAI_API_KEY

  if (!XAI_API_KEY) {
    // Return default suggestions without AI
    return NextResponse.json({
      success: true,
      suggestions: getDefaultSettings('AI unavailable - using defaults')
    })
  }

  // Build detailed model description
  const modelDescription = features.map(f => {
    const content = f.patch?.content
    if (!content) return null
    const type = content.primitive || content.type || 'shape'
    const dims = []
    if (content.width) dims.push(`width: ${content.width}mm`)
    if (content.height) dims.push(`height: ${content.height}mm`)
    if (content.depth) dims.push(`depth: ${content.depth}mm`)
    if (content.radius) dims.push(`radius: ${content.radius}mm`)
    if (content.tube) dims.push(`tube: ${content.tube}mm`)
    if (content.radiusTop) dims.push(`radiusTop: ${content.radiusTop}mm`)
    if (content.radiusBottom) dims.push(`radiusBottom: ${content.radiusBottom}mm`)
    const pos = content.position || [0, 0, 0]
    const rot = content.rotation || [0, 0, 0]
    return `- ${type}: ${dims.join(', ')} at position (${pos.join(', ')}) rotation (${rot.join(', ')}°)`
  }).filter(Boolean).join('\n')

  // Calculate bounding box for context
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  let hasOverhangs = false
  let isThin = false

  for (const f of features) {
    const content = f.patch?.content
    if (!content) continue

    const pos = content.position || [0, 0, 0]
    const w = content.width || (content.radius || 5) * 2
    const h = content.height || (content.radius || 5) * 2
    const d = content.depth || (content.radius || 5) * 2

    minX = Math.min(minX, pos[0] - w / 2)
    maxX = Math.max(maxX, pos[0] + w / 2)
    minY = Math.min(minY, pos[1])
    maxY = Math.max(maxY, pos[1] + h)
    minZ = Math.min(minZ, pos[2] - d / 2)
    maxZ = Math.max(maxZ, pos[2] + d / 2)

    // Check for potential overhangs (spheres, cones, etc.)
    if (['sphere', 'cone', 'torus', 'hemisphere'].includes(content.primitive || content.type)) {
      hasOverhangs = true
    }

    // Check if thin (height much greater than width/depth)
    if (h > w * 3 || h > d * 3) {
      isThin = true
    }
  }

  const totalHeight = maxY - minY
  const totalWidth = maxX - minX
  const totalDepth = maxZ - minZ

  try {
    // Use structured output with xai SDK
    const result = await generateObject({
      model: xai('grok-beta') as any,
      schema: SlicerSettingsSchema,
      system: `You are an expert 3D printing consultant. Analyze the CAD model geometry and suggest optimal FDM 3D printing settings.

Consider these factors:
- Layer height: 0.1mm for fine detail, 0.2mm standard, 0.3mm for speed
- Infill: 15-20% for decorative, 40%+ for functional/mechanical parts
- Supports: needed for overhangs > 45 degrees (spheres, cones, bridges)
- Adhesion: brim for tall/thin parts, raft for poor bed adhesion, skirt normally
- Speed: 30-50mm/s for detail, 60-80mm/s for fast prints
- Walls: 2-3 for normal, 4+ for strength
- Retraction: enable to prevent stringing, 5mm at 45mm/s typical`,
      prompt: `Analyze this 3D model and suggest optimal print settings:

Model contains ${features.length} shape(s):
${modelDescription || 'No shapes defined'}

Bounding box: ${totalWidth.toFixed(1)}mm x ${totalHeight.toFixed(1)}mm x ${totalDepth.toFixed(1)}mm
${hasOverhangs ? 'Model likely has overhangs that may need supports.' : ''}
${isThin ? 'Model has tall thin features that may need adhesion help.' : ''}

Suggest settings optimized for successful printing of this specific geometry.`,
    })

    return NextResponse.json({
      success: true,
      suggestions: result.object
    })

  } catch (error) {
    console.error('AI suggestion error:', error)
    // Return defaults on error
    return NextResponse.json({
      success: true,
      suggestions: getDefaultSettings('AI error - using defaults')
    })
  }
}

// Default settings helper
function getDefaultSettings(reason: string) {
  return {
    layerHeight: 0.2,
    infillDensity: 20,
    infillPattern: 'grid' as const,
    supportEnabled: false,
    adhesionType: 'skirt' as const,
    printSpeed: 50,
    wallThickness: 2,
    topLayers: 4,
    bottomLayers: 4,
    travelSpeed: 150,
    retractionEnabled: true,
    retractionDistance: 5,
    retractionSpeed: 45,
    reasoning: reason
  }
}

// Generate G-code using polyslice
async function generateGCode(features: any[], settings: any) {
  // Calculate bounding box from features
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  for (const f of features) {
    const content = f.patch?.content
    if (!content) continue

    const pos = content.position || [0, 0, 0]
    const w = content.width || content.radius * 2 || 10
    const h = content.height || content.radius * 2 || 10
    const d = content.depth || content.radius * 2 || 10

    minX = Math.min(minX, pos[0] - w / 2)
    maxX = Math.max(maxX, pos[0] + w / 2)
    minY = Math.min(minY, pos[1] - h / 2)
    maxY = Math.max(maxY, pos[1] + h / 2)
    minZ = Math.min(minZ, pos[2] - d / 2)
    maxZ = Math.max(maxZ, pos[2] + d / 2)
  }

  const boundingBox = {
    width: maxX - minX,
    height: maxY - minY,
    depth: maxZ - minZ
  }

  // Return slicing config for client-side processing
  return NextResponse.json({
    success: true,
    sliceConfig: {
      settings,
      boundingBox,
      featureCount: features.length,
      readyToSlice: true
    }
  })
}
