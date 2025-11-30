'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Save, Eye, EyeOff, Bot } from 'lucide-react'

export default function ClosebotSettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [autoReply, setAutoReply] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: 'Success',
      description: 'Closebot settings saved successfully',
    })
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6" />
              Closebot Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your Closebot AI assistant for automated customer interactions
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Connect your Closebot AI service with API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="closebot-api-key">Closebot API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="closebot-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Enter your Closebot API key..."
                    defaultValue=""
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from the Closebot dashboard
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closebot-endpoint">API Endpoint (Optional)</Label>
                <Input
                  id="closebot-endpoint"
                  type="text"
                  placeholder="https://api.closebot.ai/v1"
                  defaultValue="https://api.closebot.ai/v1"
                />
                <p className="text-xs text-muted-foreground">
                  Custom endpoint for enterprise deployments
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bot Behavior */}
          <Card>
            <CardHeader>
              <CardTitle>Bot Behavior</CardTitle>
              <CardDescription>
                Configure how Closebot interacts with your customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="closebot-enabled">Enable Closebot</Label>
                  <p className="text-xs text-muted-foreground">
                    Turn on AI-powered customer interactions
                  </p>
                </div>
                <Switch
                  id="closebot-enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-reply">Auto-Reply Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically send AI-generated responses
                  </p>
                </div>
                <Switch
                  id="auto-reply"
                  checked={autoReply}
                  onCheckedChange={setAutoReply}
                  disabled={!enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="response-tone">Response Tone</Label>
                <Select defaultValue="professional">
                  <SelectTrigger id="response-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response-length">Response Length</Label>
                <Select defaultValue="medium">
                  <SelectTrigger id="response-length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Custom Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Instructions</CardTitle>
              <CardDescription>
                Provide specific guidelines for how Closebot should respond
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  placeholder="You are a helpful beauty consultant for Senova..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Define the AI's role and personality
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="context-info">Business Context</Label>
                <Textarea
                  id="context-info"
                  placeholder="We specialize in premium beauty services including facials, massage therapy, and skincare..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Key information about your business for the AI to reference
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Fine-tune Closebot's performance and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Creativity Level (Temperature)</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.7"
                />
                <p className="text-xs text-muted-foreground">
                  Lower values (0.1-0.3) = More focused, Higher values (0.7-1.0) = More creative
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-tokens">Maximum Response Tokens</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min="50"
                  max="2000"
                  step="50"
                  defaultValue="500"
                />
                <p className="text-xs text-muted-foreground">
                  Control the maximum length of AI responses (50-2000 tokens)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use-context">Use Contact History</Label>
                  <p className="text-xs text-muted-foreground">
                    Include previous conversations in context
                  </p>
                </div>
                <Switch
                  id="use-context"
                  defaultChecked={true}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sentiment-analysis">Enable Sentiment Analysis</Label>
                  <p className="text-xs text-muted-foreground">
                    Analyze customer sentiment before responding
                  </p>
                </div>
                <Switch
                  id="sentiment-analysis"
                  defaultChecked={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} size="lg">
              <Save className="mr-2 h-4 w-4" />
              Save Closebot Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
