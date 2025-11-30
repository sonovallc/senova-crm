import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Mail, Newspaper } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Press & Media | Senova',
  description: 'Latest news, press releases, and media resources from Senova CRM.',
}

export default function PressPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-senova-gray-100/20">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-48 w-96 h-96 bg-senova-primary rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 -right-48 w-96 h-96 bg-senova-accent rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl mb-6 bg-gradient-to-r from-senova-primary to-senova-primary-light bg-clip-text text-transparent">
              Press & Media
            </h1>
            <p className="text-xl text-senova-gray-600 mb-8 font-body">
              Stay updated with the latest news and announcements from Senova
            </p>
          </div>
        </div>
      </section>

      {/* Press Resources */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Press Kit */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-senova-accent to-senova-success rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-senova-dark" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-3">Press Kit</h3>
              <p className="text-senova-gray-600 font-body mb-4">
                Download our press kit with logos, brand guidelines, and company information.
              </p>
              <span className="text-sm text-senova-gray-500 font-body">Coming Soon</span>
            </div>

            {/* News & Updates */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-senova-accent to-senova-success rounded-lg flex items-center justify-center mb-4">
                <Newspaper className="h-6 w-6 text-senova-dark" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-3">Latest News</h3>
              <p className="text-senova-gray-600 font-body mb-4">
                Read our latest press releases and company announcements.
              </p>
              <span className="text-sm text-senova-gray-500 font-body">Coming Soon</span>
            </div>

            {/* Media Contact */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-senova-accent to-senova-success rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-senova-dark" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-3">Media Inquiries</h3>
              <p className="text-senova-gray-600 font-body mb-4">
                For press inquiries, please contact our media relations team.
              </p>
              <a href="mailto:press@senovallc.com" className="text-senova-primary hover:text-senova-primary-dark font-semibold">
                press@senovallc.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-gradient-to-br from-senova-primary to-senova-primary-light rounded-3xl p-12 text-center text-white">
            <h2 className="font-display font-bold text-3xl mb-4">Stay Informed</h2>
            <p className="text-lg mb-8 opacity-90 font-body max-w-2xl mx-auto">
              Subscribe to receive press releases and company updates directly to your inbox.
            </p>
            <Button
              size="lg"
              className="bg-white text-senova-primary hover:bg-senova-gray-100 font-semibold"
              asChild
            >
              <Link href="/contact">
                Subscribe to Updates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}