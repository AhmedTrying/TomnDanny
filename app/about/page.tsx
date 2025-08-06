"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Award, Heart, Users, Leaf, Coffee, Star, MapPin } from "lucide-react"
import { useSettings } from '@/lib/settings-context'

export default function AboutPage() {
  const settings = useSettings();
  const cafeName = settings?.cafe_name || 'Café';

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-cream/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-caramel/20 shadow-sm">
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
        <div className="text-center mb-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-caramel/10 via-transparent to-brand-navy/10 rounded-3xl -z-10"></div>
          <div className="py-16">
            <div className="flex items-center justify-center mb-6">
              <Coffee className="h-12 w-12 text-brand-caramel mr-4 animate-pulse" />
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-brand-navy to-brand-dark-brown bg-clip-text text-transparent">
                About {cafeName}
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-brand-medium-brown max-w-4xl mx-auto leading-relaxed">
              Where passion meets perfection in every cup. Our journey began with a simple dream: to create the perfect
              coffee experience that brings people together.
            </p>
            <div className="flex items-center justify-center mt-8 space-x-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-brand-medium-brown font-medium">4.8/5 Customer Rating</span>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="w-1 h-12 bg-gradient-to-b from-brand-caramel to-brand-navy rounded-full mr-4"></div>
              <h2 className="text-4xl font-bold text-brand-navy">Our Story</h2>
            </div>
            <div className="space-y-6 text-brand-medium-brown text-lg leading-relaxed">
              <p className="relative pl-6">
                <span className="absolute left-0 top-2 w-2 h-2 bg-brand-caramel rounded-full"></span>
                Founded in 2020 by two coffee enthusiasts, Tom and Danny, our café was born from a shared vision of
                creating more than just a coffee shop. We wanted to build a community hub where exceptional coffee meets
                warm hospitality.
              </p>
              <p className="relative pl-6">
                <span className="absolute left-0 top-2 w-2 h-2 bg-brand-caramel rounded-full"></span>
                Located in the heart of Eco Botanic, Johor, we've been serving our community with carefully sourced
                beans, expertly crafted beverages, and freshly baked pastries. Every cup tells a story of dedication,
                quality, and the pursuit of coffee perfection.
              </p>
              <p className="relative pl-6">
                <span className="absolute left-0 top-2 w-2 h-2 bg-brand-caramel rounded-full"></span>
                Our commitment to excellence extends beyond our products to our innovative approach to service. We were
                among the first in the region to implement QR-based ordering, making your café experience seamless and
                enjoyable.
              </p>
            </div>
            <div className="flex items-center mt-8 p-4 bg-brand-cream/50 rounded-2xl">
              <MapPin className="h-6 w-6 text-brand-caramel mr-3" />
              <span className="text-brand-navy font-medium">Eco Botanic, Johor, Malaysia</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-caramel/20 to-brand-navy/20 rounded-3xl transform rotate-3"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-10 text-center shadow-xl border border-brand-caramel/20">
              <div className="w-40 h-40 bg-gradient-to-br from-brand-navy to-brand-dark-brown rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <span className="text-7xl font-bold text-brand-cream">&</span>
              </div>
              <h3 className="text-3xl font-bold text-brand-navy mb-4">Since 2020</h3>
              <p className="text-brand-medium-brown text-lg">Serving exceptional coffee with passion and innovation</p>
              <div className="mt-6 flex justify-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-caramel">4+</div>
                  <div className="text-sm text-brand-medium-brown">Years</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-caramel">1K+</div>
                  <div className="text-sm text-brand-medium-brown">Customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-navy mb-4">Our Values</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-brand-caramel to-brand-navy mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="group bg-white/80 backdrop-blur-sm border-brand-caramel/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:border-brand-caramel/40">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-caramel to-brand-caramel/70 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-brand-navy mb-3">Quality</h3>
                <p className="text-brand-medium-brown leading-relaxed">
                  We source only the finest beans and use expert brewing techniques to ensure every cup meets our high
                  standards.
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-white/80 backdrop-blur-sm border-brand-caramel/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:border-brand-caramel/40">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-brand-navy mb-3">Passion</h3>
                <p className="text-brand-medium-brown leading-relaxed">
                  Our love for coffee drives everything we do, from bean selection to the final pour in your cup.
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-white/80 backdrop-blur-sm border-brand-caramel/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:border-brand-caramel/40">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-brand-navy mb-3">Community</h3>
                <p className="text-brand-medium-brown leading-relaxed">
                  We believe in creating connections and fostering relationships within our local community.
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-white/80 backdrop-blur-sm border-brand-caramel/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:border-brand-caramel/40">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Leaf className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-brand-navy mb-3">Sustainability</h3>
                <p className="text-brand-medium-brown leading-relaxed">
                  We're committed to ethical sourcing and environmentally responsible practices in all we do.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-navy mb-4">Meet Our Founders</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-brand-caramel to-brand-navy mx-auto rounded-full"></div>
            <p className="text-lg text-brand-medium-brown mt-6 max-w-2xl mx-auto">
              The passionate duo behind every perfect cup and memorable experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Card className="group bg-white/80 backdrop-blur-sm border-brand-caramel/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
              <CardContent className="p-10 text-center relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-caramel to-brand-navy"></div>
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-brand-navy to-brand-dark-brown rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl font-bold text-brand-cream">T</span>
                  </div>
                  <h3 className="text-2xl font-bold text-brand-navy mb-2">Tom Anderson</h3>
                  <p className="text-brand-caramel font-semibold mb-4 text-lg">Co-Founder & Head Roaster</p>
                  <p className="text-brand-medium-brown leading-relaxed">
                    With over 15 years in the coffee industry, Tom brings expertise in bean sourcing and roasting
                    techniques that create our signature flavors.
                  </p>
                  <div className="mt-6 flex justify-center space-x-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-brand-caramel">15+</div>
                      <div className="text-xs text-brand-medium-brown">Years Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-brand-caramel">50+</div>
                      <div className="text-xs text-brand-medium-brown">Bean Varieties</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group bg-white/80 backdrop-blur-sm border-brand-caramel/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden">
              <CardContent className="p-10 text-center relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-navy to-brand-caramel"></div>
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-brand-caramel to-brand-dark-brown rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl font-bold text-brand-cream">D</span>
                  </div>
                  <h3 className="text-2xl font-bold text-brand-navy mb-2">Danny Chen</h3>
                  <p className="text-brand-caramel font-semibold mb-4 text-lg">Co-Founder & Operations Director</p>
                  <p className="text-brand-medium-brown leading-relaxed">
                    Danny's background in hospitality and technology innovation drives our commitment to exceptional
                    service and cutting-edge café experiences.
                  </p>
                  <div className="mt-6 flex justify-center space-x-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-brand-caramel">10+</div>
                      <div className="text-xs text-brand-medium-brown">Years Hospitality</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-brand-caramel">5+</div>
                      <div className="text-xs text-brand-medium-brown">Tech Innovations</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="relative mb-20">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/5 via-brand-caramel/5 to-brand-navy/5 rounded-3xl"></div>
          <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-brand-caramel/20 shadow-xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-brand-navy mb-4">Our Impact</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-brand-caramel to-brand-navy mx-auto rounded-full"></div>
              <p className="text-lg text-brand-medium-brown mt-6">Numbers that tell our story of growth and excellence</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-caramel to-brand-caramel/70 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Coffee className="h-10 w-10 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-brand-navy to-brand-caramel bg-clip-text text-transparent mb-2">150K+</div>
                <p className="text-brand-medium-brown font-medium">Cups Served</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-brand-navy to-brand-caramel bg-clip-text text-transparent mb-2">1K+</div>
                <p className="text-brand-medium-brown font-medium">Happy Customers</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-10 w-10 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-brand-navy to-brand-caramel bg-clip-text text-transparent mb-2">50+</div>
                <p className="text-brand-medium-brown font-medium">Menu Items</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-10 w-10 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-brand-navy to-brand-caramel bg-clip-text text-transparent mb-2">4.8</div>
                <p className="text-brand-medium-brown font-medium">Average Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy/10 via-brand-caramel/10 to-brand-navy/10 rounded-3xl"></div>
          <div className="relative text-center py-16 px-8">
            <div className="flex items-center justify-center mb-6">
              <Coffee className="h-12 w-12 text-brand-caramel mr-4 animate-pulse" />
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-navy to-brand-dark-brown bg-clip-text text-transparent">
                Experience the Difference
              </h2>
            </div>
            <p className="text-xl text-brand-medium-brown mb-10 max-w-3xl mx-auto leading-relaxed">
              Join us for an unforgettable coffee experience. Whether you're here for a quick espresso or a leisurely
              afternoon with friends, we're here to make every moment special.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/menu">
                <Button size="lg" className="group bg-gradient-to-r from-brand-dark-brown to-brand-navy hover:from-brand-navy hover:to-brand-dark-brown text-brand-cream px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Coffee className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                  View Our Menu
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="group border-2 border-brand-caramel text-brand-navy hover:bg-brand-caramel hover:text-white px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <MapPin className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                  Contact Us
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center space-x-8 text-brand-medium-brown">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-brand-caramel" />
                <span>Eco Botanic, Johor</span>
              </div>
              <div className="flex items-center">
                <Coffee className="h-5 w-5 mr-2 text-brand-caramel" />
                <span>Fresh Daily</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-400 fill-current" />
                <span>4.8/5 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
