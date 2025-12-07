// Dynamic AI Model Configuration for Document Processing
// This module creates different structured output models based on user settings

import type { ExtractionSettings } from './extraction-settings'

// Base interfaces for different extraction types
export interface QuoteExtractionOutput {
  quotes: {
    text: string
    context: string
    relevance_score: number
    page_number?: number
    section: string
    priority_type: 'relevance' | 'novelty' | 'statistical'
  }[]
  total_found: number
  extraction_confidence: number
}

export interface StatisticalOutput {
  statistics: {
    value: string | number
    type: 'p_value' | 'confidence_interval' | 'effect_size' | 'sample_size' | 'correlation' | 'other'
    context: string
    confidence: number
    page_number?: number
  }[]
  sample_size?: number
  statistical_power?: number
  methodology_assessment: string
}

export interface SummaryOutput {
  summary: string
  key_findings: string[]
  methodology?: string
  limitations?: string
  implications?: string
  word_count: number
  focus_areas: string[]
}

export interface RelevanceOutput {
  relevance_score: number
  breakdown: {
    keyword_match: number
    citation_impact: number
    recency_score: number
    methodology_quality: number
  }
  matching_keywords: string[]
  explanation: string[]
}

export interface FormattedOutput {
  citations: {
    full_citation: string
    in_text_citation: string
    doi?: string
    page_numbers?: string[]
  }[]
  grouped_content?: {
    theme: string
    items: any[]
  }[]
  bibliography: string[]
}

// Dynamic model configuration based on user settings
export class ExtractionModelFactory {
  static createQuoteExtractionPrompt(settings: ExtractionSettings['quotes']): string {
    if (!settings.enabled) {
      return "Do not extract any quotes from this document."
    }

    let prompt = `Extract meaningful quotes from this document with the following requirements:
- Maximum ${settings.maxPerPaper} quotes per paper
- Quote length between ${settings.minLength} and ${settings.maxLength} characters
- Priority: ${settings.priority === 'relevance' ? 'Most relevant to the main topic' :
              settings.priority === 'novelty' ? 'Novel insights and key findings' :
              'Statistical findings and numerical results'}

For each quote, provide:
- The exact text (within character limits)
- Context explaining why this quote is significant
- Relevance score (0-100)
- Page number if available
- Section where it appears
- Priority type classification

Return only high-quality quotes that add substantial value to document understanding.`

    return prompt
  }

  static createStatisticsExtractionPrompt(settings: ExtractionSettings['statistics']): string {
    if (!settings.enabled) {
      return "Do not extract statistical data from this document."
    }

    let prompt = `Extract statistical information from this document with these specifications:
- Only include studies with sample size >= ${settings.minSampleSize}
${settings.includeConfidenceIntervals ? '- Include confidence intervals when available' : '- Do not extract confidence intervals'}
${settings.includePValues ? '- Include p-values and significance tests' : '- Do not extract p-values'}
${settings.includeEffectSizes ? '- Include effect sizes and practical significance' : '- Do not extract effect sizes'}

For each statistic, provide:
- The numerical value or range
- Type classification (p_value, confidence_interval, effect_size, sample_size, etc.)
- Context explaining what this statistic represents
- Confidence level in the extraction accuracy (0-100)
- Page number if available

Focus on the most meaningful statistical findings that support the document's conclusions.`

    return prompt
  }

  static createSummaryPrompt(settings: ExtractionSettings['summaries']): string {
    const lengthMap = {
      'brief': '50-100 words',
      'moderate': '150-300 words', 
      'detailed': '400-600 words'
    }

    let prompt = `Create a ${lengthMap[settings.length]} summary of this document.

Include the following elements:
${settings.includeMethodology ? '- Methodology and research approach' : ''}
${settings.includeLimitations ? '- Study limitations and potential biases' : ''}
${settings.includeImplications ? '- Practical implications and applications' : ''}

Focus areas: ${settings.focusAreas.join(', ')}

The summary should be:
- Concise and well-structured
- Focused on key findings and main points
- Written for general audiences
- Highlighting the most important insights

Provide the summary along with:
- Key findings as bullet points
- Word count verification
- List of focus areas covered`

    return prompt
  }

  static createRelevancePrompt(settings: ExtractionSettings['relevanceScoring']): string {
    const totalWeight = settings.keywordWeight + settings.citationWeight + 
                       settings.recencyWeight + settings.methodologyWeight

    // Normalize weights to percentages
    const keywordPct = (settings.keywordWeight / totalWeight) * 100
    const citationPct = (settings.citationWeight / totalWeight) * 100 
    const recencyPct = (settings.recencyWeight / totalWeight) * 100
    const methodologyPct = (settings.methodologyWeight / totalWeight) * 100

    let prompt = `Assess the relevance of this document using these weighted criteria:

- Keyword matching (${keywordPct.toFixed(1)}% weight): How well does the document match specified keywords
- Citation impact (${citationPct.toFixed(1)}% weight): Citation count and influence in the field
- Publication recency (${recencyPct.toFixed(1)}% weight): How recent and current the document is
- Content quality (${methodologyPct.toFixed(1)}% weight): Rigor and quality of content structure

${settings.customKeywords.length > 0 ? 
  `Custom priority keywords: ${settings.customKeywords.join(', ')}
   Give additional weight to documents containing these specific terms.` : ''}

Provide:
- Overall relevance score (0-100)
- Breakdown scores for each criterion
- List of matching keywords found
- Detailed explanation of scoring rationale

The assessment should help users prioritize documents for their analysis.`

    return prompt
  }

  static createOutputFormatPrompt(settings: ExtractionSettings['outputFormat']): string {
    let prompt = `Format all extracted content according to these specifications:

Citation Style: ${settings.citationStyle.toUpperCase()}
${settings.includePageNumbers ? '- Include page numbers in citations' : '- Omit page numbers from citations'}
${settings.includeDOI ? '- Include DOI links when available' : '- Do not include DOI information'}
${settings.groupByTheme ? '- Group content by thematic categories' : '- Present content in order of appearance'}

Generate:
- Full citations in ${settings.citationStyle.toUpperCase()} format
- In-text citations for referencing
- Complete bibliography
${settings.groupByTheme ? '- Thematically organized content groups' : ''}

Ensure all formatting follows professional standards and is ready for direct use in documents.`

    return prompt
  }

  // Generate complete system prompt combining all enabled extraction types
  static createSystemPrompt(settings: ExtractionSettings): string {
    const sections: string[] = [
      "You are an expert document analysis AI. Extract information from the provided document according to user-specified requirements.",
      "",
      "EXTRACTION REQUIREMENTS:"
    ]

    // Add each enabled section
    if (settings.quotes.enabled) {
      sections.push("QUOTES:", this.createQuoteExtractionPrompt(settings.quotes), "")
    }

    if (settings.statistics.enabled) {
      sections.push("STATISTICS:", this.createStatisticsExtractionPrompt(settings.statistics), "")
    }

    sections.push("SUMMARY:", this.createSummaryPrompt(settings.summaries), "")
    sections.push("RELEVANCE SCORING:", this.createRelevancePrompt(settings.relevanceScoring), "")
    sections.push("OUTPUT FORMATTING:", this.createOutputFormatPrompt(settings.outputFormat), "")

    sections.push(
      "GENERAL INSTRUCTIONS:",
      "- Be thorough but concise",
      "- Maintain high accuracy standards", 
      "- Provide confidence scores for extractions",
      "- Follow professional writing conventions",
      "- Return structured, well-organized results"
    )

    return sections.join("\n")
  }

  // Create structured output schema based on enabled settings
  static createOutputSchema(settings: ExtractionSettings): object {
    const schema: any = {
      type: "object",
      properties: {
        summary: {
          type: "object", 
          properties: {
            summary: { type: "string" },
            key_findings: { 
              type: "array",
              items: { type: "string" }
            },
            word_count: { type: "number" },
            focus_areas: {
              type: "array", 
              items: { type: "string" }
            }
          },
          required: ["summary", "key_findings", "word_count", "focus_areas"]
        },
        relevance: {
          type: "object",
          properties: {
            relevance_score: { type: "number", minimum: 0, maximum: 100 },
            breakdown: {
              type: "object",
              properties: {
                keyword_match: { type: "number" },
                citation_impact: { type: "number" }, 
                recency_score: { type: "number" },
                methodology_quality: { type: "number" }
              },
              required: ["keyword_match", "citation_impact", "recency_score", "methodology_quality"]
            },
            matching_keywords: {
              type: "array",
              items: { type: "string" }
            },
            explanation: {
              type: "array", 
              items: { type: "string" }
            }
          },
          required: ["relevance_score", "breakdown", "matching_keywords", "explanation"]
        },
        formatting: {
          type: "object",
          properties: {
            citations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  full_citation: { type: "string" },
                  in_text_citation: { type: "string" },
                  doi: { type: "string" },
                  page_numbers: {
                    type: "array", 
                    items: { type: "string" }
                  }
                },
                required: ["full_citation", "in_text_citation"]
              }
            },
            bibliography: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["citations", "bibliography"]
        }
      },
      required: ["summary", "relevance", "formatting"]
    }

    // Add optional sections based on settings
    if (settings.quotes.enabled) {
      schema.properties.quotes = {
        type: "object",
        properties: {
          quotes: {
            type: "array",
            items: {
              type: "object", 
              properties: {
                text: { type: "string" },
                context: { type: "string" },
                relevance_score: { type: "number", minimum: 0, maximum: 100 },
                page_number: { type: "number" },
                section: { type: "string" },
                priority_type: { 
                  type: "string",
                  enum: ["relevance", "novelty", "statistical"]
                }
              },
              required: ["text", "context", "relevance_score", "section", "priority_type"]
            }
          },
          total_found: { type: "number" },
          extraction_confidence: { type: "number", minimum: 0, maximum: 100 }
        },
        required: ["quotes", "total_found", "extraction_confidence"]
      }
      schema.required.push("quotes")
    }

    if (settings.statistics.enabled) {
      schema.properties.statistics = {
        type: "object",
        properties: {
          statistics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                value: { type: ["string", "number"] },
                type: { 
                  type: "string",
                  enum: ["p_value", "confidence_interval", "effect_size", "sample_size", "correlation", "other"]
                },
                context: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 100 },
                page_number: { type: "number" }
              },
              required: ["value", "type", "context", "confidence"]
            }
          },
          sample_size: { type: "number" },
          statistical_power: { type: "number" },
          methodology_assessment: { type: "string" }
        },
        required: ["statistics", "methodology_assessment"]
      }
      schema.required.push("statistics")
    }

    if (settings.outputFormat.groupByTheme) {
      schema.properties.formatting.properties.grouped_content = {
        type: "array",
        items: {
          type: "object",
          properties: {
            theme: { type: "string" },
            items: { type: "array" }
          },
          required: ["theme", "items"]
        }
      }
    }

    return schema
  }
}

// Utility functions for working with extraction results
export class ExtractionResultProcessor {
  static validateQuotes(quotes: QuoteExtractionOutput['quotes'], settings: ExtractionSettings['quotes']): boolean {
    if (!quotes || quotes.length === 0) return true
    
    return quotes.every(quote => 
      quote.text.length >= settings.minLength &&
      quote.text.length <= settings.maxLength &&
      quote.relevance_score >= 0 && 
      quote.relevance_score <= 100
    ) && quotes.length <= settings.maxPerPaper
  }

  static validateStatistics(stats: StatisticalOutput['statistics'], settings: ExtractionSettings['statistics']): boolean {
    if (!stats || stats.length === 0) return true

    const hasRequiredTypes = stats.some(stat => {
      if (!settings.includeConfidenceIntervals && stat.type === 'confidence_interval') return false
      if (!settings.includePValues && stat.type === 'p_value') return false  
      if (!settings.includeEffectSizes && stat.type === 'effect_size') return false
      return true
    })

    return hasRequiredTypes && stats.every(stat => 
      stat.confidence >= 0 && stat.confidence <= 100
    )
  }

  static validateSummary(summary: SummaryOutput, settings: ExtractionSettings['summaries']): boolean {
    const lengthLimits = {
      'brief': { min: 50, max: 100 },
      'moderate': { min: 150, max: 300 },
      'detailed': { min: 400, max: 600 }
    }

    const limits = lengthLimits[settings.length]
    const wordCount = summary.summary.split(/\s+/).length

    return wordCount >= limits.min && wordCount <= limits.max
  }

  static formatCitation(citation: any, style: ExtractionSettings['outputFormat']['citationStyle']): string {
    // Implementation would depend on citation style
    switch (style) {
      case 'apa':
        return `${citation.authors} (${citation.year}). ${citation.title}. ${citation.journal}, ${citation.volume}(${citation.issue}), ${citation.pages}.`
      case 'mla':
        return `${citation.authors}. "${citation.title}." ${citation.journal}, vol. ${citation.volume}, no. ${citation.issue}, ${citation.year}, pp. ${citation.pages}.`
      case 'chicago': 
        return `${citation.authors}. "${citation.title}." ${citation.journal} ${citation.volume}, no. ${citation.issue} (${citation.year}): ${citation.pages}.`
      case 'harvard':
        return `${citation.authors} ${citation.year}, '${citation.title}', ${citation.journal}, vol. ${citation.volume}, no. ${citation.issue}, pp. ${citation.pages}.`
      default:
        return citation.full_citation || 'Citation format not supported'
    }
  }
}

