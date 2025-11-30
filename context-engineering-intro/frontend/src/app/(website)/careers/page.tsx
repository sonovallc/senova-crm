import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Briefcase, Heart, TrendingUp, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Careers at Senova | Join Our Team',
  description: 'Build your career at Senova. Join a team that\'s revolutionizing customer acquisition for growing businesses.',
}

const values = [
  {
    icon: Heart,
    title: 'Customer-First Mindset',
    description: 'We believe in empowering businesses to deliver exceptional customer experiences.'
  },
  {
    icon: TrendingUp,
    title: 'Innovation & Growth',
    description: 'We\'re constantly pushing boundaries to deliver cutting-edge solutions.'
  },
  {
    icon: Users,
    title: 'Collaborative Culture',
    description: 'We work together, learn from each other, and celebrate wins as a team.'
  },
  {
    icon: Briefcase,
    title: 'Professional Development',
    description: 'We invest in our people with continuous learning and growth opportunities.'
  }
]

export default function CareersPage() {
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
              Join the Senova Team
            </h1>
            <p className="text-xl text-senova-gray-600 mb-8 font-body">
              Help us revolutionize customer acquisition for growing businesses worldwide.
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-senova-accent/10 rounded-full">
              <span className="text-sm font-medium text-senova-primary">Currently Building Our Team</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">Our Values</h2>
            <p className="text-lg text-senova-gray-600 font-body">What drives us every day</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-senova-accent to-senova-success rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-senova-dark" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">{value.title}</h3>
                <p className="text-senova-gray-600 font-body">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-gradient-to-br from-senova-primary to-senova-primary-light rounded-3xl p-12 text-center text-white">
            <h2 className="font-display font-bold text-3xl mb-4">Opportunities Coming Soon</h2>
            <p className="text-lg mb-8 opacity-90 font-body max-w-2xl mx-auto">
              We're building something extraordinary at Senova. Be among the first to know when we open new positions.
            </p>
            <Button
              size="lg"
              className="bg-white text-senova-primary hover:bg-senova-gray-100 font-semibold"
              asChild
            >
              <Link href="/contact">
                Get Notified
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}