'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useMutation } from '@tanstack/react-query'
// Define ExtractionRequest interface locally
interface ExtractionRequest {
  document_url?: string
  document_text?: string
  extraction_type: 'all' | 'summary' | 'key_points' | 'insights' | 'entities' | 'questions'
}

export function DocumentUpload() {
  const [documentUrl, setDocumentUrl] = useState('')
  const [extractionType, setExtractionType] = useState<ExtractionRequest['extraction_type']>('all')
  
  const extractMutation = useMutation({
    mutationFn: async (data: ExtractionRequest) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Extraction failed')
      return response.json()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentUrl) return
    
    extractMutation.mutate({
      document_url: documentUrl,
      extraction_type: extractionType,
    })
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 mb-12">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="document-url" className="block text-sm merriweather-regular text-gray-700 mb-2">
            Document URL
          </label>
          <Textarea
            id="document-url"
            placeholder="Paste the URL to any document..."
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            className="w-full"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="extraction-type" className="block text-sm merriweather-regular text-gray-700 mb-2">
            What information do you need?
          </label>
          <Select
            value={extractionType}
            onValueChange={(value) => setExtractionType(value as ExtractionRequest['extraction_type'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Information</SelectItem>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="key_points">Key Points</SelectItem>
              <SelectItem value="insights">Insights</SelectItem>
              <SelectItem value="entities">Named Entities</SelectItem>
              <SelectItem value="questions">Key Questions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={!documentUrl || extractMutation.isPending}
        >
          {extractMutation.isPending ? 'Processing...' : 'Process Document'}
        </Button>
      </form>

      {extractMutation.isSuccess && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg playfair-semibold mb-4">Processing Results</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(extractMutation.data, null, 2)}
          </pre>
        </div>
      )}

      {extractMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          Error: Failed to process document. Please try again.
        </div>
      )}
    </div>
  )
}