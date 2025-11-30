import { Metadata } from 'next'
import { CheckCircle, Users, Eye, Target, TrendingUp, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Visitor Identification | Senova',
  description: 'Identify anonymous website visitors and convert them into customers. Track visitor behavior, capture leads, and personalize experiences.',
}

export default function VisitorIdentificationPage() {
  return (
    <section className="pt-32 pb-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Turn Anonymous Visitors into Known Customers
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Identify who's visiting your website, understand their behavior, and engage them with
            personalized experiences that drive conversions.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                See It In Action
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <h2 className="text-2xl font-bold tracking-tight">
            Know Your Visitors, Grow Your Business
          </h2>
          <dl className="mt-10 grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <Eye className="h-5 w-5 flex-none text-primary" />
                Real-Time Identification
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Instantly identify visitors as they browse your site, capturing valuable data about
                their interests and intent.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <Users className="h-5 w-5 flex-none text-primary" />
                Company & Contact Insights
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Reveal company information, contact details, and social profiles of your website
                visitors automatically.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <Target className="h-5 w-5 flex-none text-primary" />
                Behavior Tracking
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Monitor page views, time on site, and content engagement to understand visitor
                interests and buying signals.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <TrendingUp className="h-5 w-5 flex-none text-primary" />
                Lead Scoring
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Automatically score and prioritize leads based on their behavior, demographics, and
                engagement level.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <CheckCircle className="h-5 w-5 flex-none text-primary" />
                Personalized Experiences
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Deliver targeted content, offers, and messaging based on visitor profiles and behavior
                patterns.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <Shield className="h-5 w-5 flex-none text-primary" />
                Privacy Compliant
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                GDPR and CCPA compliant visitor tracking that respects privacy while providing valuable
                insights.
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            How Visitor Identification Works
          </h2>
          <ol className="space-y-4">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold mr-3">
                1
              </span>
              <div>
                <h3 className="font-semibold">Install Tracking Code</h3>
                <p className="text-gray-600 mt-1">
                  Add our lightweight JavaScript snippet to your website in minutes.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold mr-3">
                2
              </span>
              <div>
                <h3 className="font-semibold">Capture Visitor Data</h3>
                <p className="text-gray-600 mt-1">
                  Track visitor behavior, sources, and engagement across your site.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold mr-3">
                3
              </span>
              <div>
                <h3 className="font-semibold">Identify & Enrich</h3>
                <p className="text-gray-600 mt-1">
                  Match visitors to our database and enrich profiles with contact information.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold mr-3">
                4
              </span>
              <div>
                <h3 className="font-semibold">Engage & Convert</h3>
                <p className="text-gray-600 mt-1">
                  Reach out to high-value visitors with personalized outreach and offers.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="mt-16 text-center">
          <p className="text-base font-semibold leading-7 text-primary">
            Start identifying your visitors today
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Convert more visitors into customers
          </h2>
          <div className="mt-10">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}