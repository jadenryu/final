// Utility functions for managing extraction settings

// Define the ExtractionSettings type locally
export interface ExtractionSettings {
  quotes: {
    enabled: boolean
    maxPerPaper: number
    minLength: number
    maxLength: number
    priority: string
  }
  statistics: {
    enabled: boolean
    includeConfidenceIntervals: boolean
    includePValues: boolean
    includeEffectSizes: boolean
    minSampleSize: number
  }
  summaries: {
    length: string
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
    citationStyle: string
    includePageNumbers: boolean
    includeDOI: boolean
    groupByTheme: boolean
  }
}

export function getExtractionSettings(): ExtractionSettings {
  if (typeof window === 'undefined') {
    return getDefaultExtractionSettings()
  }

  const savedSettings = localStorage.getItem('resyft_extraction_settings')
  if (savedSettings) {
    try {
      return JSON.parse(savedSettings)
    } catch (error) {
      console.error('Error parsing saved extraction settings:', error)
      return getDefaultExtractionSettings()
    }
  }
  
  return getDefaultExtractionSettings()
}

export function getDefaultExtractionSettings(): ExtractionSettings {
  return {
    quotes: {
      enabled: true,
      maxPerPaper: 5,
      minLength: 50,
      maxLength: 300,
      priority: 'relevance'
    },
    statistics: {
      enabled: true,
      includeConfidenceIntervals: true,
      includePValues: true,
      includeEffectSizes: false,
      minSampleSize: 30
    },
    summaries: {
      length: 'moderate',
      focusAreas: ['methodology', 'results', 'conclusions'],
      includeMethodology: true,
      includeLimitations: true,
      includeImplications: true
    },
    relevanceScoring: {
      keywordWeight: 40,
      citationWeight: 25,
      recencyWeight: 20,
      methodologyWeight: 15,
      customKeywords: []
    },
    outputFormat: {
      citationStyle: 'apa',
      includePageNumbers: true,
      includeDOI: true,
      groupByTheme: false
    }
  }
}

export function saveExtractionSettings(settings: ExtractionSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('resyft_extraction_settings', JSON.stringify(settings))
  }
}