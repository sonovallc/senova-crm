'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResponseGenerator } from '@/components/ai/response-generator'
import { SentimentAnalyzer } from '@/components/ai/sentiment-analyzer'

export default function AIPage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <h1 className="text-2xl font-bold">AI Tools</h1>
        <p className="text-sm text-muted-foreground">
          AI-powered features for customer engagement
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="response" className="space-y-6">
          <TabsList>
            <TabsTrigger value="response">Response Generator</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
            <TabsTrigger value="enrichment">Contact Enrichment</TabsTrigger>
          </TabsList>

          <TabsContent value="response" className="space-y-4">
            <ResponseGenerator />
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <SentimentAnalyzer />
          </TabsContent>

          <TabsContent value="enrichment" className="space-y-4">
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              <p>Contact enrichment tools coming soon...</p>
              <p className="mt-2 text-sm">View enrichment data in contact details</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
