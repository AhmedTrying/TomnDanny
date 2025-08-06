"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react"
import { useSettings } from '@/lib/settings-context'

export default function ContactPage() {
  const settings = useSettings()
  const cafeName = settings?.cafe_name || 'Café'
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitted(true)
    setIsSubmitting(false)
    setFormData({ name: "", email: "", subject: "", message: "" })

    // Reset success message after 3 seconds
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-cream/90 backdrop-blur-sm border-b border-brand-caramel/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-brand-cream">&</span>
                </div>
                <span className="text-2xl font-bold text-brand-navy">{cafeName}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-brand-navy mb-6">Contact Us</h1>
          <p className="text-xl text-brand-medium-brown max-w-2xl mx-auto">
            We'd love to hear from you. Get in touch with us for any questions, feedback, or just to say hello!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-brand-navy mb-8">Get in Touch</h2>
              <div className="space-y-6">
                <Card className="bg-white border-brand-caramel/20">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <MapPin className="h-6 w-6 text-brand-caramel mt-1" />
                      <div>
                        <h3 className="font-semibold text-brand-navy mb-1">Location</h3>
                        <p className="text-brand-medium-brown">
                          Eco Botanic
                          <br />
                          Johor, Malaysia
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-brand-caramel/20">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Phone className="h-6 w-6 text-brand-caramel mt-1" />
                      <div>
                        <h3 className="font-semibold text-brand-navy mb-1">Phone</h3>
                        <p className="text-brand-medium-brown">+60129966238</p>
                        <p className="text-sm text-brand-medium-brown mt-1">Available during business hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-brand-caramel/20">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Mail className="h-6 w-6 text-brand-caramel mt-1" />
                      <div>
                        <h3 className="font-semibold text-brand-navy mb-1">Email</h3>
                        <p className="text-brand-medium-brown">tomndannycoffee@gmail.com</p>
                        <p className="text-sm text-brand-medium-brown mt-1">We'll respond within 24 hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-brand-caramel/20">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Clock className="h-6 w-6 text-brand-caramel mt-1" />
                      <div>
                        <h3 className="font-semibold text-brand-navy mb-1">Opening Hours</h3>
                        <div className="text-brand-medium-brown space-y-1">
                          <p>Monday - Friday: 6:00 AM - 10:00 PM</p>
                          <p>Saturday - Sunday: 7:00 AM - 11:00 PM</p>
                          <p className="text-sm mt-2">Extended hours on weekends</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Map Placeholder */}
            <Card className="bg-white border-brand-caramel/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-brand-navy mb-4">Find Us</h3>
                <div className="bg-brand-cream rounded-lg flex flex-col items-center justify-center" style={{ minHeight: '256px' }}>
                  <iframe
                    title="Tom&Danny Coffee @ Eco Botanic Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.624234964799!2d103.6189672!3d1.4380486!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da0bb70ecfdaad%3A0x4544ba73e60d6ff7!2sTom%26Danny%20Coffee%20@%20Eco%20Botanic!5e0!3m2!1sen!2smy!4v1718030000000!5m2!1sen!2smy"
                    width="100%"
                    height="256"
                    style={{ border: 0, borderRadius: '12px', minHeight: '256px', width: '100%' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                  <a
                    href="https://www.google.com/maps/place/Tom%26Danny+Coffee+@+Eco+Botanic/@1.4380486,103.6189672,17z/data=!3m1!4b1!4m6!3m5!1s0x31da0bb70ecfdaad:0x4544ba73e60d6ff7!8m2!3d1.4380486!4d103.6189672!16s%2Fg%2F11sx3s8xrp?entry=ttu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-center"
                  >
                    <MapPin className="h-8 w-8 text-brand-caramel mx-auto mb-2" />
                    <p className="text-brand-medium-brown font-semibold">Open in Google Maps</p>
                    <p className="text-sm text-brand-medium-brown">Tom&Danny Coffee @ Eco Botanic</p>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="bg-white border-brand-caramel/20 shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-brand-navy mb-6">Send us a Message</h2>

                {isSubmitted && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-green-700">Thank you! Your message has been sent successfully.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-brand-navy mb-2">
                        Full Name (Optional)
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="border-brand-caramel/30 focus:border-brand-caramel"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-brand-navy mb-2">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="border-brand-caramel/30 focus:border-brand-caramel"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-brand-navy mb-2">
                      Subject *
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="border-brand-caramel/30 focus:border-brand-caramel"
                      placeholder="What's this about?"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-brand-navy mb-2">
                      Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="border-brand-caramel/30 focus:border-brand-caramel"
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-brand-cream"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="bg-white border-brand-caramel/20 mt-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-brand-navy mb-3">Quick Questions?</h3>
                <p className="text-sm text-brand-medium-brown mb-4">
                  For immediate assistance, you can also reach us through:
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-brand-medium-brown">
                    <strong>WhatsApp:</strong> +60129966238
                  </p>
                  <p className="text-brand-medium-brown">
                    <strong>Instagram:</strong> @tommdannycafe
                  </p>
                  <p className="text-brand-medium-brown">
                    <strong>Facebook:</strong> Tomm&Danny Café
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
