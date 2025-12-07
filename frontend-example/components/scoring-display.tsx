"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Alert, AlertDescription } from "./ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  BarChart3,
  Clock,
  BookOpen,
  Users,
  Award,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Brain,
  FileText
} from "lucide-react"
import { 
  RelevanceScore, 
  AccuracyScore, 
  getScoreColor, 
  getScoreLabel,
  getConfidenceIcon 
} from "../lib/scoring"

interface ScoringDisplayProps {
  relevanceScore: RelevanceScore
  accuracyScore: AccuracyScore
  compact?: boolean
}

export function ScoringDisplay({ 
  relevanceScore, 
  accuracyScore, 
  compact = false 
}: ScoringDisplayProps) {
  if (compact) {
    return <CompactScoreDisplay relevance={relevanceScore.overall} accuracy={accuracyScore.overall} />
  }

  return (
    <div className="space-y-6">
      {/* Overall Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Relevance Score
                </span>
                <span className="text-2xl playfair-bold" style={{ color: getScoreColor(relevanceScore.overall) }}>
                  {relevanceScore.overall}%
                </span>
              </CardTitle>
              <CardDescription>
                How well this paper aligns with your research
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={relevanceScore.overall} className="mb-3" />
              <div className="flex items-center justify-between">
                <Badge variant={relevanceScore.overall >= 70 ? "default" : relevanceScore.overall >= 40 ? "secondary" : "outline"}>
                  {getScoreLabel(relevanceScore.overall)}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span>{getConfidenceIcon(relevanceScore.confidence)}</span>
                  <span className="text-sm capitalize">{relevanceScore.confidence}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Quality Score
                </span>
                <span className="text-2xl playfair-bold" style={{ color: getScoreColor(accuracyScore.overall) }}>
                  {accuracyScore.overall}%
                </span>
              </CardTitle>
              <CardDescription>
                Research quality and methodological rigor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={accuracyScore.overall} className="mb-3" />
              <div className="flex items-center justify-between">
                <Badge variant={accuracyScore.overall >= 70 ? "default" : accuracyScore.overall >= 40 ? "secondary" : "outline"}>
                  {getScoreLabel(accuracyScore.overall)}
                </Badge>
                {accuracyScore.flags.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">{accuracyScore.flags.length} flags</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          {accuracyScore.flags.map((flag, index) => (
                            <p key={index} className="text-xs">{flag}</p>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs defaultValue="relevance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="relevance">Relevance Details</TabsTrigger>
            <TabsTrigger value="quality">Quality Details</TabsTrigger>
          </TabsList>

          <TabsContent value="relevance" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBreakdownItem
                  label="Topic Relevance"
                  score={relevanceScore.breakdown.topicRelevance}
                  icon={<Brain className="w-4 h-4" />}
                  description="Keyword and subject matter alignment"
                />
                <ScoreBreakdownItem
                  label="Methodology Alignment"
                  score={relevanceScore.breakdown.methodologicalAlignment}
                  icon={<FileText className="w-4 h-4" />}
                  description="Research approach compatibility"
                />
                <ScoreBreakdownItem
                  label="Temporal Relevance"
                  score={relevanceScore.breakdown.temporalRelevance}
                  icon={<Clock className="w-4 h-4" />}
                  description="Publication recency"
                />
                <ScoreBreakdownItem
                  label="Citation Impact"
                  score={relevanceScore.breakdown.citationImpact}
                  icon={<TrendingUp className="w-4 h-4" />}
                  description="Academic influence and citations"
                />
                <ScoreBreakdownItem
                  label="Journal Quality"
                  score={relevanceScore.breakdown.journalQuality}
                  icon={<BookOpen className="w-4 h-4" />}
                  description="Publication venue reputation"
                />
              </CardContent>
            </Card>

            {relevanceScore.explanation.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {relevanceScore.explanation.map((explanation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-700">{explanation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quality" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBreakdownItem
                  label="Statistical Rigor"
                  score={accuracyScore.breakdown.statisticalRigor}
                  icon={<BarChart3 className="w-4 h-4" />}
                  description="Statistical methods and significance"
                />
                <ScoreBreakdownItem
                  label="Sample Adequacy"
                  score={accuracyScore.breakdown.sampleAdequacy}
                  icon={<Users className="w-4 h-4" />}
                  description="Sample size and representativeness"
                />
                <ScoreBreakdownItem
                  label="Methodology Quality"
                  score={accuracyScore.breakdown.methodologyQuality}
                  icon={<Target className="w-4 h-4" />}
                  description="Research design and execution"
                />
                <ScoreBreakdownItem
                  label="Peer Review Status"
                  score={accuracyScore.breakdown.peerReview}
                  icon={<CheckCircle className="w-4 h-4" />}
                  description="Publication review process"
                />
                <ScoreBreakdownItem
                  label="Replication Potential"
                  score={accuracyScore.breakdown.replicationPotential}
                  icon={<Award className="w-4 h-4" />}
                  description="Reproducibility and transparency"
                />
              </CardContent>
            </Card>

            {accuracyScore.flags.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="merriweather-regular mb-2">Quality Concerns:</p>
                    {accuracyScore.flags.map((flag, index) => (
                      <p key={index} className="text-sm">{flag}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {accuracyScore.recommendations.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="space-y-1">
                    <p className="merriweather-regular mb-2">Recommendations:</p>
                    {accuracyScore.recommendations.map((rec, index) => (
                      <p key={index} className="text-sm">{rec}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

function ScoreBreakdownItem({ 
  label, 
  score, 
  icon, 
  description 
}: { 
  label: string
  score: number
  icon: React.ReactNode
  description: string 
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div className="text-gray-500">{icon}</div>
        <div className="flex-1">
          <p className="text-sm merriweather-regular">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={score} className="w-24" />
        <span className="text-sm merriweather-regular w-10 text-right" style={{ color: getScoreColor(score) }}>
          {score}%
        </span>
      </div>
    </div>
  )
}

function CompactScoreDisplay({ relevance, accuracy }: { relevance: number; accuracy: number }) {
  return (
    <div className="flex items-center gap-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <div className="flex items-center gap-1">
                <span className="text-sm merriweather-regular" style={{ color: getScoreColor(relevance) }}>
                  {relevance}%
                </span>
                <Progress value={relevance} className="w-16 h-2" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Relevance: {getScoreLabel(relevance)}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-500" />
              <div className="flex items-center gap-1">
                <span className="text-sm merriweather-regular" style={{ color: getScoreColor(accuracy) }}>
                  {accuracy}%
                </span>
                <Progress value={accuracy} className="w-16 h-2" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Quality: {getScoreLabel(accuracy)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}