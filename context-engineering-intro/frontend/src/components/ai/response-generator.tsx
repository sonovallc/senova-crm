'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiApi } from '@/lib/queries/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Brain, Copy, Check } from 'lucide-react'

export function ResponseGenerator() {
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState('professional')
  const [response, setResponse] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateMutation = useMutation({
    mutationFn: () =>
      aiApi.generateResponse({
        message,
        tone,
        max_length: 300,
      }),
    onSuccess: (data) => {
      setResponse(data)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate response',
        variant: 'destructive',
      })
    },
  })

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response.response_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Response Generator</CardTitle>
          <CardDescription>Generate contextual responses to customer messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Customer Message</Label>
            <Input
              id="message"
              placeholder="Enter customer message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Response Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!message || generateMutation.isPending}
            className="w-full"
          >
            <Brain className="mr-2 h-4 w-4" />
            {generateMutation.isPending ? 'Generating...' : 'Generate Response'}
          </Button>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Response</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={response.requires_human_review ? 'destructive' : 'default'}>
                  Confidence: {(response.confidence_score * 100).toFixed(0)}%
                </Badge>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="whitespace-pre-wrap">{response.response_text}</p>
            </div>

            {response.suggested_actions && response.suggested_actions.length > 0 && (
              <div className="space-y-2">
                <Label>Suggested Actions</Label>
                <div className="flex flex-wrap gap-2">
                  {response.suggested_actions.map((action: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {response.requires_human_review && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  ⚠️ This response requires human review before sending
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
