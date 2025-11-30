'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiApi } from '@/lib/queries/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Smile, Meh, Frown } from 'lucide-react'

export function SentimentAnalyzer() {
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const analyzeMutation = useMutation({
    mutationFn: () => aiApi.analyzeSentiment(message),
    onSuccess: (data) => {
      setResult(data)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to analyze sentiment',
        variant: 'destructive',
      })
    },
  })

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="h-8 w-8 text-green-500" />
      case 'negative':
        return <Frown className="h-8 w-8 text-red-500" />
      default:
        return <Meh className="h-8 w-8 text-gray-500" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500'
      case 'negative':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Analysis</CardTitle>
          <CardDescription>Analyze the emotional tone of messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sentiment-message">Message</Label>
            <Input
              id="sentiment-message"
              placeholder="Enter message to analyze..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={!message || analyzeMutation.isPending}
            className="w-full"
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Sentiment'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getSentimentIcon(result.sentiment)}
                <div>
                  <h3 className="text-2xl font-bold capitalize">{result.sentiment}</h3>
                  <p className="text-sm text-muted-foreground">
                    Score: {result.score.toFixed(2)} | Confidence: {(result.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Score bar */}
            <div className="space-y-2">
              <Label>Sentiment Score</Label>
              <div className="relative h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`absolute h-full rounded-full ${getSentimentColor(result.sentiment)}`}
                  style={{
                    width: `${Math.abs(result.score) * 50}%`,
                    left: result.score >= 0 ? '50%' : 'auto',
                    right: result.score < 0 ? '50%' : 'auto',
                  }}
                />
                <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gray-400" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
              </div>
            </div>

            {/* Emotions */}
            {result.emotions && Object.keys(result.emotions).length > 0 && (
              <div className="space-y-2">
                <Label>Detected Emotions</Label>
                <div className="space-y-2">
                  {Object.entries(result.emotions).map(([emotion, score]: [string, any]) => (
                    <div key={emotion} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{emotion}</span>
                        <span className="text-muted-foreground">{(score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
