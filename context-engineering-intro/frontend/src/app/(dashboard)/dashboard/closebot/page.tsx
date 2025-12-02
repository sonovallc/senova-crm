'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bot,
  Brain,
  Mail,
  MessageCircle,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart,
  Settings,
  Sparkles,
  Target,
  Zap
} from 'lucide-react'

export default function ClosebotPage() {
  const [isEnabled, setIsEnabled] = useState(false)

  // Mock data for demonstration
  const stats = {
    totalConversations: 1248,
    activeConversations: 42,
    resolvedToday: 28,
    avgResponseTime: '1.2 min',
    satisfactionScore: 94,
    conversionRate: 23
  }

  const recentConversations = [
    { id: 1, customer: 'Customer #1247', status: 'active', topic: 'Product inquiry', time: '2 min ago' },
    { id: 2, customer: 'Customer #1246', status: 'resolved', topic: 'Appointment booking', time: '15 min ago' },
    { id: 3, customer: 'Customer #1245', status: 'active', topic: 'Service pricing', time: '1 hour ago' },
    { id: 4, customer: 'Customer #1244', status: 'pending', topic: 'Technical support', time: '2 hours ago' }
  ]

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-senova-gray-50 via-white to-senova-primary-light/5">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-senova-primary to-senova-primary-dark flex items-center justify-center shadow-lg">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-senova-gray-900 flex items-center gap-2">
                CloseBot AI
                <Badge variant="secondary" className="bg-senova-info/10 text-senova-info">
                  Beta
                </Badge>
              </h1>
              <p className="text-sm text-senova-gray-500">
                AI-powered conversation management and automation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-senova-primary text-senova-primary hover:bg-senova-primary/10">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            <Button
              className={`${isEnabled ? 'bg-senova-success hover:bg-senova-success/90' : 'bg-senova-primary hover:bg-senova-primary/90'} text-white`}
              onClick={() => setIsEnabled(!isEnabled)}
            >
              <Zap className="h-4 w-4 mr-2" />
              {isEnabled ? 'Active' : 'Activate'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Conversations</CardDescription>
                <CardTitle className="text-2xl">{stats.totalConversations.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-senova-success animate-pulse" />
                  Active Now
                </CardDescription>
                <CardTitle className="text-2xl">{stats.activeConversations}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Resolved Today</CardDescription>
                <CardTitle className="text-2xl">{stats.resolvedToday}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Avg Response</CardDescription>
                <CardTitle className="text-2xl">{stats.avgResponseTime}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Satisfaction</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-1">
                  {stats.satisfactionScore}%
                  <TrendingUp className="h-4 w-4 text-senova-success" />
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Conversion Rate</CardDescription>
                <CardTitle className="text-2xl">{stats.conversionRate}%</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="conversations" className="space-y-4">
            <TabsList className="bg-white/80 backdrop-blur-sm shadow-md">
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            {/* Conversations Tab */}
            <TabsContent value="conversations">
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-senova-primary" />
                    Recent Conversations
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage AI-powered customer interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentConversations.map((conv) => (
                      <div key={conv.id} className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-senova-primary-light flex items-center justify-center">
                            <Users className="h-5 w-5 text-senova-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{conv.customer}</h4>
                            <p className="text-xs text-senova-gray-500">{conv.topic}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={conv.status === 'active' ? 'default' : conv.status === 'resolved' ? 'secondary' : 'outline'}
                            className={
                              conv.status === 'active' ? 'bg-senova-success/10 text-senova-success border-senova-success' :
                              conv.status === 'resolved' ? 'bg-senova-gray-100' :
                              ''
                            }
                          >
                            {conv.status}
                          </Badge>
                          <span className="text-xs text-senova-gray-400">{conv.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance">
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-senova-primary" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Track CloseBot AI effectiveness and engagement rates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Response Accuracy</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Customer Satisfaction</span>
                        <span className="font-medium">94%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Automation Rate</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>First Contact Resolution</span>
                        <span className="font-medium">86%</span>
                      </div>
                      <Progress value={86} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation">
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-senova-primary" />
                    Automation Rules
                  </CardTitle>
                  <CardDescription>
                    Configure intelligent automation workflows and triggers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border bg-senova-primary-light/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="h-5 w-5 text-senova-primary" />
                        <h4 className="font-medium">Auto-Reply to Inquiries</h4>
                      </div>
                      <p className="text-sm text-senova-gray-500 mb-3">
                        Automatically respond to new customer inquiries within 2 minutes
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-senova-success/10 text-senova-success">Active</Badge>
                        <span className="text-xs text-senova-gray-400">238 responses this week</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-senova-info-light/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="h-5 w-5 text-senova-info" />
                        <h4 className="font-medium">Lead Qualification</h4>
                      </div>
                      <p className="text-sm text-senova-gray-500 mb-3">
                        Qualify leads based on conversation context and intent
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-senova-success/10 text-senova-success">Active</Badge>
                        <span className="text-xs text-senova-gray-400">45 qualified leads this week</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-5 w-5 text-senova-warning" />
                        <h4 className="font-medium">Follow-up Sequences</h4>
                      </div>
                      <p className="text-sm text-senova-gray-500 mb-3">
                        Send automated follow-ups for unresponsive leads
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Configured</Badge>
                        <span className="text-xs text-senova-gray-400">12 sequences active</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights">
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-senova-primary" />
                    AI-Generated Insights
                  </CardTitle>
                  <CardDescription>
                    Smart recommendations based on conversation analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-senova-primary-light/20 to-senova-info-light/20 border border-senova-primary/20">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-senova-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">Trending Topics</h4>
                          <p className="text-sm text-senova-gray-600">
                            Customers are increasingly asking about "express shipping" (+42% this week). Consider updating your FAQ or creating an automated response.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-senova-success-light/20 to-senova-primary-light/20 border border-senova-success/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-senova-success mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">Performance Insight</h4>
                          <p className="text-sm text-senova-gray-600">
                            Your response time has improved by 35% with CloseBot. Customer satisfaction is highest when responses are sent within 90 seconds.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-senova-warning-light/20 to-senova-info-light/20 border border-senova-warning/20">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-senova-warning mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">Optimization Opportunity</h4>
                          <p className="text-sm text-senova-gray-600">
                            15% of conversations require human intervention for pricing questions. Training the AI with your pricing structure could reduce this by 80%.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}