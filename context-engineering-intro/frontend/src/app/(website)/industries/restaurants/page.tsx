import { Metadata } from 'next'
import { CheckCircle, Users, TrendingUp, Calendar, MessageSquare, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { images } from '@/lib/images'

export const metadata: Metadata = {
  title: 'Restaurant CRM | Senova',
  description: 'Senova CRM for restaurant businesses. Manage customer relationships, reservations, and grow your restaurant with our comprehensive CRM solution.',
}

export default function RestaurantsPage() {
  return (
    <>
      {/* Hero Section with Image */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={images.industries.restaurants.hero}
            alt="Modern restaurant interior"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              CRM for Restaurant Businesses
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Build lasting relationships with diners, streamline reservations, and grow your restaurant
              with Senova's comprehensive CRM solution designed specifically for the food service industry.
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
              Everything You Need to Manage Your Restaurant
            </h2>
            <dl className="mt-10 grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <Users className="h-5 w-5 flex-none text-primary" />
                  Customer Database
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Track dining preferences, allergies, special occasions, and build detailed customer profiles
                  to provide personalized service.
                </dd>
              </div>
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <Calendar className="h-5 w-5 flex-none text-primary" />
                  Reservation Management
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Streamline table bookings, manage waitlists, and send automated reservation confirmations
                  and reminders.
                </dd>
              </div>
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <MessageSquare className="h-5 w-5 flex-none text-primary" />
                  Marketing Automation
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Send targeted promotions, special event invitations, and loyalty program updates to keep
                  customers coming back.
                </dd>
              </div>
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <TrendingUp className="h-5 w-5 flex-none text-primary" />
                  Loyalty Programs
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Create and manage reward programs that encourage repeat visits and increase customer
                  lifetime value.
                </dd>
              </div>
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <BarChart3 className="h-5 w-5 flex-none text-primary" />
                  Analytics & Insights
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Track customer behavior, popular dishes, peak hours, and make data-driven decisions to
                  optimize operations.
                </dd>
              </div>
              <div className="relative">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <CheckCircle className="h-5 w-5 flex-none text-primary" />
                  Review Management
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Monitor and respond to online reviews, gather feedback, and maintain your restaurant's
                  reputation.
                </dd>
              </div>
            </dl>
          </div>

          {/* Image Gallery Section */}
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="relative h-64 overflow-hidden rounded-lg">
              <Image
                src={images.industries.restaurants.interior}
                alt="Restaurant interior design"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg">
              <Image
                src={images.industries.restaurants.dining}
                alt="Fine dining experience"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-64 overflow-hidden rounded-lg">
              <Image
                src={images.industries.restaurants.kitchen}
                alt="Professional kitchen"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-base font-semibold leading-7 text-primary">
              Trusted by restaurants worldwide
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Join thousands of restaurants using Senova
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