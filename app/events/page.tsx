"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { Calendar, Clock, MapPin, Users, Share2, ExternalLink, Heart, MessageCircle, Coffee, Star, Plus, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { useSettings } from '@/lib/settings-context'

interface Event {
  id: string
  title: string
  description: string | null
  date: string
  image_url: string | null
  status: string
  created_at: string
  updated_at: string
}

interface EventRSVP {
  id: string
  event_id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  number_of_guests: number
  status: string
  notes: string | null
  created_at: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"upcoming" | "past" | "all">("upcoming")
  const [searchQuery, setSearchQuery] = useState("")
  const [rsvpForm, setRsvpForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    number_of_guests: 1,
    notes: ""
  })
  const [submittingRsvp, setSubmittingRsvp] = useState(false)
  const { toast } = useToast()
  const settings = useSettings()
  const cafeName = settings?.cafe_name || 'Café'

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, activeFilter, searchQuery])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: "Error",
        description: "Failed to load events. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Apply date filter
    const now = new Date()
    if (activeFilter === "upcoming") {
      filtered = filtered.filter(event => new Date(event.date) > now)
    } else if (activeFilter === "past") {
      filtered = filtered.filter(event => new Date(event.date) < now)
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredEvents(filtered)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isEventUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  const handleRsvp = async () => {
    if (!selectedEvent) {
      toast({
        title: "Error",
        description: "Please select an event.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmittingRsvp(true)
      const { error } = await supabase
        .from('event_rsvps')
        .insert({
          event_id: selectedEvent.id,
          customer_name: rsvpForm.customer_name,
          customer_email: rsvpForm.customer_email || null,
          customer_phone: rsvpForm.customer_phone || null,
          number_of_guests: rsvpForm.number_of_guests,
          notes: rsvpForm.notes || null,
          status: 'confirmed'
        })

      if (error) throw error

      toast({
        title: "Success!",
        description: `You've successfully RSVP'd for "${selectedEvent.title}". We'll see you there!`,
      })

      setRsvpModalOpen(false)
      setRsvpForm({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        number_of_guests: 1,
        notes: ""
      })
    } catch (error) {
      console.error('Error submitting RSVP:', error)
      toast({
        title: "Error",
        description: "Failed to submit RSVP. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingRsvp(false)
    }
  }

  const shareEvent = (event: Event) => {
    const text = `Check out this event: ${event.title} on ${formatDate(event.date)} at ${formatTime(event.date)}!`
    const url = window.location.href
    
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: text,
        url: url
      })
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${text} ${url}`)
      toast({
        title: "Shared!",
        description: "Event details copied to clipboard.",
      })
    }
  }

  const addToCalendar = (event: Event) => {
    const startDate = new Date(event.date)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours later
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(cafeName)}`
    
    window.open(calendarUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-caramel/10">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-brand-caramel/20 border-t-brand-caramel rounded-full animate-spin"></div>
              <Coffee className="absolute inset-0 m-auto h-6 w-6 text-brand-caramel" />
            </div>
            <p className="mt-4 text-brand-medium-brown font-medium">Brewing up some amazing events...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-caramel/10">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        {/* Hero Section */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-caramel/5 to-brand-medium-brown/5 rounded-3xl transform -rotate-1"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-brand-caramel/20">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-brand-caramel to-brand-medium-brown rounded-full">
                <Coffee className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-navy to-brand-medium-brown bg-clip-text text-transparent">
                {cafeName} Events
              </h1>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-brand-medium-brown/80 max-w-3xl mx-auto text-lg leading-relaxed">
              ☕ Join us for exciting events, workshops, and community gatherings at {cafeName}! 
              From coffee tastings to live music nights, there's always something brewing. 
              Stay connected with our vibrant coffee-loving community! 🎉
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as "upcoming" | "past" | "all")} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-3 md:w-auto bg-white border border-brand-caramel/20">
                <TabsTrigger value="upcoming" className="data-[state=active]:bg-brand-caramel data-[state=active]:text-white">
                  Upcoming ({events.filter(e => isEventUpcoming(e.date)).length})
                </TabsTrigger>
                <TabsTrigger value="past" className="data-[state=active]:bg-brand-caramel data-[state=active]:text-white">
                  Past ({events.filter(e => !isEventUpcoming(e.date)).length})
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-brand-caramel data-[state=active]:text-white">
                  All ({events.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full md:w-80">
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-brand-caramel/30 focus:border-brand-caramel bg-white"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Coffee className="h-4 w-4 text-brand-caramel" />
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-brand-caramel/20 max-w-md mx-auto">
              <Coffee className="h-16 w-16 text-brand-medium-brown mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-brand-navy mb-4">
                {activeFilter === "upcoming" ? "No Upcoming Events" : 
                 activeFilter === "past" ? "No Past Events" : "No Events Found"}
              </h3>
              <p className="text-brand-medium-brown/80 mb-6">
                {searchQuery ? 
                  "Try adjusting your search terms or check back later for new events." :
                  "Check back soon for exciting new events and workshops!"
                }
              </p>
              {searchQuery && (
                <Button 
                  onClick={() => setSearchQuery("")} 
                  variant="outline" 
                  className="border-brand-caramel text-brand-medium-brown hover:bg-brand-caramel hover:text-white"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white border-brand-caramel/20 group">
                {event.image_url ? (
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={event.image_url}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <Badge 
                        variant={isEventUpcoming(event.date) ? "default" : "secondary"}
                        className={isEventUpcoming(event.date) 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" 
                          : "bg-brand-medium-brown/80 text-white"
                        }
                      >
                        {isEventUpcoming(event.date) ? "🎉 Upcoming" : "📅 Past Event"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-56 w-full bg-gradient-to-br from-brand-cream to-brand-caramel/30 flex items-center justify-center">
                    <div className="text-center">
                      <Coffee className="h-16 w-16 text-brand-medium-brown mx-auto mb-4" />
                      <Badge 
                        variant={isEventUpcoming(event.date) ? "default" : "secondary"}
                        className={isEventUpcoming(event.date) 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" 
                          : "bg-brand-medium-brown/80 text-white"
                        }
                      >
                        {isEventUpcoming(event.date) ? "🎉 Upcoming" : "📅 Past Event"}
                      </Badge>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-brand-navy mb-3 group-hover:text-brand-caramel transition-colors">
                        {event.title}
                      </CardTitle>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-brand-medium-brown">
                          <Calendar className="h-4 w-4 text-brand-caramel" />
                          <span className="font-medium">{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-medium-brown">
                          <Clock className="h-4 w-4 text-brand-caramel" />
                          <span className="font-medium">{formatTime(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-medium-brown">
                          <MapPin className="h-4 w-4 text-brand-caramel" />
                          <span className="font-medium">{cafeName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareEvent(event)}
                        className="border-brand-caramel/30 text-brand-medium-brown hover:bg-brand-caramel/10 hover:border-brand-caramel"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToCalendar(event)}
                        className="border-brand-caramel/30 text-brand-medium-brown hover:bg-brand-caramel/10 hover:border-brand-caramel"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-brand-medium-brown/80 mb-6 line-clamp-3 leading-relaxed">
                    {event.description 
                      ? event.description
                          .replace(/<[^>]*>/g, '') // Remove HTML tags
                          .replace(/&nbsp;/g, ' ') // Replace HTML entities
                          .replace(/&amp;/g, '&')
                          .replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>')
                          .replace(/&quot;/g, '"')
                          .replace(/&#39;/g, "'")
                          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                          .trim()
                          .substring(0, 150) + (event.description.replace(/<[^>]*>/g, '').length > 150 ? '...' : '')
                      : 'No description available'
                    }
                  </p>
                  <div className="flex gap-3">
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 border-brand-caramel text-brand-medium-brown hover:bg-brand-caramel hover:text-white transition-all duration-200"
                    >
                      <Link href={`/events/${event.id}`}>
                        <Heart className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedEvent(event)
                        setRsvpModalOpen(true)
                      }}
                      disabled={!isEventUpcoming(event.date)}
                      className="flex-1 bg-gradient-to-r from-brand-caramel to-brand-medium-brown hover:from-brand-medium-brown hover:to-brand-caramel text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {isEventUpcoming(event.date) ? "RSVP Now" : "Event Ended"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* RSVP Modal */}
      <Dialog open={rsvpModalOpen} onOpenChange={setRsvpModalOpen}>
        <DialogContent className="max-w-md bg-white border-brand-caramel/20">
          <DialogHeader>
            <DialogTitle className="text-brand-navy text-xl font-bold">
              RSVP for {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer_name" className="text-brand-navy font-medium">
                Name (Optional)
              </Label>
              <Input
                id="customer_name"
                value={rsvpForm.customer_name}
                onChange={(e) => setRsvpForm({ ...rsvpForm, customer_name: e.target.value })}
                className="border-brand-caramel/30 focus:border-brand-caramel"
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="customer_email" className="text-brand-navy font-medium">
                Email (Optional)
              </Label>
              <Input
                id="customer_email"
                type="email"
                value={rsvpForm.customer_email}
                onChange={(e) => setRsvpForm({ ...rsvpForm, customer_email: e.target.value })}
                className="border-brand-caramel/30 focus:border-brand-caramel"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="customer_phone" className="text-brand-navy font-medium">
                Phone (Optional)
              </Label>
              <Input
                id="customer_phone"
                value={rsvpForm.customer_phone}
                onChange={(e) => setRsvpForm({ ...rsvpForm, customer_phone: e.target.value })}
                className="border-brand-caramel/30 focus:border-brand-caramel"
                placeholder="Your phone number"
              />
            </div>
            <div>
              <Label htmlFor="number_of_guests" className="text-brand-navy font-medium">
                Number of Guests
              </Label>
              <Select
                value={rsvpForm.number_of_guests.toString()}
                onValueChange={(value) => setRsvpForm({ ...rsvpForm, number_of_guests: parseInt(value) })}
              >
                <SelectTrigger className="border-brand-caramel/30 focus:border-brand-caramel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes" className="text-brand-navy font-medium">
                Special Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={rsvpForm.notes}
                onChange={(e) => setRsvpForm({ ...rsvpForm, notes: e.target.value })}
                className="border-brand-caramel/30 focus:border-brand-caramel"
                placeholder="Any special requests or dietary requirements..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRsvp}
              disabled={submittingRsvp}
              className="w-full bg-gradient-to-r from-brand-caramel to-brand-medium-brown hover:from-brand-medium-brown hover:to-brand-caramel text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {submittingRsvp ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Submitting RSVP...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Confirm RSVP
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}