// Design Patterns RAG System
// Stores and retrieves common design patterns the user has created

import { createClient } from '../supabase'
import type { Feature } from './store'

export interface DesignPattern {
  id: string
  user_id: string
  name: string
  description: string
  features: Feature[]
  tags: string[]
  usage_count: number
  created_at: string
  updated_at: string
}

export interface PatternMatch {
  pattern: DesignPattern
  similarity: number
  reason: string
}

// In-memory cache for design patterns (supplements database)
let patternCache: DesignPattern[] = []
let cacheUserId: string | null = null

// Common design pattern templates (built-in patterns)
export const BUILT_IN_PATTERNS: Omit<DesignPattern, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Simple Table',
    description: 'A basic table with a flat top and four cylindrical legs',
    features: [],
    tags: ['furniture', 'table', 'legs', 'common'],
    usage_count: 0,
  },
  {
    name: 'Box with Lid',
    description: 'A rectangular container with a removable lid',
    features: [],
    tags: ['container', 'box', 'storage', 'lid'],
    usage_count: 0,
  },
  {
    name: 'Simple House',
    description: 'A basic house structure with walls and a roof',
    features: [],
    tags: ['building', 'house', 'architecture', 'walls', 'roof'],
    usage_count: 0,
  },
  {
    name: 'Wheel Assembly',
    description: 'A wheel with hub and axle mount',
    features: [],
    tags: ['mechanical', 'wheel', 'automotive', 'round'],
    usage_count: 0,
  },
  {
    name: 'L-Bracket',
    description: 'An L-shaped mounting bracket',
    features: [],
    tags: ['hardware', 'bracket', 'mounting', 'structural'],
    usage_count: 0,
  },
]

// Extract keywords from user prompt for pattern matching
export function extractKeywords(prompt: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your',
    'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
    'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'create',
    'make', 'build', 'generate', 'add', 'please', 'want', 'like', 'mm', 'cm'
  ])

  return prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
}

// Calculate similarity between keywords and pattern tags/description
export function calculateSimilarity(keywords: string[], pattern: DesignPattern): number {
  const patternText = `${pattern.name} ${pattern.description} ${pattern.tags.join(' ')}`.toLowerCase()

  let matchCount = 0
  for (const keyword of keywords) {
    if (patternText.includes(keyword)) {
      matchCount++
    }
  }

  return keywords.length > 0 ? matchCount / keywords.length : 0
}

// Find matching patterns based on user prompt
export async function findMatchingPatterns(
  prompt: string,
  userId?: string,
  limit: number = 3
): Promise<PatternMatch[]> {
  const keywords = extractKeywords(prompt)

  if (keywords.length === 0) {
    return []
  }

  // Get user patterns from cache or database
  const userPatterns = userId ? await getUserPatterns(userId) : []

  // Combine with built-in patterns
  const allPatterns: DesignPattern[] = [
    ...userPatterns,
    ...BUILT_IN_PATTERNS.map((p, i) => ({
      ...p,
      id: `builtin_${i}`,
      user_id: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
  ]

  // Calculate similarity for each pattern
  const matches: PatternMatch[] = allPatterns
    .map(pattern => ({
      pattern,
      similarity: calculateSimilarity(keywords, pattern),
      reason: `Matched keywords: ${keywords.filter(k =>
        `${pattern.name} ${pattern.description} ${pattern.tags.join(' ')}`.toLowerCase().includes(k)
      ).join(', ')}`
    }))
    .filter(m => m.similarity > 0.2) // Minimum 20% match
    .sort((a, b) => {
      // Prioritize user patterns, then by similarity and usage
      if (a.pattern.user_id !== 'system' && b.pattern.user_id === 'system') return -1
      if (a.pattern.user_id === 'system' && b.pattern.user_id !== 'system') return 1
      if (b.similarity !== a.similarity) return b.similarity - a.similarity
      return b.pattern.usage_count - a.pattern.usage_count
    })
    .slice(0, limit)

  return matches
}

// Get user's saved patterns
export async function getUserPatterns(userId: string): Promise<DesignPattern[]> {
  // Return from cache if same user
  if (cacheUserId === userId && patternCache.length > 0) {
    return patternCache
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('design_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false })

    if (error) {
      console.warn('Failed to fetch user patterns:', error)
      return []
    }

    patternCache = data || []
    cacheUserId = userId
    return patternCache
  } catch (error) {
    console.warn('Error fetching patterns:', error)
    return []
  }
}

// Save a new design pattern
export async function saveDesignPattern(
  userId: string,
  name: string,
  description: string,
  features: Feature[],
  tags: string[]
): Promise<DesignPattern | null> {
  try {
    const supabase = createClient()

    const pattern: Omit<DesignPattern, 'id'> = {
      user_id: userId,
      name,
      description,
      features,
      tags,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('design_patterns')
      .insert(pattern)
      .select()
      .single()

    if (error) {
      console.error('Failed to save pattern:', error)
      return null
    }

    // Update cache
    if (cacheUserId === userId) {
      patternCache.push(data)
    }

    return data
  } catch (error) {
    console.error('Error saving pattern:', error)
    return null
  }
}

// Increment usage count for a pattern
export async function incrementPatternUsage(patternId: string): Promise<void> {
  if (patternId.startsWith('builtin_')) return

  try {
    const supabase = createClient()

    await supabase
      .from('design_patterns')
      .update({
        usage_count: patternCache.find(p => p.id === patternId)?.usage_count ?? 0 + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', patternId)

    // Update cache
    const cached = patternCache.find(p => p.id === patternId)
    if (cached) {
      cached.usage_count++
    }
  } catch (error) {
    console.warn('Failed to increment pattern usage:', error)
  }
}

// Format patterns for inclusion in AI context
export function formatPatternsForContext(matches: PatternMatch[]): string {
  if (matches.length === 0) return ''

  return `
## Relevant Design Patterns from User History

The following patterns may be relevant to the user's request. Consider using similar structures or referencing these when appropriate:

${matches.map((m, i) => `
### Pattern ${i + 1}: ${m.pattern.name}
- Description: ${m.pattern.description}
- Tags: ${m.pattern.tags.join(', ')}
- Used ${m.pattern.usage_count} times
${m.pattern.features.length > 0 ? `- Contains ${m.pattern.features.length} features` : ''}
`).join('\n')}

Use these patterns as reference when generating geometry, but adapt dimensions and positions based on the user's specific request.
`
}

// Clear the pattern cache
export function clearPatternCache(): void {
  patternCache = []
  cacheUserId = null
}
