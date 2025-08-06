"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Calendar, Clock, MapPin, Users, Share2, ExternalLink, Heart, MessageCircle, ArrowLeft, Facebook, Twitter, Instagram, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"

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

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [rsvps, setRsvps] = useState<EventRSVP[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false)
  const [rsvpForm, setRsvpForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    number_of_guests: 1,
    notes: ""
  })
  const [submittingRsvp, setSubmittingRsvp] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (eventId) {
      fetchEvent()
      fetchRsvps()
    }
  }, [eventId])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('status', 'published')
        .single()

      if (error) throw error
      setEvent(data)
    } catch (error) {
      console.error('Error fetching event:', error)
      toast({
        title: "Error",
        description: "Event not found or no longer available.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRsvps = async () => {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRsvps(data || [])
    } catch (error) {
      console.error('Error fetching RSVPs:', error)
    }
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
    if (!event) {
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
          event_id: event.id,
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
        description: `You've successfully RSVP'd for "${event.title}". We'll see you there!`,
      })

      setRsvpModalOpen(false)
      setRsvpForm({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        number_of_guests: 1,
        notes: ""
      })
      
      // Refresh RSVPs
      fetchRsvps()
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

  const shareEvent = (platform: string) => {
    if (!event) return

    const text = `Check out this event: ${event.title} on ${formatDate(event.date)} at ${formatTime(event.date)}!`
    const url = window.location.href
    
    let shareUrl = ""
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
      case 'instagram':
        // Instagram doesn't have a direct share URL, so we'll copy to clipboard
        navigator.clipboard.writeText(`${text} ${url}`)
        toast({
          title: "Copied!",
          description: "Event details copied to clipboard for Instagram.",
        })
        return
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
        break
      default:
        if (navigator.share) {
          navigator.share({
            title: event.title,
            text: text,
            url: url
          })
        } else {
          navigator.clipboard.writeText(`${text} ${url}`)
          toast({
            title: "Shared!",
            description: "Event details copied to clipboard.",
          })
        }
        return
    }
    
    window.open(shareUrl, '_blank')
  }

  const addToCalendar = () => {
    if (!event) return
    
    const startDate = new Date(event.date)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours later
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent('Our Coffee Shop')}`
    
    window.open(calendarUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The event you're looking for doesn't exist or is no longer available.
          </p>
          <Link href="/events">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/events">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            {event.image_url && (
              <div className="relative h-64 w-full">
                <Image
                  src={event.image_url}
                  alt={event.title}
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-4">{event.title}</CardTitle>
                  <div className="flex items-center gap-6 text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {formatTime(event.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Our Coffee Shop
                    </div>
                  </div>
                  <Badge variant={isEventUpcoming(event.date) ? "default" : "secondary"} className="text-sm">
                    {isEventUpcoming(event.date) ? "Upcoming" : "Past Event"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {event.description && (
                <div className="prose prose-lg max-w-none mb-6">
                  <div 
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button
                  onClick={() => setRsvpModalOpen(true)}
                  disabled={!isEventUpcoming(event.date)}
                  size="lg"
                  className="flex-1"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  {isEventUpcoming(event.date) ? "RSVP Now" : "Event Ended"}
                </Button>
                <Button
                  variant="outline"
                  onClick={addToCalendar}
                  size="lg"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Add to Calendar
                </Button>
              </div>

              {/* Social Sharing */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Share this event</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareEvent('facebook')}
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareEvent('twitter')}
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareEvent('instagram')}
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareEvent('email')}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareEvent('native')}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
                <p className="text-sm">{formatDate(event.date)} at {formatTime(event.date)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                <p className="text-sm">Our Coffee Shop</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge variant={isEventUpcoming(event.date) ? "default" : "secondary"}>
                  {isEventUpcoming(event.date) ? "Upcoming" : "Past"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* RSVP List */}
          {rsvps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Attendees ({rsvps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rsvps.slice(0, 10).map((rsvp) => (
                    <div key={rsvp.id} className="flex items-center justify-between text-sm">
                      <span>{rsvp.customer_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {rsvp.number_of_guests} {rsvp.number_of_guests === 1 ? 'guest' : 'guests'}
                      </Badge>
                    </div>
                  ))}
                  {rsvps.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{rsvps.length - 10} more attendees
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* RSVP Modal */}
      <Dialog open={rsvpModalOpen} onOpenChange={setRsvpModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              RSVP for {event.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                value={rsvpForm.customer_name}
                onChange={(e) => setRsvpForm({...rsvpForm, customer_name: e.target.value})}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={rsvpForm.customer_email}
                onChange={(e) => setRsvpForm({...rsvpForm, customer_email: e.target.value})}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={rsvpForm.customer_phone}
                onChange={(e) => setRsvpForm({...rsvpForm, customer_phone: e.target.value})}
                placeholder="Your phone number"
              />
            </div>
            <div>
              <Label htmlFor="guests">Number of Guests</Label>
              <Select
                value={rsvpForm.number_of_guests.toString()}
                onValueChange={(value) => setRsvpForm({...rsvpForm, number_of_guests: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'person' : 'people'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Special Requests</Label>
              <Textarea
                id="notes"
                value={rsvpForm.notes}
                onChange={(e) => setRsvpForm({...rsvpForm, notes: e.target.value})}
                placeholder="Any special requests or dietary restrictions..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRsvpModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRsvp}
              disabled={submittingRsvp}
            >
              {submittingRsvp ? "Submitting..." : "Confirm RSVP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}