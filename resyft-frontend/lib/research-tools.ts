// Document Processing Tools - Core functions for AI document assistant

export interface Tool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
    }
  }
}

export const documentTools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'extract_document_data',
      description: 'Extract numerical data, statistics, and key figures from any document',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The document text to analyze for data and statistics'
          },
          focus_areas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific data types to focus on (e.g., percentages, dates, amounts, measurements)'
          }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_document_summary',
      description: 'Create structured summaries of documents with key information and insights',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The document text to summarize'
          },
          length: {
            type: 'string',
            enum: ['brief', 'detailed', 'comprehensive'],
            description: 'Length of the summary to generate'
          },
          focus: {
            type: 'string',
            enum: ['key_points', 'main_topics', 'action_items', 'all'],
            description: 'Primary focus area for the summary'
          }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'extract_key_quotes',
      description: 'Extract important quotes and passages from documents',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The document text to extract quotes from'
          },
          quote_type: {
            type: 'string',
            enum: ['important_statements', 'definitions', 'conclusions', 'action_items', 'all'],
            description: 'Type of quotes to prioritize'
          },
          max_quotes: {
            type: 'number',
            description: 'Maximum number of quotes to extract (default: 5)'
          }
        },
        required: ['text']
      }
    }
  }
]

// Tool execution handlers
export const toolHandlers = {
  extract_document_data: async (args: any) => {
    const { text, focus_areas = ['all'] } = args
    
    // Call the extraction API with data extraction focus
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_text: text,
        extraction_type: 'statistics',
        settings: {
          statistics: { 
            enabled: true, 
            includePValues: true,
            includeConfidenceIntervals: true,
            includeEffectSizes: true
          },
          quotes: { enabled: false },
          summaries: { enabled: false }
        }
      })
    })
    
    const data = await response.json()
    
    return {
      extracted_data: data.key_statistics || 'No numerical data found',
      sample_size: data.sample_size || 'Not specified',
      data_summary: data.methods || 'Data extraction completed',
      confidence: 'High precision extraction using AI model'
    }
  },

  generate_document_summary: async (args: any) => {
    const { text, length = 'detailed', focus = 'all' } = args
    
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_text: text,
        extraction_type: 'summary',
        settings: {
          summaries: { 
            enabled: true,
            length: length,
            focusAreas: focus === 'all' ? ['key_points', 'main_topics', 'action_items'] : [focus],
            includeMethodology: true,
            includeLimitations: true,
            includeImplications: true
          },
          quotes: { enabled: false },
          statistics: { enabled: false }
        }
      })
    })
    
    const data = await response.json()
    
    return {
      summary: data.conclusions || data.suggested_text || 'Document summary generated',
      key_points: data.important_quotes || [],
      main_topics: data.methods || 'Main topics extracted',
      word_count: text.length || 0
    }
  },

  extract_key_quotes: async (args: any) => {
    const { text, quote_type = 'all', max_quotes = 5 } = args
    
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper_text: text,
        extraction_type: 'quotes',
        settings: {
          quotes: { 
            enabled: true,
            maxPerPaper: max_quotes,
            priority: quote_type === 'all' ? 'high_impact' : quote_type
          },
          summaries: { enabled: false },
          statistics: { enabled: false }
        }
      })
    })
    
    const data = await response.json()
    
    return {
      quotes: data.important_quotes || [],
      total_found: data.important_quotes?.length || 0,
      extraction_confidence: data.reliability_score || 0
    }
  }
}