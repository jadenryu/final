"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Alert, AlertDescription } from '../../components/ui/alert'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Send,
  HelpCircle,
  Zap,
  FileText,
  Settings,
  AlertCircle,
  Users,
  BookOpen
} from 'lucide-react'

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
    priority: 'medium'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setSubmitted(true)
    setIsSubmitting(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const categories = [
    { value: 'technical', label: 'Technical Issue', icon: Settings },
    { value: 'billing', label: 'Billing & Account', icon: Users },
    { value: 'feature', label: 'Feature Request', icon: Zap },
    { value: 'bug', label: 'Bug Report', icon: AlertCircle },
    { value: 'documentation', label: 'Documentation', icon: BookOpen },
    { value: 'other', label: 'Other', icon: HelpCircle }
  ]

  const commonQuestions = [
    {
      question: 'How accurate is the AI analysis?',
      answer: 'Resyft achieves 95% accuracy in extracting key research elements. Our AI is specifically trained on academic papers.'
    },
    {
      question: 'Can I customize extraction settings?',
      answer: 'Yes! You can configure quotes, statistics, summaries, and output formatting in your settings.'
    },
    {
      question: 'How fast is paper analysis?',
      answer: 'Most papers are analyzed in under 30 seconds, with complex documents taking up to 2 minutes.'
    },
    {
      question: 'Is my research data secure?',
      answer: 'Absolutely. We use enterprise-grade encryption and never store your research content permanently.'
    }
  ]

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl playfair-bold text-gray-900 mb-2">
                Support Request Submitted
              </h2>
              <p className="text-gray-600 mb-6">
                Thank you for contacting us. We'll respond within 24 hours via email.
              </p>
              <div className="space-y-3">
                <Link href="/overview">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Return to Dashboard
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => setSubmitted(false)} className="w-full">
                  Submit Another Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/overview">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
                <h1 className="text-xl playfair-semibold text-gray-900">Support Center</h1>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              <Clock className="w-3 h-3 mr-1" />
              24/7 Available
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Support Form */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>How can we help you?</CardTitle>
                  <CardDescription>
                    Describe your issue and we'll get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm merriweather-regular text-gray-700">Name *</label>
                        <Input
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm merriweather-regular text-gray-700">Email *</label>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Category and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm merriweather-regular text-gray-700">Category *</label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center gap-2">
                                  <category.icon className="w-4 h-4" />
                                  {category.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm merriweather-regular text-gray-700">Priority</label>
                        <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - General question</SelectItem>
                            <SelectItem value="medium">Medium - Need assistance</SelectItem>
                            <SelectItem value="high">High - Blocking issue</SelectItem>
                            <SelectItem value="urgent">Urgent - Service down</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <label className="text-sm merriweather-regular text-gray-700">Subject *</label>
                      <Input
                        placeholder="Brief summary of your issue"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        required
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label className="text-sm merriweather-regular text-gray-700">Message *</label>
                      <Textarea
                        placeholder="Please provide as much detail as possible about your issue..."
                        className="min-h-32"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Include steps to reproduce the issue, error messages, and what you expected to happen
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Support Request
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="merriweather-regular">Email Support</p>
                      <p className="text-sm text-gray-600">support@resyft.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="merriweather-regular">Response Time</p>
                      <p className="text-sm text-gray-600">Within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="merriweather-regular">Enterprise Support</p>
                      <p className="text-sm text-gray-600">Priority queue available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Help */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Help</CardTitle>
                  <CardDescription>
                    Common questions and answers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {commonQuestions.map((faq, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <h4 className="merriweather-regular text-sm text-gray-900 mb-1">{faq.question}</h4>
                      <p className="text-xs text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                  
                  <div className="pt-2">
                    <Link href="/#faq-section">
                      <Button variant="outline" size="sm" className="w-full">
                        <BookOpen className="w-4 h-4 mr-2" />
                        View All FAQs
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Status Alert */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>All Systems Operational</strong><br />
                  Resyft services are running smoothly with 99.9% uptime.
                </AlertDescription>
              </Alert>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}