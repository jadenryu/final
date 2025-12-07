"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Switch } from "../../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Slider } from "../../components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Separator } from "../../components/ui/separator"
import { AppSidebar } from "../../components/app-sidebar"
import { BackNavigation } from "../../components/back-navigation"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import {
  Settings,
  FileText,
  Search,
  Brain,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface DocumentSettings {
  processing: {
    extractKeyPoints: boolean
    maxKeyPoints: number
    includeQuotes: boolean
    generateSummary: boolean
  }
  search: {
    keywordWeight: number
    semanticWeight: number
    enableSmartSearch: boolean
  }
  privacy: {
    storeHistory: boolean
    shareAnalytics: boolean
    encryptDocuments: boolean
  }
  output: {
    includeSourceRefs: boolean
    showConfidence: boolean
    groupByTopics: boolean
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<DocumentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('resyft_document_settings')
      const defaultSettings: DocumentSettings = {
        processing: {
          extractKeyPoints: true,
          maxKeyPoints: 10,
          includeQuotes: true,
          generateSummary: true
        },
        search: {
          keywordWeight: 60,
          semanticWeight: 40,
          enableSmartSearch: true
        },
        privacy: {
          storeHistory: false,
          shareAnalytics: false,
          encryptDocuments: true
        },
        output: {
          includeSourceRefs: true,
          showConfidence: false,
          groupByTopics: true
        }
      }

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      } else {
        setSettings(defaultSettings)
      }
      setLoading(false)
    }

    loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      localStorage.setItem('resyft_document_settings', JSON.stringify(settings))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Settings save error:', error)
    }
    setSaving(false)
  }

  if (loading || !settings) {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">Loading settings...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <BackNavigation />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-xl playfair-semibold">Document Assistant Settings</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Document Processing Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how your documents are processed and analyzed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="processing" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="processing">
                        <FileText className="w-4 h-4 mr-2" />
                        Processing
                      </TabsTrigger>
                      <TabsTrigger value="search">
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </TabsTrigger>
                      <TabsTrigger value="privacy">
                        <Brain className="w-4 h-4 mr-2" />
                        Privacy
                      </TabsTrigger>
                      <TabsTrigger value="output">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Output
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="processing" className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Extract Key Points</Label>
                            <p className="text-xs text-gray-500">Automatically identify important information</p>
                          </div>
                          <Switch
                            checked={settings.processing.extractKeyPoints}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                processing: { ...settings.processing, extractKeyPoints: checked }
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Maximum Key Points</Label>
                          <Slider
                            value={[settings.processing.maxKeyPoints]}
                            onValueChange={(value) =>
                              setSettings({
                                ...settings,
                                processing: { ...settings.processing, maxKeyPoints: value[0] }
                              })
                            }
                            max={20}
                            min={5}
                            step={1}
                            className="w-full"
                          />
                          <div className="text-right text-sm text-gray-500">
                            {settings.processing.maxKeyPoints} points
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Include Quotes</Label>
                            <p className="text-xs text-gray-500">Extract relevant quotes from documents</p>
                          </div>
                          <Switch
                            checked={settings.processing.includeQuotes}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                processing: { ...settings.processing, includeQuotes: checked }
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Generate Summaries</Label>
                            <p className="text-xs text-gray-500">Create concise summaries of documents</p>
                          </div>
                          <Switch
                            checked={settings.processing.generateSummary}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                processing: { ...settings.processing, generateSummary: checked }
                              })
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="search" className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Keyword Search Weight</Label>
                          <Slider
                            value={[settings.search.keywordWeight]}
                            onValueChange={(value) =>
                              setSettings({
                                ...settings,
                                search: { ...settings.search, keywordWeight: value[0] }
                              })
                            }
                            max={100}
                            min={0}
                            step={5}
                            className="w-full"
                          />
                          <div className="text-right text-sm text-gray-500">
                            {settings.search.keywordWeight}%
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Semantic Search Weight</Label>
                          <Slider
                            value={[settings.search.semanticWeight]}
                            onValueChange={(value) =>
                              setSettings({
                                ...settings,
                                search: { ...settings.search, semanticWeight: value[0] }
                              })
                            }
                            max={100}
                            min={0}
                            step={5}
                            className="w-full"
                          />
                          <div className="text-right text-sm text-gray-500">
                            {settings.search.semanticWeight}%
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Smart Search</Label>
                            <p className="text-xs text-gray-500">Use AI to understand search intent</p>
                          </div>
                          <Switch
                            checked={settings.search.enableSmartSearch}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                search: { ...settings.search, enableSmartSearch: checked }
                              })
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="privacy" className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Store Query History</Label>
                            <p className="text-xs text-gray-500">Keep a history of your searches</p>
                          </div>
                          <Switch
                            checked={settings.privacy.storeHistory}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                privacy: { ...settings.privacy, storeHistory: checked }
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Share Analytics</Label>
                            <p className="text-xs text-gray-500">Help improve the service with usage data</p>
                          </div>
                          <Switch
                            checked={settings.privacy.shareAnalytics}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                privacy: { ...settings.privacy, shareAnalytics: checked }
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Encrypt Documents</Label>
                            <p className="text-xs text-gray-500">Encrypt your documents at rest</p>
                          </div>
                          <Switch
                            checked={settings.privacy.encryptDocuments}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                privacy: { ...settings.privacy, encryptDocuments: checked }
                              })
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="output" className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Include Source References</Label>
                            <p className="text-xs text-gray-500">Show which documents information came from</p>
                          </div>
                          <Switch
                            checked={settings.output.includeSourceRefs}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                output: { ...settings.output, includeSourceRefs: checked }
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Show Confidence Scores</Label>
                            <p className="text-xs text-gray-500">Display AI confidence in responses</p>
                          </div>
                          <Switch
                            checked={settings.output.showConfidence}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                output: { ...settings.output, showConfidence: checked }
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Group by Topics</Label>
                            <p className="text-xs text-gray-500">Organize results by related topics</p>
                          </div>
                          <Switch
                            checked={settings.output.groupByTopics}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                output: { ...settings.output, groupByTopics: checked }
                              })
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {success && (
                    <Alert className="border-green-200 bg-green-50 mt-6">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Settings saved successfully!
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-4 mt-6">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {saving ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}