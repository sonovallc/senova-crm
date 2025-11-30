'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Bot, Sparkles, Mail, Brain, Target, TrendingUp } from 'lucide-react'

export default function ClosebotIntegrationPage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Closebot AI Integration</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Coming Soon
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Intelligent email automation powered by AI
            </p>
          </div>
          <Bot className="h-10 w-10 text-blue-600" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* About Closebot */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                About Closebot AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Closebot AI will automatically respond to customer emails with intelligent, context-aware replies.
                Our AI agent understands your business, learns from your communication style, and engages with
                customers in a natural, helpful way.
              </p>
            </CardContent>
          </Card>

          {/* Coming Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features Coming Soon</CardTitle>
              <CardDescription>
                Powerful AI capabilities to transform your email workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Auto-Response</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically reply to customer emails with intelligent, contextual responses
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                    <Brain className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Smart Follow-ups</h3>
                    <p className="text-sm text-muted-foreground">
                      Intelligent follow-up sequences that adapt based on customer engagement
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Sentiment Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Understand customer emotions and prioritize urgent or negative feedback
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Lead Qualification</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically identify and score high-quality leads from email interactions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                These settings will be available when the integration launches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="closebot-api-key" className="text-muted-foreground">
                  Closebot API Key
                </Label>
                <Input
                  id="closebot-api-key"
                  type="password"
                  placeholder="Your Closebot API key"
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  You&apos;ll receive your API key when you sign up for Closebot
                </p>
              </div>

              {/* Agent ID */}
              <div className="space-y-2">
                <Label htmlFor="closebot-agent-id" className="text-muted-foreground">
                  Agent ID
                </Label>
                <Input
                  id="closebot-agent-id"
                  placeholder="Your agent ID"
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your unique AI agent identifier
                </p>
              </div>

              {/* Auto-Response Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-auto-response" className="text-muted-foreground">
                    Enable Auto-Response
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically respond to incoming emails
                  </p>
                </div>
                <Switch id="enable-auto-response" disabled />
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button disabled className="bg-muted text-muted-foreground cursor-not-allowed">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Learn More */}
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-medium">Interested in Closebot AI?</h3>
                <p className="text-sm text-muted-foreground">
                  Learn more about how AI can transform your customer communications
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="#" className="cursor-not-allowed">
                  Learn More
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
