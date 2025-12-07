// Comprehensive Relevance and Accuracy Scoring System

interface PaperMetadata {
  title: string
  authors: string[]
  journal?: string
  year?: number
  citations?: number
  doi?: string
  abstract?: string
  keywords?: string[]
  methodology?: string
  sampleSize?: number
  pValue?: number
  impactFactor?: number
}

interface ProjectContext {
  thesis: string
  keywords: string[]
  field: string
  subfield?: string
  researchType: 'exploratory' | 'hypothesis' | 'systematic' | 'meta'
  methodology?: string
}

interface ScoringWeights {
  keywordMatch: number
  citationCount: number
  recency: number
  journalQuality: number
  methodologyAlignment: number
  sampleSize: number
  statisticalSignificance: number
}

export interface RelevanceScore {
  overall: number // 0-100
  breakdown: {
    topicRelevance: number
    methodologicalAlignment: number
    temporalRelevance: number
    citationImpact: number
    journalQuality: number
  }
  confidence: 'high' | 'medium' | 'low'
  explanation: string[]
}

export interface AccuracyScore {
  overall: number // 0-100
  breakdown: {
    statisticalRigor: number
    sampleAdequacy: number
    methodologyQuality: number
    peerReview: number
    replicationPotential: number
  }
  flags: string[]
  recommendations: string[]
}

// Default scoring weights (can be customized per project)
const DEFAULT_WEIGHTS: ScoringWeights = {
  keywordMatch: 30,
  citationCount: 20,
  recency: 15,
  journalQuality: 15,
  methodologyAlignment: 10,
  sampleSize: 5,
  statisticalSignificance: 5
}

// Journal impact factor database (simplified)
const JOURNAL_IMPACT_FACTORS: Record<string, number> = {
  'Nature': 69.5,
  'Science': 63.7,
  'Cell': 66.9,
  'The Lancet': 202.7,
  'New England Journal of Medicine': 176.1,
  'JAMA': 157.3,
  'Nature Medicine': 87.2,
  'Nature Biotechnology': 68.2,
  'Nature Genetics': 41.4,
  'Nature Communications': 17.7,
  'PNAS': 12.8,
  'PLoS ONE': 3.8,
  'Scientific Reports': 4.9,
  'IEEE Transactions': 11.3,
  'ACM Computing Surveys': 14.3,
  'arXiv': 0 // Preprint, not peer-reviewed
}

/**
 * Calculate relevance score for a paper based on project context
 */
export function calculateRelevanceScore(
  paper: PaperMetadata,
  project: ProjectContext,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): RelevanceScore {
  const breakdown = {
    topicRelevance: calculateTopicRelevance(paper, project),
    methodologicalAlignment: calculateMethodologyAlignment(paper, project),
    temporalRelevance: calculateTemporalRelevance(paper),
    citationImpact: calculateCitationImpact(paper),
    journalQuality: calculateJournalQuality(paper)
  }

  // Weighted average calculation
  const weightedScore = 
    (breakdown.topicRelevance * weights.keywordMatch +
     breakdown.citationImpact * weights.citationCount +
     breakdown.temporalRelevance * weights.recency +
     breakdown.journalQuality * weights.journalQuality +
     breakdown.methodologicalAlignment * weights.methodologyAlignment) /
    (weights.keywordMatch + weights.citationCount + weights.recency + 
     weights.journalQuality + weights.methodologyAlignment)

  const overall = Math.round(Math.min(100, Math.max(0, weightedScore)))

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  if (overall >= 80 && breakdown.topicRelevance >= 70) {
    confidence = 'high'
  } else if (overall < 50 || breakdown.topicRelevance < 40) {
    confidence = 'low'
  }

  // Generate explanation
  const explanation = generateRelevanceExplanation(breakdown, paper, project)

  return {
    overall,
    breakdown,
    confidence,
    explanation
  }
}

/**
 * Calculate accuracy/quality score for a paper
 */
export function calculateAccuracyScore(paper: PaperMetadata): AccuracyScore {
  const breakdown = {
    statisticalRigor: calculateStatisticalRigor(paper),
    sampleAdequacy: calculateSampleAdequacy(paper),
    methodologyQuality: calculateMethodologyQuality(paper),
    peerReview: calculatePeerReviewStatus(paper),
    replicationPotential: calculateReplicationPotential(paper)
  }

  const overall = Math.round(
    (breakdown.statisticalRigor * 0.25 +
     breakdown.sampleAdequacy * 0.20 +
     breakdown.methodologyQuality * 0.25 +
     breakdown.peerReview * 0.20 +
     breakdown.replicationPotential * 0.10)
  )

  const flags = generateQualityFlags(paper, breakdown)
  const recommendations = generateQualityRecommendations(breakdown, flags)

  return {
    overall,
    breakdown,
    flags,
    recommendations
  }
}

// Helper functions for relevance scoring

function calculateTopicRelevance(paper: PaperMetadata, project: ProjectContext): number {
  let score = 0
  const paperText = `${paper.title} ${paper.abstract || ''} ${(paper.keywords || []).join(' ')}`.toLowerCase()
  const projectKeywords = [...project.keywords, ...project.thesis.split(' ')].map(k => k.toLowerCase())
  
  // Direct keyword matches
  let matchCount = 0
  projectKeywords.forEach(keyword => {
    if (keyword.length > 3 && paperText.includes(keyword)) {
      matchCount++
    }
  })
  
  score = Math.min(100, (matchCount / Math.max(1, projectKeywords.length)) * 100)
  
  // Boost for field match
  if (paper.keywords?.some(k => k.toLowerCase().includes(project.field.toLowerCase()))) {
    score = Math.min(100, score + 10)
  }
  
  // Boost for subfield match
  if (project.subfield && paper.keywords?.some(k => k.toLowerCase().includes(project.subfield!.toLowerCase()))) {
    score = Math.min(100, score + 15)
  }
  
  return score
}

function calculateMethodologyAlignment(paper: PaperMetadata, project: ProjectContext): number {
  if (!paper.methodology || !project.methodology) {
    return 50 // Neutral score if methodology info is missing
  }
  
  const paperMethod = paper.methodology.toLowerCase()
  const projectMethod = project.methodology.toLowerCase()
  
  // Check for methodology type alignment
  const methodTypes = {
    experimental: ['experiment', 'trial', 'test', 'control group'],
    observational: ['observational', 'survey', 'questionnaire', 'interview'],
    computational: ['simulation', 'model', 'algorithm', 'computational'],
    review: ['review', 'meta-analysis', 'systematic', 'literature'],
    theoretical: ['theoretical', 'framework', 'conceptual', 'hypothesis']
  }
  
  let score = 0
  Object.entries(methodTypes).forEach(([type, keywords]) => {
    const paperHasType = keywords.some(k => paperMethod.includes(k))
    const projectHasType = keywords.some(k => projectMethod.includes(k))
    if (paperHasType && projectHasType) {
      score = 80
    }
  })
  
  // Direct methodology match
  if (paperMethod.includes(projectMethod) || projectMethod.includes(paperMethod)) {
    score = Math.max(score, 90)
  }
  
  return score || 40 // Default low score if no alignment
}

function calculateTemporalRelevance(paper: PaperMetadata): number {
  if (!paper.year) return 50
  
  const currentYear = new Date().getFullYear()
  const age = currentYear - paper.year
  
  if (age <= 2) return 100
  if (age <= 5) return 85
  if (age <= 10) return 70
  if (age <= 15) return 50
  if (age <= 20) return 30
  return 15
}

function calculateCitationImpact(paper: PaperMetadata): number {
  if (!paper.citations) return 30
  
  // Normalize by years since publication
  const currentYear = new Date().getFullYear()
  const age = paper.year ? Math.max(1, currentYear - paper.year) : 5
  const citationsPerYear = paper.citations / age
  
  if (citationsPerYear >= 100) return 100
  if (citationsPerYear >= 50) return 90
  if (citationsPerYear >= 20) return 80
  if (citationsPerYear >= 10) return 70
  if (citationsPerYear >= 5) return 60
  if (citationsPerYear >= 2) return 50
  if (citationsPerYear >= 1) return 40
  return 30
}

function calculateJournalQuality(paper: PaperMetadata): number {
  if (!paper.journal) return 40
  
  // Check if journal is in our impact factor database
  const impactFactor = JOURNAL_IMPACT_FACTORS[paper.journal] || 
    Object.entries(JOURNAL_IMPACT_FACTORS).find(([key]) => 
      paper.journal!.toLowerCase().includes(key.toLowerCase())
    )?.[1] || 0
  
  if (impactFactor >= 50) return 100
  if (impactFactor >= 20) return 90
  if (impactFactor >= 10) return 80
  if (impactFactor >= 5) return 70
  if (impactFactor >= 3) return 60
  if (impactFactor >= 1) return 50
  if (impactFactor > 0) return 40
  
  // Check for preprint servers
  if (paper.journal.toLowerCase().includes('arxiv') || 
      paper.journal.toLowerCase().includes('biorxiv') ||
      paper.journal.toLowerCase().includes('medrxiv')) {
    return 35 // Preprints have value but aren't peer-reviewed
  }
  
  return 30
}

// Helper functions for accuracy scoring

function calculateStatisticalRigor(paper: PaperMetadata): number {
  let score = 50 // Base score
  
  // Check p-value
  if (paper.pValue !== undefined) {
    if (paper.pValue <= 0.001) score += 30
    else if (paper.pValue <= 0.01) score += 25
    else if (paper.pValue <= 0.05) score += 20
    else if (paper.pValue <= 0.1) score += 10
    else score -= 10 // p-value too high
  }
  
  // Check sample size (if applicable)
  if (paper.sampleSize) {
    if (paper.sampleSize >= 1000) score += 20
    else if (paper.sampleSize >= 500) score += 15
    else if (paper.sampleSize >= 100) score += 10
    else if (paper.sampleSize >= 30) score += 5
    else score -= 5 // Sample too small
  }
  
  return Math.min(100, Math.max(0, score))
}

function calculateSampleAdequacy(paper: PaperMetadata): number {
  if (!paper.sampleSize) return 50 // Unknown
  
  // This is simplified - in reality, adequate sample size depends on the study type
  if (paper.sampleSize >= 10000) return 100
  if (paper.sampleSize >= 1000) return 85
  if (paper.sampleSize >= 300) return 70
  if (paper.sampleSize >= 100) return 60
  if (paper.sampleSize >= 50) return 50
  if (paper.sampleSize >= 30) return 40
  return 25
}

function calculateMethodologyQuality(paper: PaperMetadata): number {
  if (!paper.methodology) return 40
  
  const methodology = paper.methodology.toLowerCase()
  let score = 50
  
  // Check for quality indicators
  const qualityIndicators = [
    { term: 'randomized', points: 15 },
    { term: 'controlled', points: 15 },
    { term: 'double-blind', points: 20 },
    { term: 'placebo', points: 10 },
    { term: 'validated', points: 10 },
    { term: 'replicated', points: 15 },
    { term: 'peer-reviewed', points: 10 },
    { term: 'systematic', points: 10 },
    { term: 'meta-analysis', points: 15 }
  ]
  
  qualityIndicators.forEach(({ term, points }) => {
    if (methodology.includes(term)) {
      score += points
    }
  })
  
  return Math.min(100, score)
}

function calculatePeerReviewStatus(paper: PaperMetadata): number {
  if (!paper.journal) return 30
  
  const journal = paper.journal.toLowerCase()
  
  // Check if it's a preprint
  if (journal.includes('arxiv') || journal.includes('biorxiv') || 
      journal.includes('medrxiv') || journal.includes('preprint')) {
    return 25 // Not peer-reviewed
  }
  
  // Check if it's a known high-quality journal
  if (JOURNAL_IMPACT_FACTORS[paper.journal] && JOURNAL_IMPACT_FACTORS[paper.journal] > 5) {
    return 100 // High-quality peer review
  }
  
  // Default assumption for published papers
  return 70
}

function calculateReplicationPotential(paper: PaperMetadata): number {
  let score = 50
  
  // Factors that improve replication potential
  if (paper.methodology) {
    const methodology = paper.methodology.toLowerCase()
    if (methodology.includes('open data')) score += 25
    if (methodology.includes('open source')) score += 20
    if (methodology.includes('reproducible')) score += 20
    if (methodology.includes('protocol')) score += 15
    if (methodology.includes('supplementary')) score += 10
  }
  
  // DOI presence indicates better accessibility
  if (paper.doi) score += 10
  
  return Math.min(100, score)
}

// Explanation generators

function generateRelevanceExplanation(
  breakdown: RelevanceScore['breakdown'],
  paper: PaperMetadata,
  project: ProjectContext
): string[] {
  const explanations: string[] = []
  
  if (breakdown.topicRelevance >= 80) {
    explanations.push('Strong keyword and topic alignment with your research')
  } else if (breakdown.topicRelevance >= 60) {
    explanations.push('Moderate topic relevance to your research question')
  } else if (breakdown.topicRelevance < 40) {
    explanations.push('Limited keyword overlap with your research focus')
  }
  
  if (breakdown.citationImpact >= 80) {
    explanations.push('Highly cited paper with significant impact in the field')
  } else if (breakdown.citationImpact < 40) {
    explanations.push('Limited citations, may be new or niche research')
  }
  
  if (breakdown.temporalRelevance >= 85) {
    explanations.push('Recent publication ensures current relevance')
  } else if (breakdown.temporalRelevance < 50) {
    explanations.push('Older publication, findings may need verification against recent research')
  }
  
  if (breakdown.journalQuality >= 80) {
    explanations.push('Published in high-impact, peer-reviewed journal')
  } else if (breakdown.journalQuality < 40) {
    explanations.push('Publication venue has limited peer review or impact')
  }
  
  if (breakdown.methodologicalAlignment >= 70) {
    explanations.push('Methodology aligns well with your research approach')
  }
  
  return explanations
}

function generateQualityFlags(paper: PaperMetadata, breakdown: AccuracyScore['breakdown']): string[] {
  const flags: string[] = []
  
  if (breakdown.statisticalRigor < 50) {
    flags.push('⚠️ Limited statistical validation')
  }
  
  if (breakdown.sampleAdequacy < 40) {
    flags.push('⚠️ Small sample size may limit generalizability')
  }
  
  if (breakdown.peerReview < 50) {
    flags.push('ℹ️ Not peer-reviewed or preprint status')
  }
  
  if (paper.pValue && paper.pValue > 0.05) {
    flags.push('⚠️ Results not statistically significant (p > 0.05)')
  }
  
  if (!paper.methodology) {
    flags.push('ℹ️ Methodology details not available')
  }
  
  if (paper.year && new Date().getFullYear() - paper.year > 10) {
    flags.push('ℹ️ Study is over 10 years old')
  }
  
  return flags
}

function generateQualityRecommendations(
  breakdown: AccuracyScore['breakdown'],
  flags: string[]
): string[] {
  const recommendations: string[] = []
  
  if (breakdown.statisticalRigor < 60) {
    recommendations.push('Consider supplementing with studies having stronger statistical validation')
  }
  
  if (breakdown.sampleAdequacy < 50) {
    recommendations.push('Look for larger-scale studies or meta-analyses on this topic')
  }
  
  if (breakdown.peerReview < 50) {
    recommendations.push('Verify findings with peer-reviewed sources before citing')
  }
  
  if (breakdown.replicationPotential < 40) {
    recommendations.push('Check for replication studies or additional validation')
  }
  
  if (flags.length > 2) {
    recommendations.push('Exercise caution when interpreting results from this paper')
  }
  
  return recommendations
}

// Aggregate scoring for multiple papers
export function calculateProjectRelevance(
  papers: PaperMetadata[],
  project: ProjectContext,
  weights?: ScoringWeights
): {
  averageRelevance: number
  distribution: { high: number; medium: number; low: number }
  topPapers: Array<{ paper: PaperMetadata; score: number }>
} {
  const scores = papers.map(paper => ({
    paper,
    score: calculateRelevanceScore(paper, project, weights).overall
  }))
  
  const averageRelevance = scores.reduce((sum, s) => sum + s.score, 0) / scores.length
  
  const distribution = {
    high: scores.filter(s => s.score >= 70).length,
    medium: scores.filter(s => s.score >= 40 && s.score < 70).length,
    low: scores.filter(s => s.score < 40).length
  }
  
  const topPapers = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  
  return {
    averageRelevance: Math.round(averageRelevance),
    distribution,
    topPapers
  }
}

// Visual scoring indicator component helper
export function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981' // green-500
  if (score >= 60) return '#3b82f6' // blue-500
  if (score >= 40) return '#f59e0b' // amber-500
  return '#ef4444' // red-500
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}

export function getConfidenceIcon(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high': return '🟢'
    case 'medium': return '🟡'
    case 'low': return '🔴'
  }
}