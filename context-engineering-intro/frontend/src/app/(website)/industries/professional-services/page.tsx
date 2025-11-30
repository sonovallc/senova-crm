import { Metadata } from 'next'
import { CheckCircle, Users, TrendingUp, Clock, MessageSquare, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { images } from '@/lib/images'

export const metadata: Metadata = {
  title: 'Professional Services CRM | Senova',
  description: 'Senova CRM for professional service firms. Manage clients, projects, and grow your practice with our comprehensive CRM solution.',
}

export default function ProfessionalServicesPage() {
  return (
    <>
      {/* Hero Section with Image */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={images.industries.professionalServices.hero}
            alt="Professional services office"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            CRM for Professional Service Firms
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Streamline client management, track projects, and scale your professional services firm
            with Senova's comprehensive CRM solution built for consultants, agencies, and service providers.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <h2 className="text-2xl font-bold tracking-tight">
            Designed for Professional Excellence
          </h2>
          <dl className="mt-10 grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <Users className="h-5 w-5 flex-none text-primary" />
                Client Management
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Maintain comprehensive client profiles, track engagement history, and manage relationships
                across your entire portfolio.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <FileText className="h-5 w-5 flex-none text-primary" />
                Project Tracking
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Monitor project progress, manage deliverables, and keep all stakeholders informed with
                real-time updates.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <Clock className="h-5 w-5 flex-none text-primary" />
                Time & Billing
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Track billable hours, generate invoices, and manage contracts with integrated time tracking
                and billing features.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <TrendingUp className="h-5 w-5 flex-none text-primary" />
                Pipeline Management
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Track opportunities from lead to close, forecast revenue, and optimize your business
                development process.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <MessageSquare className="h-5 w-5 flex-none text-primary" />
                Communication Hub
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Centralize all client communications, track interactions, and ensure nothing falls through
                the cracks.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <CheckCircle className="h-5 w-5 flex-none text-primary" />
                Document Management
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Store and organize proposals, contracts, and deliverables with secure document management
                and sharing.
              </dd>
            </div>
          </dl>
        </div>

        {/* Image Gallery Section */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="relative h-64 overflow-hidden rounded-lg">
            <Image
              src={images.industries.professionalServices.office}
              alt="Modern office space"
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="relative h-64 overflow-hidden rounded-lg">
            <Image
              src={images.industries.professionalServices.consulting}
              alt="Consulting meeting"
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="relative h-64 overflow-hidden rounded-lg">
            <Image
              src={images.industries.professionalServices.meeting}
              alt="Team collaboration"
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-base font-semibold leading-7 text-primary">
            Trusted by professional service firms
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Join thousands of professional firms using Senova
          </h2>
          <div className="mt-10">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}