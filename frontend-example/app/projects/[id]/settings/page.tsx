'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Input } from '../../../../components/ui/input'
import { Textarea } from '../../../../components/ui/textarea'
import { Badge } from '../../../../components/ui/badge'
import { createClient } from '../../../../lib/supabase'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, BarChart3, Quote, FileText, Settings as SettingsIcon } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface ProjectConfiguration {
  extract_quotes: boolean
  extract_statistics: boolean
  extract_methods: boolean
  extract_conclusions: boolean
  extract_sample_size: boolean
  preferred_info_type: 'statistical' | 'qualitative' | 'balanced'
  custom_instructions: string
  quotes_count: number
  focus_areas: string[]
  citation_style: 'apa' | 'mla' | 'chicago' | 'harvard'
}

interface Project {
  id: string
  name: string
  description: string
  research_question: string
  thesis?: string
  configuration: ProjectConfiguration
}

export default function ProjectSettings() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [project, setProject] = useState<Project | null>(null)
  const [config, setConfig] = useState<ProjectConfiguration>({
    extract_quotes: true,
    extract_statistics: true,
    extract_methods: true,
    extract_conclusions: true,
    extract_sample_size: true,
    preferred_info_type: 'balanced',
    custom_instructions: '',
    quotes_count: 2,
    focus_areas: [],
    citation_style: 'apa'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newFocusArea, setNewFocusArea] = useState('')

  useEffect(() => {
    loadProject()
  }, [params.id])

  const loadProject = async () => {
    setLoading(true)
    // Simulate loading project data
    setTimeout(() => {
      const projectData: Project = {
        id: params.id as string,
        name: 'Machine Learning in Healthcare',
        description: 'Research on AI applications in medical diagnosis',
        research_question: 'How effective are machine learning models in early disease detection?',
        thesis: 'ML models significantly improve diagnostic accuracy when combined with traditional methods.',
        configuration: {
          extract_quotes: true,
          extract_statistics: true,
          extract_methods: true,
          extract_conclusions: true,
          extract_sample_size: true,
          preferred_info_type: 'statistical',
          custom_instructions: 'Focus on diagnostic accuracy metrics and patient outcomes. Prioritize peer-reviewed studies with large sample sizes.',
          quotes_count: 3,
          focus_areas: ['diagnostic accuracy', 'machine learning', 'clinical outcomes', 'medical imaging'],
          citation_style: 'apa'
        }
      }
      setProject(projectData)
      setConfig(projectData.configuration)
      setLoading(false)
    }, 1000)
  }

  const saveConfiguration = async () => {
    setSaving(true)
    // Simulate saving
    setTimeout(() => {
      if (project) {
        setProject({ ...project, configuration: config })
      }
      setSaving(false)
    }, 1000)
  }

  const addFocusArea = () => {
    if (newFocusArea.trim() && !config.focus_areas.includes(newFocusArea.trim())) {
      setConfig({
        ...config,
        focus_areas: [...config.focus_areas, newFocusArea.trim()]
      })
      setNewFocusArea('')
    }
  }

  const removeFocusArea = (area: string) => {
    setConfig({
      ...config,
      focus_areas: config.focus_areas.filter(a => a !== area)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-headline text-gray-900 mb-2">Project Not Found</h2>
          <Link href="/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/projects/${project.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Project
                </Button>
              </Link>
              <div>
                <h1 className="text-xl text-headline text-gray-900 flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-2" />
                  Project Settings
                </h1>
                <p className="text-sm text-gray-600 text-body-premium">{project.name}</p>
              </div>
            </div>
            <Button
              onClick={saveConfiguration}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Analysis Configuration */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-headline flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Analysis Configuration
              </CardTitle>
              <CardDescription className="text-body-premium">
                Customize what information Resyft extracts from your research sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Extraction Options */}
              <div>
                <h3 className="text-subhead text-gray-900 mb-4">Information to Extract</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.extract_quotes}
                      onChange={(e) => setConfig({ ...config, extract_quotes: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="text-subhead text-gray-900">Key Quotes</span>
                      <p className="text-xs text-gray-600">Extract important quotations that support your thesis</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.extract_statistics}
                      onChange={(e) => setConfig({ ...config, extract_statistics: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="text-subhead text-gray-900">Statistics & Data</span>
                      <p className="text-xs text-gray-600">Extract numerical data, p-values, percentages</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.extract_methods}
                      onChange={(e) => setConfig({ ...config, extract_methods: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="text-subhead text-gray-900">Research Methods</span>
                      <p className="text-xs text-gray-600">Identify study design, sample selection, procedures</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.extract_conclusions}
                      onChange={(e) => setConfig({ ...config, extract_conclusions: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="text-subhead text-gray-900">Conclusions</span>
                      <p className="text-xs text-gray-600">Extract main findings and implications</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.extract_sample_size}
                      onChange={(e) => setConfig({ ...config, extract_sample_size: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <span className="text-subhead text-gray-900">Sample Size</span>
                      <p className="text-xs text-gray-600">Identify participant counts and demographics</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Information Preference */}
              <div>
                <h3 className="text-subhead text-gray-900 mb-4">Information Preference</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['statistical', 'qualitative', 'balanced'] as const).map((type) => (
                    <label
                      key={type}
                      className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        config.preferred_info_type === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="info_type"
                        value={type}
                        checked={config.preferred_info_type === type}
                        onChange={(e) => setConfig({ ...config, preferred_info_type: e.target.value as any })}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <span className="text-subhead text-gray-900 capitalize">{type}</span>
                        <p className="text-xs text-gray-600 mt-1">
                          {type === 'statistical' && 'Prioritize numbers, data, metrics'}
                          {type === 'qualitative' && 'Focus on concepts, themes, insights'}
                          {type === 'balanced' && 'Equal mix of data and insights'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quote Configuration */}
              {config.extract_quotes && (
                <div>
                  <h3 className="text-subhead text-gray-900 mb-4">Quote Extraction</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-subhead text-gray-700 mb-2 block">
                        Number of quotes per source
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={config.quotes_count}
                        onChange={(e) => setConfig({ ...config, quotes_count: parseInt(e.target.value) || 2 })}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Focus Areas */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-headline flex items-center">
                <Quote className="w-5 h-5 mr-2 text-purple-600" />
                Focus Areas
              </CardTitle>
              <CardDescription className="text-body-premium">
                Add keywords and topics that Resyft should prioritize when analyzing sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="e.g., diagnostic accuracy, clinical trials"
                  value={newFocusArea}
                  onChange={(e) => setNewFocusArea(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFocusArea()}
                  className="flex-1"
                />
                <Button onClick={addFocusArea} variant="outline">
                  Add
                </Button>
              </div>
              
              {config.focus_areas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {config.focus_areas.map((area, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1 cursor-pointer hover:bg-red-100"
                      onClick={() => removeFocusArea(area)}
                    >
                      {area} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Instructions */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-headline flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Custom Instructions
              </CardTitle>
              <CardDescription className="text-body-premium">
                Provide specific instructions for how Resyft should analyze your sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., Focus on diagnostic accuracy metrics and patient outcomes. Prioritize peer-reviewed studies with large sample sizes. Look for comparisons between AI and traditional methods."
                value={config.custom_instructions}
                onChange={(e) => setConfig({ ...config, custom_instructions: e.target.value })}
                className="min-h-32"
              />
              <p className="text-xs text-gray-500 mt-2">
                These instructions will be used to generate more targeted analysis and ready-to-cite text for your specific research needs.
              </p>
            </CardContent>
          </Card>

          {/* Citation Style */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-headline">Citation Style</CardTitle>
              <CardDescription className="text-body-premium">
                Choose the citation format for ready-to-cite text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['apa', 'mla', 'chicago', 'harvard'] as const).map((style) => (
                  <label
                    key={style}
                    className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      config.citation_style === style
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="citation_style"
                      value={style}
                      checked={config.citation_style === style}
                      onChange={(e) => setConfig({ ...config, citation_style: e.target.value as any })}
                      className="sr-only"
                    />
                    <span className="text-subhead text-gray-900 uppercase">{style}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card className="shadow-xl border-0 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="text-headline">Configuration Preview</CardTitle>
              <CardDescription className="text-body-premium">
                This is how your sources will be analyzed with the current settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm inter-medium">
                  <strong>Extract:</strong> {[
                    config.extract_quotes && 'Quotes',
                    config.extract_statistics && 'Statistics',
                    config.extract_methods && 'Methods',
                    config.extract_conclusions && 'Conclusions',
                    config.extract_sample_size && 'Sample Size'
                  ].filter(Boolean).join(', ')}
                </p>
                
                <p className="text-sm inter-medium">
                  <strong>Priority:</strong> {config.preferred_info_type} information
                </p>
                
                {config.extract_quotes && (
                  <p className="text-sm inter-medium">
                    <strong>Quotes:</strong> Up to {config.quotes_count} per source
                  </p>
                )}
                
                {config.focus_areas.length > 0 && (
                  <p className="text-sm inter-medium">
                    <strong>Focus Areas:</strong> {config.focus_areas.join(', ')}
                  </p>
                )}
                
                <p className="text-sm inter-medium">
                  <strong>Citation Style:</strong> {config.citation_style.toUpperCase()}
                </p>
                
                {config.custom_instructions && (
                  <div>
                    <p className="text-sm inter-medium mb-1"><strong>Custom Instructions:</strong></p>
                    <p className="text-xs text-gray-600 bg-white p-3 rounded border">
                      {config.custom_instructions}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}