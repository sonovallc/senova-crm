import { Metadata } from 'next'
import { CheckCircle, Users, TrendingUp, ShoppingBag, MessageSquare, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { images } from '@/lib/images'

export const metadata: Metadata = {
  title: 'Retail CRM | Senova',
  description: 'Senova CRM for retail businesses. Manage customer relationships, inventory, and sales with our comprehensive retail CRM solution.',
}

export default function RetailPage() {
  return (
    <>
      {/* Hero Section with Image */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={images.industries.retail.hero}
            alt="Modern retail store"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            CRM for Retail Businesses
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Transform your retail operations with Senova's CRM. Build customer loyalty, optimize inventory,
            and drive sales growth with data-driven insights and automation.
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
            Everything You Need to Succeed in Retail
          </h2>
          <dl className="mt-10 grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <Users className="h-5 w-5 flex-none text-primary" />
                Customer Profiles
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Build comprehensive customer profiles with purchase history, preferences, and engagement
                data for personalized experiences.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <ShoppingBag className="h-5 w-5 flex-none text-primary" />
                Purchase Tracking
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Monitor buying patterns, track product preferences, and identify upsell opportunities
                across all channels.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <MessageSquare className="h-5 w-5 flex-none text-primary" />
                Marketing Campaigns
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Create targeted promotions, seasonal campaigns, and personalized offers based on customer
                behavior and preferences.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <TrendingUp className="h-5 w-5 flex-none text-primary" />
                Loyalty Programs
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Design and manage reward programs that drive repeat purchases and increase customer
                lifetime value.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <BarChart3 className="h-5 w-5 flex-none text-primary" />
                Sales Analytics
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Track sales performance, analyze trends, and make data-driven decisions to optimize
                inventory and pricing.
              </dd>
            </div>
            <div className="relative">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                <CheckCircle className="h-5 w-5 flex-none text-primary" />
                Omnichannel Support
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                Unify customer data across online and offline channels for a seamless shopping experience
                everywhere.
              </dd>
            </div>
          </dl>
        </div>

        {/* Image Gallery Section */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="relative h-64 overflow-hidden rounded-lg">
            <Image
              src={images.industries.retail.store}
              alt="Retail store interior"
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="relative h-64 overflow-hidden rounded-lg">
            <Image
              src={images.industries.retail.ecommerce}
              alt="E-commerce integration"
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="relative h-64 overflow-hidden rounded-lg">
            <Image
              src={images.industries.retail.shopping}
              alt="Customer shopping experience"
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-base font-semibold leading-7 text-primary">
            Trusted by retailers worldwide
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Join thousands of retail businesses using Senova
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