'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Award,
  Users,
  Heart,
  Sparkles,
  Target,
  Shield,
  GraduationCap,
  UserCheck,
  Building2,
  TrendingUp,
  Code,
  Rocket,
  Brain,
  Lock,
} from 'lucide-react'
import { motion } from 'framer-motion'

const stats = [
  { icon: Users, value: 'Growing', label: 'Customer Base' },
  { icon: Code, value: 'Modern', label: 'Tech Stack' },
  { icon: Shield, value: 'GDPR', label: 'GDPR Compliant' },
  { icon: Lock, value: 'Secure', label: 'Data Protected' },
]

const coreValues = [
  {
    icon: Award,
    title: 'Innovation',
    description: 'We leverage cutting-edge technology to solve complex problems. Our platform uses advanced AI and machine learning to deliver unprecedented insights.',
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Your data security is paramount. We maintain GDPR compliance, use bank-level encryption, and follow industry best practices to protect sensitive information.',
  },
  {
    icon: Brain,
    title: 'Intelligence',
    description: 'We believe in data-driven decisions. Our audience intelligence platform helps you understand your customers better than ever before.',
  },
  {
    icon: UserCheck,
    title: 'Customer Success',
    description: 'Your success is our success. We provide dedicated support, comprehensive training, and continuous platform improvements based on your feedback.',
  },
  {
    icon: Rocket,
    title: 'Growth',
    description: 'We help businesses scale efficiently. Our platform grows with you, from single location to enterprise, without missing a beat.',
  },
]

const whyChooseUs = [
  {
    icon: Code,
    title: 'Modern Technology',
    description: 'Built with the latest cloud technologies for speed, reliability, and scalability.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Advanced machine learning algorithms provide predictive analytics and actionable insights.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, GDPR compliance, and enterprise security frameworks keep your data safe.',
  },
  {
    icon: Building2,
    title: 'Scalable Architecture',
    description: 'Cloud-native infrastructure that scales seamlessly from startup to enterprise.',
  },
  {
    icon: Target,
    title: 'Industry Expertise',
    description: 'Purpose-built for growing businesses with deep understanding of industry needs.',
  },
  {
    icon: TrendingUp,
    title: 'Continuous Innovation',
    description: 'Regular updates with new features based on customer feedback and industry trends.',
  },
]

export function AboutSection() {
  return (
    <section id="about" className="bg-white pt-32 pb-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-4 bg-primary/10 text-primary" variant="outline">
            About Us
          </Badge>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            About Senova
          </h2>
          <p className="text-lg text-slate-600">
            A modern technology company building the future of CRM and audience intelligence for growing businesses.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          className="mx-auto mt-8 max-w-4xl border-l-4 border-primary bg-slate-50 p-8"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <h3 className="mb-4 text-2xl font-bold text-slate-900">Our Mission</h3>
            <p className="text-lg leading-relaxed text-slate-700">
              At Senova, we're transforming how businesses manage their operations and understand their customers.
              We combine cutting-edge technology with deep industry knowledge to deliver solutions that drive real growth.
            </p>
          </div>
        </motion.div>

        {/* Stats - Sharp Edges Design */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="border-2 border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center border-2 border-primary/20 bg-primary/5">
                    <stat.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900">{stat.value}</div>
                  <div className="mt-1 text-sm font-medium text-slate-600">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Our Story */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="mb-6 text-3xl font-bold text-slate-900">Our Story</h3>
            <div className="space-y-4 text-lg leading-relaxed text-slate-600">
              <p>
                Senova was founded with a simple vision: to bring modern, intelligent technology to growing
                businesses. We saw companies struggling with outdated systems, disconnected tools, and
                lack of actionable insights.
              </p>
              <p>
                Today, we're building a comprehensive platform that combines CRM, audience intelligence, and
                marketing automation in one seamless solution. Our technology helps businesses understand their
                customers better, optimize their operations, and grow with confidence.
              </p>
              <p>
                As a young, innovative company, we bring fresh perspectives and cutting-edge technology to an
                industry ready for transformation. We're not bound by legacy systems or outdated approaches –
                we're building the future from the ground up.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Core Values - With Icons */}
        <div className="mt-8">
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold text-slate-900">Our Core Values</h3>
            <p className="mt-2 text-slate-600">The principles that guide everything we do</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-2 border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-primary/20 bg-primary/5">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="mb-3 text-xl font-semibold text-slate-900">{value.title}</h4>
                    <p className="text-slate-600">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="mb-6 text-3xl font-bold text-slate-900">Built With Modern Technology</h3>
            <p className="text-lg leading-relaxed text-slate-600">
              We use cutting-edge technology to deliver a fast, reliable, and scalable platform. Our infrastructure
              is built on cloud-native architecture with advanced security, comprehensive analytics, and AI-powered features
              that help you stay ahead of the competition.
            </p>
          </div>
        </motion.div>

        {/* Why Choose Us */}
        <div className="mt-8">
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold text-slate-900">Why Choose Senova</h3>
            <p className="mt-2 text-slate-600">What sets us apart from legacy systems</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {whyChooseUs.map((reason, index) => (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-2 border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-primary/20 bg-primary/5">
                      <reason.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="mb-2 text-lg font-semibold text-slate-900">{reason.title}</h4>
                    <p className="text-sm text-slate-600">{reason.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Vision Statement */}
        <motion.div
          className="mx-auto mt-8 max-w-4xl border-t-4 border-primary bg-gradient-to-br from-slate-50 to-white p-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <h3 className="mb-4 text-2xl font-bold text-slate-900">Our Vision</h3>
            <p className="text-lg leading-relaxed text-slate-700">
              To become the leading CRM and audience intelligence platform for growing businesses, empowering
              companies with the tools and insights they need to deliver exceptional customer experiences and
              achieve sustainable growth.
            </p>
          </div>
        </motion.div>

        {/* Join Us CTA */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="mb-6 text-3xl font-bold text-slate-900">Join the Revolution</h3>
            <p className="text-lg leading-relaxed text-slate-600 mb-8">
              Be part of the transformation. Join forward-thinking businesses that are using Senova to
              modernize their operations and accelerate their growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary text-white hover:bg-primary/90"
                asChild
              >
                <a href="/contact">Book Consultation</a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white"
                asChild
              >
                <a href="/contact">Contact Sales</a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}