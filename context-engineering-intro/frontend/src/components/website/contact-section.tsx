'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { formatErrorMessage } from '@/lib/error-handler'

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, 'Phone must be 10 digits')
    .optional()
    .or(z.literal('')),
  service_interests: z.array(z.string()).min(1, 'Please select at least one service'),
  message: z.string().optional(),
  preferred_contact: z.enum(['email', 'phone', 'text']),
})

type ContactFormData = z.infer<typeof contactSchema>

const services = [
  { value: 'crm-setup', label: 'CRM Setup' },
  { value: 'marketing-automation', label: 'Marketing Automation' },
  { value: 'website-integration', label: 'Website Integration' },
  { value: 'customer-analytics', label: 'Customer Analytics' },
  { value: 'email-campaigns', label: 'Email Campaigns' },
  { value: 'data-management', label: 'Data Management' },
  { value: 'training', label: 'Training & Support' },
  { value: 'custom-solutions', label: 'Custom Solutions' },
  { value: 'consultation', label: 'General Consultation' },
  { value: 'other', label: 'Other' },
]

const contactInfo = [
  {
    icon: MapPin,
    title: 'Location',
    details: ['8 The Green #21994', 'Dover, DE 19901'],
  },
  {
    icon: Mail,
    title: 'Email',
    details: ['info@senovallc.com', 'support@senovallc.com'],
  },
  {
    icon: Clock,
    title: 'Response Time',
    details: ['We respond within 24 hours', 'Monday - Friday'],
  },
]

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      preferred_contact: 'email',
      service_interests: [],
    },
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      // Create contact in CRM
      await api.post('/v1/contacts/', {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        status: 'lead',
        source: 'website_contact_form',
        custom_fields: {
          service_interests: data.service_interests.join(', '),
          preferred_contact: data.preferred_contact,
          initial_message: data.message,
        },
      })

      setIsSuccess(true)
      reset()

      toast({
        title: 'Message sent successfully!',
        description: "We'll get back to you within 24 hours.",
      })

      // Reset success state after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (error: any) {
      toast({
        title: 'Error sending message',
        description: formatErrorMessage(error) || 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const serviceInterests = watch('service_interests')
  const preferredContact = watch('preferred_contact')

  const toggleService = (serviceValue: string) => {
    const current = serviceInterests || []
    if (current.includes(serviceValue)) {
      setValue('service_interests', current.filter((s) => s !== serviceValue))
    } else {
      setValue('service_interests', [...current, serviceValue])
    }
  }

  return (
    <section id="contact" className="bg-gradient-to-b from-white to-slate-50 pt-32 pb-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Book Your Consultation
          </h2>
          <p className="text-lg text-slate-600">
            Ready to transform your beauty routine? Get in touch to schedule your free consultation.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we&apos;ll respond within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSuccess ? (
                  <motion.div
                    className="flex flex-col items-center justify-center py-12 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
                    <h3 className="mb-2 text-xl font-semibold text-slate-900">
                      Thank you for reaching out!
                    </h3>
                    <p className="text-slate-600">
                      We&apos;ve received your message and will get back to you within 24 hours.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Input
                          {...register('first_name')}
                          placeholder="First Name *"
                          className={errors.first_name ? 'border-red-500' : ''}
                        />
                        {errors.first_name && (
                          <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          {...register('last_name')}
                          placeholder="Last Name *"
                          className={errors.last_name ? 'border-red-500' : ''}
                        />
                        {errors.last_name && (
                          <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <Input
                        {...register('email')}
                        type="email"
                        placeholder="Email Address *"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <Input
                        {...register('phone')}
                        type="tel"
                        placeholder="Phone Number (10 digits)"
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* Service Interests */}
                    <div>
                      <label className="mb-3 block text-sm font-medium text-slate-700">
                        Services of Interest *
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {services.map((service) => (
                          <div
                            key={service.value}
                            className="flex items-center space-x-2 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                          >
                            <Checkbox
                              id={service.value}
                              checked={serviceInterests?.includes(service.value)}
                              onCheckedChange={() => toggleService(service.value)}
                            />
                            <label
                              htmlFor={service.value}
                              className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {service.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      {errors.service_interests && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.service_interests.message}
                        </p>
                      )}
                    </div>

                    {/* Preferred Contact Method */}
                    <div>
                      <Select
                        value={preferredContact}
                        onValueChange={(value) =>
                          setValue('preferred_contact', value as 'email' | 'phone' | 'text')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Preferred Contact Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="text">Text Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Message */}
                    <div>
                      <Textarea
                        {...register('message')}
                        placeholder="Tell us about your goals and any questions you have..."
                        rows={4}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-slate-500">
                      By submitting this form, you agree to receive communications from Senova.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="border-0 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-slate-900">{info.title}</h3>
                      {info.details.map((detail) => (
                        <p key={detail} className="text-sm text-slate-600">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Map */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <iframe
                src="https://maps.google.com/maps?q=8%20The%20Green,%20Dover,%20DE%2019901&output=embed"
                width="100%"
                height="256"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Senova Location"
                className="h-64"
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
