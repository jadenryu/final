import { z } from "zod"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

interface URLValidationOptions {
  allowedDomains?: string[]
  requireHttps?: boolean
  checkAccessibility?: boolean
  maxRedirects?: number
}

interface TextValidationOptions {
  minLength?: number
  maxLength?: number
  checkLanguage?: boolean
  checkPlagiarism?: boolean
  checkQuality?: boolean
}

interface FileValidationOptions {
  maxSize?: number
  allowedTypes?: string[]
  checkContent?: boolean
  scanForMalware?: boolean
}

// Comprehensive academic URL validation
export async function validateAcademicURL(
  url: string,
  options: URLValidationOptions = {}
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Default allowed academic domains
  const defaultDomains = [
    'arxiv.org',
    'pubmed.ncbi.nlm.nih.gov',
    'scholar.google.com',
    'sciencedirect.com',
    'nature.com',
    'science.org',
    'ieee.org',
    'ieeexplore.ieee.org',
    'springer.com',
    'link.springer.com',
    'wiley.com',
    'onlinelibrary.wiley.com',
    'plos.org',
    'journals.plos.org',
    'biorxiv.org',
    'medrxiv.org',
    'ssrn.com',
    'papers.ssrn.com',
    'jstor.org',
    'ncbi.nlm.nih.gov',
    'pmc.ncbi.nlm.nih.gov',
    'doi.org',
    'dx.doi.org',
    'researchgate.net',
    'academia.edu',
    'frontiersin.org',
    'mdpi.com',
    'acs.org',
    'pubs.acs.org',
    'rsc.org',
    'pubs.rsc.org',
    'cell.com',
    'nejm.org',
    'bmj.com',
    'thelancet.com',
    'jamanetwork.com',
    'annals.org',
    'oup.com',
    'academic.oup.com',
    'cambridge.org',
    'tandfonline.com',
    'sage.pub',
    'journals.sagepub.com',
    'emerald.com',
    'sciencemag.org',
    'pnas.org',
    'royalsocietypublishing.org',
    'iop.org',
    'iopscience.iop.org',
    'aps.org',
    'journals.aps.org',
    'aip.org',
    'aip.scitation.org',
    'acm.org',
    'dl.acm.org',
    'biomedcentral.com',
    'elifesciences.org',
    'genetics.org',
    'ashpublications.org',
    'physiology.org',
    'ahajournals.org',
    'diabetesjournals.org',
    'jimmunol.org'
  ]

  const allowedDomains = options.allowedDomains || defaultDomains
  const requireHttps = options.requireHttps !== false // Default to true

  // Basic URL validation
  if (!url || !url.trim()) {
    errors.push('URL is required')
    return { isValid: false, errors }
  }

  // Remove whitespace
  url = url.trim()

  // Check for common URL mistakes
  if (url.includes(' ')) {
    errors.push('URL contains spaces. Please ensure the URL is properly formatted')
  }

  // Validate URL format
  let urlObj: URL
  try {
    urlObj = new URL(url)
  } catch (e) {
    // Try adding https:// if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      try {
        urlObj = new URL('https://' + url)
        warnings.push('Added https:// to the URL. Please verify this is correct')
      } catch {
        errors.push('Invalid URL format. Please enter a complete URL (e.g., https://arxiv.org/pdf/...)')
        return { isValid: false, errors }
      }
    } else {
      errors.push('Invalid URL format. Please check for typos or missing characters')
      return { isValid: false, errors }
    }
  }

  // Check protocol
  if (requireHttps && urlObj.protocol === 'http:') {
    warnings.push('Using HTTP instead of HTTPS. The connection may not be secure')
  }

  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    errors.push(`Invalid protocol: ${urlObj.protocol}. Only HTTP and HTTPS are supported`)
  }

  // Check if domain is allowed
  const hostname = urlObj.hostname.toLowerCase()
  const isAllowedDomain = allowedDomains.some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  )

  if (!isAllowedDomain) {
    // Check for common mistakes
    if (hostname.includes('google.com') && !hostname.includes('scholar')) {
      errors.push('Please use Google Scholar (scholar.google.com) for academic papers, not regular Google')
    } else if (hostname.includes('wikipedia')) {
      errors.push('Wikipedia is not considered a primary academic source. Please provide a peer-reviewed paper')
    } else if (hostname.includes('medium.com') || hostname.includes('substack.com') || hostname.includes('blogspot.com')) {
      errors.push('Blog posts are not accepted. Please provide a peer-reviewed academic paper')
    } else if (hostname.includes('youtube.com') || hostname.includes('vimeo.com')) {
      errors.push('Video links are not supported. Please provide a link to a written academic paper')
    } else {
      errors.push(`This domain (${hostname}) is not recognized as an academic source. Supported sources include: ${allowedDomains.slice(0, 10).join(', ')}, and more`)
    }
  }

  // Check for specific URL patterns
  if (url.includes('arxiv.org')) {
    // Validate arXiv URL format
    if (!url.match(/arxiv\.org\/(abs|pdf)\/\d{4}\.\d{4,5}(v\d+)?/)) {
      warnings.push('This arXiv URL may not point to a specific paper. Expected format: arxiv.org/abs/XXXX.XXXXX or arxiv.org/pdf/XXXX.XXXXX')
    }
  } else if (url.includes('doi.org')) {
    // Validate DOI format
    if (!url.match(/doi\.org\/10\.\d{4,}/)) {
      warnings.push('This DOI URL may be incorrectly formatted. Expected format: doi.org/10.XXXX/...')
    }
  } else if (url.includes('pubmed')) {
    // Validate PubMed URL
    if (!url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/\d+/)) {
      warnings.push('This PubMed URL may not point to a specific article. Expected format: pubmed.ncbi.nlm.nih.gov/PMID')
    }
  }

  // Check for common non-paper URLs
  if (url.includes('/search') || url.includes('/results') || url.includes('/browse')) {
    warnings.push('This appears to be a search results page, not a direct link to a paper')
  }

  if (url.includes('/login') || url.includes('/signin') || url.includes('/register')) {
    errors.push('This appears to be a login page. Please provide a direct link to the paper')
  }

  // Check URL length
  if (url.length > 2048) {
    warnings.push('URL is unusually long and may not work properly')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

// Enhanced text validation for academic content
export function validateAcademicText(
  text: string,
  options: TextValidationOptions = {}
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const minLength = options.minLength || 100
  const maxLength = options.maxLength || 50000

  // Basic validation
  if (!text || !text.trim()) {
    errors.push('Text content is required')
    return { isValid: false, errors }
  }

  text = text.trim()

  // Length validation
  if (text.length < minLength) {
    errors.push(`Text must be at least ${minLength} characters long (currently ${text.length} characters)`)
  }

  if (text.length > maxLength) {
    errors.push(`Text exceeds maximum length of ${maxLength} characters (currently ${text.length} characters)`)
  }

  // Check for academic content indicators
  const academicIndicators = [
    'abstract', 'introduction', 'methodology', 'method', 'results', 
    'discussion', 'conclusion', 'references', 'et al', 'doi:', 
    'figure', 'table', 'hypothesis', 'experiment', 'analysis'
  ]

  const hasAcademicContent = academicIndicators.some(indicator => 
    text.toLowerCase().includes(indicator)
  )

  if (!hasAcademicContent && text.length > 500) {
    warnings.push('This text may not be from an academic paper. Please ensure you\'re pasting research content')
  }

  // Check for excessive formatting issues
  const consecutiveNewlines = text.match(/\n{4,}/g)
  if (consecutiveNewlines && consecutiveNewlines.length > 5) {
    warnings.push('Text contains excessive line breaks which may affect analysis quality')
  }

  // Check for encoding issues
  if (text.includes('�') || text.includes('\ufffd')) {
    errors.push('Text contains encoding errors. Please copy the text again or try a different source')
  }

  // Check for incomplete content
  if (text.endsWith('...') || text.includes('[truncated]') || text.includes('[...]')) {
    warnings.push('Text appears to be truncated or incomplete. Please provide the complete content')
  }

  // Check for excessive special characters (might indicate corrupted text)
  const specialCharRatio = (text.match(/[^\w\s.,;:!?'"()-]/g) || []).length / text.length
  if (specialCharRatio > 0.1) {
    warnings.push('Text contains many special characters which may indicate formatting issues')
  }

  // Check for language (basic English detection)
  if (options.checkLanguage) {
    const commonEnglishWords = ['the', 'and', 'of', 'to', 'in', 'is', 'that', 'for', 'with', 'as']
    const wordCount = text.split(/\s+/).length
    const englishWordCount = commonEnglishWords.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      return count + (text.match(regex) || []).length
    }, 0)

    if (wordCount > 50 && englishWordCount / wordCount < 0.02) {
      warnings.push('Text may not be in English. Non-English papers may have reduced analysis accuracy')
    }
  }

  // Check for quality indicators
  if (options.checkQuality) {
    // Check for very short sentences (might indicate poor extraction)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length

    if (avgSentenceLength < 5 && sentences.length > 10) {
      warnings.push('Text contains many very short sentences, which may indicate extraction issues')
    }

    // Check for repeated content
    const chunks = text.match(/.{50,100}/g) || []
    const uniqueChunks = new Set(chunks)
    if (chunks.length > 10 && uniqueChunks.size < chunks.length * 0.7) {
      warnings.push('Text contains significant repetition which may affect analysis quality')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

// Enhanced file validation
export function validateAcademicFile(
  file: File,
  options: FileValidationOptions = {}
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const maxSize = options.maxSize || 10 * 1024 * 1024 // 10MB default
  const allowedTypes = options.allowedTypes || ['application/pdf', 'text/plain']

  // Basic validation
  if (!file) {
    errors.push('No file selected')
    return { isValid: false, errors }
  }

  // Size validation
  if (file.size === 0) {
    errors.push('File is empty')
  } else if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2)
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0)
    errors.push(`File size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB`)
  } else if (file.size < 1024) { // Less than 1KB
    warnings.push('File is very small and may not contain enough content for analysis')
  }

  // Type validation
  if (!allowedTypes.includes(file.type)) {
    // Check file extension as fallback
    const extension = file.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['pdf', 'txt']
    
    if (extension && validExtensions.includes(extension)) {
      warnings.push(`File type could not be verified, but extension .${extension} appears valid`)
    } else {
      errors.push(`File type not supported. Please upload a PDF or TXT file (received: ${file.type || 'unknown'})`)
    }
  }

  // Name validation
  if (file.name.length > 255) {
    errors.push('File name is too long. Please rename the file to a shorter name')
  }

  // Check for suspicious patterns in filename
  const suspiciousPatterns = [
    /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.com$/i, /\.pif$/i,
    /\.scr$/i, /\.vbs$/i, /\.js$/i, /\.jar$/i, /\.zip$/i
  ]

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    errors.push('File appears to be an executable or archive, not a document')
  }

  // Check for hidden files
  if (file.name.startsWith('.')) {
    warnings.push('Hidden files may not be processed correctly')
  }

  // Check filename for academic indicators
  const academicKeywords = ['paper', 'article', 'journal', 'research', 'study', 'thesis', 'dissertation']
  const hasAcademicName = academicKeywords.some(keyword => 
    file.name.toLowerCase().includes(keyword)
  )

  if (!hasAcademicName && !file.name.match(/\d{4}/)) { // No year indication either
    warnings.push('Filename doesn\'t appear to be an academic paper. Please ensure you\'re uploading research content')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

// Helper function to sanitize input
export function sanitizeInput(input: string): string {
  // Remove null bytes
  input = input.replace(/\0/g, '')
  
  // Normalize whitespace
  input = input.replace(/\s+/g, ' ').trim()
  
  // Remove control characters except newlines and tabs
  input = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  return input
}

// Helper to check if URL is accessible
export async function checkURLAccessibility(url: string): Promise<{
  accessible: boolean
  statusCode?: number
  error?: string
}> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // Avoid CORS issues
      cache: 'no-cache'
    })
    
    return {
      accessible: response.ok || response.type === 'opaque', // opaque means CORS blocked but URL exists
      statusCode: response.status
    }
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Failed to check URL'
    }
  }
}

// Zod schemas for form validation
export const documentUploadSchema = z.object({
  documentUrl: z.string().url("Please enter a valid URL").min(1, "Document URL is required"),
  extractionType: z.enum(['all', 'summary', 'key_points', 'insights', 'entities', 'questions'])
})

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>

export const quickAnalysisSchema = z.object({
  query: z.string().min(1, "Query is required").max(500, "Query must be less than 500 characters"),
  documentUrls: z.array(z.string().url("Please enter valid URLs")).min(1, "At least one document URL is required")
})

export type QuickAnalysisInput = z.infer<typeof quickAnalysisSchema>

export const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  institution: z.string().optional(),
  researchAreas: z.array(z.string()).optional()
})

export type UserProfileInput = z.infer<typeof userProfileSchema>