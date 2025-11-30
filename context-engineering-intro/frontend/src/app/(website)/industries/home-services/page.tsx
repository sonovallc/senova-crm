import { Metadata } from 'next'
import { Wrench, Clock, Users, Calendar, MessageSquare, TrendingUp, MapPin, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { images } from '@/lib/images'

export const metadata: Metadata = {
  title: 'Home Services CRM | Senova',
  description: 'Senova CRM for home service businesses. Manage service calls, scheduling, and customer relationships with our comprehensive CRM solution.',
}

export default function HomeServicesPage() {
  return (
    <>
      {/* Hero Section with Image */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={images.industries.homeServices.hero}
            alt="Professional contractor at work"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              CRM for Home Service Businesses
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Streamline your operations, manage service calls efficiently, and build lasting customer
              relationships with Senova's CRM solution designed for home service professionals.
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
              Built for Home Service Professionals
            </h2>
            <dl className="mt-10 grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <Calendar className="h-5 w-5 flex-none text-primary" />
                  Service Scheduling
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Optimize route planning, manage technician schedules, and reduce travel time with intelligent
                  scheduling tools.
                </dd>
              </div>
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <Users className="h-5 w-5 flex-none text-primary" />
                  Customer Management
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Track service history, equipment details, warranties, and maintenance schedules for every
                  customer property.
                </dd>
              </div>
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <MessageSquare className="h-5 w-5 flex-none text-primary" />
                  Automated Follow-ups
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Send appointment reminders, service follow-ups, and maintenance alerts automatically to
                  keep customers engaged.
                </dd>
              </div>
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <MapPin className="h-5 w-5 flex-none text-primary" />
                  Service Area Management
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Define service territories, optimize routes, and manage multiple locations from a single
                  dashboard.
                </dd>
              </div>
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <TrendingUp className="h-5 w-5 flex-none text-primary" />
                  Lead Tracking
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Convert more estimates into jobs with systematic lead follow-up and conversion tracking
                  tools.
                </dd>
              </div>
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <CheckCircle className="h-5 w-5 flex-none text-primary" />
                  Invoice & Payments
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Generate professional invoices, track payments, and manage service agreements all in one
                  place.
                </dd>
              </div>
            </dl>
          </div>

          {/* Service Types Section with Images */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8">
              Perfect for All Home Service Professionals
            </h3>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="relative group">
                <div className="relative h-64 overflow-hidden rounded-lg">
                  <Image
                    src={images.industries.homeServices.plumber}
                    alt="Professional plumber at work"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-xl font-bold">Plumbing Services</h4>
                    <p className="text-sm">Emergency repairs to installations</p>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="relative h-64 overflow-hidden rounded-lg">
                  <Image
                    src={images.industries.homeServices.electrician}
                    alt="Electrician working on panel"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-xl font-bold">Electrical Services</h4>
                    <p className="text-sm">Wiring, repairs, and upgrades</p>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="relative h-64 overflow-hidden rounded-lg">
                  <Image
                    src={images.industries.homeServices.contractor}
                    alt="General contractor on site"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-xl font-bold">HVAC & Contracting</h4>
                    <p className="text-sm">Installation and maintenance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-base font-semibold leading-7 text-primary">
              Trusted by service professionals
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Join thousands of home service businesses using Senova
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