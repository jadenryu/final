"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Switch } from "../../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { AppSidebar } from "../../components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../../components/ui/sidebar"
import {
  User,
  Settings,
  Bell,
  Shield,
  Palette,
  Save,
  CheckCircle,
  AlertCircle,
  Edit,
  Camera,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe
} from "lucide-react"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  institution?: string
  department?: string
  position?: string
  location?: string
  website?: string
  joinedAt: string
  preferences: {
    summaryDepth: 'concise' | 'balanced' | 'comprehensive'
    statisticalPreference: 'minimal' | 'moderate' | 'extensive'
    quoteDensity: 'few' | 'moderate' | 'many'
    researchFocus: 'methodology' | 'results' | 'implications'
    technicalLevel: 'simplified' | 'balanced' | 'technical'
  }
  notifications: {
    email: boolean
    paperAnalysis: boolean
    projectUpdates: boolean
    weeklyDigest: boolean
    collaboratorActivity: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'institution'
    shareAnalytics: boolean
    allowCollaboration: boolean
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    // Load user profile from localStorage
    const loadProfile = () => {
      const preferences = JSON.parse(localStorage.getItem('resyft_preferences') || '{}')
      const mockProfile: UserProfile = {
        id: "user-1",
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@university.edu",
        avatar: "",
        bio: "Research scientist focusing on climate change impacts and environmental sustainability. Passionate about data-driven solutions for environmental challenges.",
        institution: "Stanford University",
        department: "Environmental Science",
        position: "Associate Professor",
        location: "Stanford, CA",
        website: "https://profiles.stanford.edu/sarah-johnson",
        joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        preferences: {
          summaryDepth: preferences.summary_depth || 'balanced',
          statisticalPreference: preferences.statistical_preference || 'moderate',
          quoteDensity: preferences.quote_density || 'moderate',
          researchFocus: preferences.research_focus || 'results',
          technicalLevel: preferences.technical_level || 'balanced'
        },
        notifications: {
          email: true,
          paperAnalysis: true,
          projectUpdates: true,
          weeklyDigest: false,
          collaboratorActivity: true
        },
        privacy: {
          profileVisibility: 'institution',
          shareAnalytics: false,
          allowCollaboration: true
        }
      }
      setProfile(mockProfile)
      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleSaveProfile = async () => {
    if (!profile) return

    setErrors([])
    const validationErrors: string[] = []

    if (!profile.name.trim()) {
      validationErrors.push("Name is required")
    }
    if (!profile.email.trim()) {
      validationErrors.push("Email is required")
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Save preferences to localStorage
      localStorage.setItem('resyft_preferences', JSON.stringify({
        summary_depth: profile.preferences.summaryDepth,
        statistical_preference: profile.preferences.statisticalPreference,
        quote_density: profile.preferences.quoteDensity,
        research_focus: profile.preferences.researchFocus,
        technical_level: profile.preferences.technicalLevel
      }))

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      setErrors(["Failed to save profile. Please try again."])
    }
    
    setSaving(false)
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && profile) {
      // In a real app, upload to storage and get URL
      const reader = new FileReader()
      reader.onload = (event) => {
        setProfile({
          ...profile,
          avatar: event.target?.result as string
        })
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!profile) {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <p className="text-gray-600">Profile not found</p>
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
            <div className="flex-1">
              <h1 className="text-xl playfair-semibold">Profile & Settings</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={profile.avatar} alt={profile.name} />
                        <AvatarFallback className="text-lg">
                          {profile.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 p-2 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 transition-colors">
                        <Camera className="w-4 h-4" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl playfair-bold text-gray-900">{profile.name}</h2>
                      <p className="text-gray-600">{profile.position} at {profile.institution}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {profile.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Joined {new Date(profile.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Settings Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Preferences
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Privacy
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details and bio
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={profile.name}
                            onChange={(e) => setProfile({
                              ...profile,
                              name: e.target.value
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({
                              ...profile,
                              email: e.target.value
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="institution">Institution</Label>
                          <Input
                            id="institution"
                            value={profile.institution || ''}
                            onChange={(e) => setProfile({
                              ...profile,
                              institution: e.target.value
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="department">Department</Label>
                          <Input
                            id="department"
                            value={profile.department || ''}
                            onChange={(e) => setProfile({
                              ...profile,
                              department: e.target.value
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="position">Position</Label>
                          <Input
                            id="position"
                            value={profile.position || ''}
                            onChange={(e) => setProfile({
                              ...profile,
                              position: e.target.value
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={profile.location || ''}
                            onChange={(e) => setProfile({
                              ...profile,
                              location: e.target.value
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            type="url"
                            placeholder="https://"
                            value={profile.website || ''}
                            onChange={(e) => setProfile({
                              ...profile,
                              website: e.target.value
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell us about your research interests and background..."
                          value={profile.bio || ''}
                          onChange={(e) => setProfile({
                            ...profile,
                            bio: e.target.value
                          })}
                          className="mt-1 min-h-[100px]"
                          maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {(profile.bio || '').length}/500 characters
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis Preferences</CardTitle>
                      <CardDescription>
                        Customize how AI analyzes your research papers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="text-sm merriweather-regular">Summary Detail Level</Label>
                        <Select
                          value={profile.preferences.summaryDepth}
                          onValueChange={(value) => setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              summaryDepth: value as any
                            }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="concise">Concise Overview</SelectItem>
                            <SelectItem value="balanced">Balanced Detail</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm merriweather-regular">Statistical Data Preference</Label>
                        <Select
                          value={profile.preferences.statisticalPreference}
                          onValueChange={(value) => setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              statisticalPreference: value as any
                            }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimal">Minimal Statistics</SelectItem>
                            <SelectItem value="moderate">Key Statistics</SelectItem>
                            <SelectItem value="extensive">Comprehensive Data</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm merriweather-regular">Quote Density</Label>
                        <Select
                          value={profile.preferences.quoteDensity}
                          onValueChange={(value) => setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              quoteDensity: value as any
                            }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="few">Essential Quotes Only</SelectItem>
                            <SelectItem value="moderate">Supporting Quotes</SelectItem>
                            <SelectItem value="many">Quote-Rich</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm merriweather-regular">Research Focus</Label>
                        <Select
                          value={profile.preferences.researchFocus}
                          onValueChange={(value) => setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              researchFocus: value as any
                            }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="methodology">Methodology & Design</SelectItem>
                            <SelectItem value="results">Results & Findings</SelectItem>
                            <SelectItem value="implications">Implications & Applications</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm merriweather-regular">Technical Language Level</Label>
                        <Select
                          value={profile.preferences.technicalLevel}
                          onValueChange={(value) => setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              technicalLevel: value as any
                            }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simplified">Simplified Language</SelectItem>
                            <SelectItem value="balanced">Balanced Approach</SelectItem>
                            <SelectItem value="technical">Full Technical Detail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Choose what notifications you'd like to receive
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm merriweather-regular">Email Notifications</Label>
                          <p className="text-xs text-gray-600">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={profile.notifications.email}
                          onCheckedChange={(checked) => setProfile({
                            ...profile,
                            notifications: {
                              ...profile.notifications,
                              email: checked
                            }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm merriweather-regular">Paper Analysis Complete</Label>
                          <p className="text-xs text-gray-600">When your paper analysis is finished</p>
                        </div>
                        <Switch
                          checked={profile.notifications.paperAnalysis}
                          onCheckedChange={(checked) => setProfile({
                            ...profile,
                            notifications: {
                              ...profile.notifications,
                              paperAnalysis: checked
                            }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm merriweather-regular">Project Updates</Label>
                          <p className="text-xs text-gray-600">Changes to your projects</p>
                        </div>
                        <Switch
                          checked={profile.notifications.projectUpdates}
                          onCheckedChange={(checked) => setProfile({
                            ...profile,
                            notifications: {
                              ...profile.notifications,
                              projectUpdates: checked
                            }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm merriweather-regular">Weekly Digest</Label>
                          <p className="text-xs text-gray-600">Weekly summary of your research activity</p>
                        </div>
                        <Switch
                          checked={profile.notifications.weeklyDigest}
                          onCheckedChange={(checked) => setProfile({
                            ...profile,
                            notifications: {
                              ...profile.notifications,
                              weeklyDigest: checked
                            }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm merriweather-regular">Collaborator Activity</Label>
                          <p className="text-xs text-gray-600">When collaborators make changes to shared projects</p>
                        </div>
                        <Switch
                          checked={profile.notifications.collaboratorActivity}
                          onCheckedChange={(checked) => setProfile({
                            ...profile,
                            notifications: {
                              ...profile.notifications,
                              collaboratorActivity: checked
                            }
                          })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Privacy Tab */}
                <TabsContent value="privacy" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy Settings</CardTitle>
                      <CardDescription>
                        Control how your data is shared and who can see your profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm merriweather-regular">Profile Visibility</Label>
                        <Select
                          value={profile.privacy.profileVisibility}
                          onValueChange={(value) => setProfile({
                            ...profile,
                            privacy: {
                              ...profile.privacy,
                              profileVisibility: value as any
                            }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="institution">Institution Only</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-600 mt-1">
                          Who can see your profile and research activity
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm merriweather-regular">Share Analytics</Label>
                          <p className="text-xs text-gray-600">Help improve Resyft with anonymous usage data</p>
                        </div>
                        <Switch
                          checked={profile.privacy.shareAnalytics}
                          onCheckedChange={(checked) => setProfile({
                            ...profile,
                            privacy: {
                              ...profile.privacy,
                              shareAnalytics: checked
                            }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm merriweather-regular">Allow Collaboration Invites</Label>
                          <p className="text-xs text-gray-600">Let others invite you to collaborate on projects</p>
                        </div>
                        <Switch
                          checked={profile.privacy.allowCollaboration}
                          onCheckedChange={(checked) => setProfile({
                            ...profile,
                            privacy: {
                              ...profile.privacy,
                              allowCollaboration: checked
                            }
                          })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Error Messages */}
              {errors.length > 0 && (
                <Alert variant="destructive" className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert className="border-green-200 bg-green-50 mt-6">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Profile updated successfully!
                  </AlertDescription>
                </Alert>
              )}

              {/* Save Button */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="min-w-[120px]"
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
            </motion.div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}