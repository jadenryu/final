export interface User {
  id: string
  email: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  research_argument: string
  extraction_preferences: {
    favor_statistical: boolean
    favor_qualitative: boolean
  }
  created_at: string
  updated_at: string
}

export interface Paper {
  id: string
  project_id?: string
  user_id?: string
  title: string
  authors?: string[]
  url?: string
  pdf_url?: string
  processed_at?: string
  created_at: string
}

export interface ExtractedData {
  id: string
  paper_id: string
  methods?: string
  sample_size?: number
  key_statistics?: Record<string, any>
  conclusions?: string
  important_quotes?: string[]
  numerical_data?: Record<string, number>
  reliability_score?: number
  relevance_score?: number
  support_score?: number
  raw_data?: any
  created_at: string
}

export interface ExtractionRequest {
  paper_url?: string
  paper_text?: string
  extraction_type: 'numerical' | 'quotes' | 'details' | 'all'
  project_id?: string
  settings?: ExtractionSettings
}

export interface ExtractionSettings {
  quotes: {
    enabled: boolean
    maxPerPaper: number
    minLength: number
    maxLength: number
    priority: 'relevance' | 'novelty' | 'statistical'
  }
  statistics: {
    enabled: boolean
    includeConfidenceIntervals: boolean
    includePValues: boolean
    includeEffectSizes: boolean
    minSampleSize: number
  }
  summaries: {
    length: 'brief' | 'moderate' | 'detailed'
    focusAreas: string[]
    includeMethodology: boolean
    includeLimitations: boolean
    includeImplications: boolean
  }
  relevanceScoring: {
    keywordWeight: number
    citationWeight: number
    recencyWeight: number
    methodologyWeight: number
    customKeywords: string[]
  }
  outputFormat: {
    citationStyle: 'apa' | 'mla' | 'chicago' | 'harvard'
    includePageNumbers: boolean
    includeDOI: boolean
    groupByTheme: boolean
  }
}