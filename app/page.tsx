"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Star, Users, TrendingUp, ShoppingBag, Menu, X, Send, MessageCircle, Clock } from "lucide-react"
import { useSettings } from '@/lib/settings-context'
import { toast } from "@/hooks/use-toast"

interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string
  table_number: number
  status: "pending" | "approved" | "rejected"
  created_at: string
}

interface Celebration {
  image_url: string | null;
  date: string;
  coffee_name: string;
  description: string;
}

function TodaysCelebrationSection() {
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchCelebration() {
      setLoading(true);
      setError('');
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      // Try to fetch today's entry
      let { data, error } = await supabase
        .from('todays_celebration')
        .select('*')
        .eq('date', todayStr)
        .single();
      if (!data) {
        // If not found, get the most recent one
        const { data: latest, error: latestError } = await supabase
          .from('todays_celebration')
          .select('*')
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestError) setError(latestError.message);
        setCelebration(latest);
      } else {
        setCelebration(data);
      }
      setLoading(false);
    }
    fetchCelebration();
  }, []);

  if (loading) return <section className="container mx-auto px-4 py-16 text-center">Loading Today's Celebration...</section>;
  if (error) return <section className="container mx-auto px-4 py-16 text-center text-red-600">{error}</section>;
  if (!celebration) return <section className="container mx-auto px-4 py-16 text-center text-brand-medium-brown">No celebration set for today yet. Please check back soon!</section>;

  return (
    <section className="container mx-auto px-4 py-16 bg-white/50 rounded-3xl mx-4 flex flex-col md:flex-row items-stretch gap-8 shadow-lg overflow-hidden fade-in">
      {celebration.image_url && (
        <div className="md:w-1/2 w-full flex items-center justify-center bg-brand-cream p-6">
          <img
            src={celebration.image_url}
            alt="Celebration Coffee"
            className="rounded-xl shadow-md w-full max-h-96 object-cover"
          />
        </div>
      )}
      <div className="md:w-1/2 w-full flex flex-col justify-center p-8 fade-in-text">
        <div className="text-xs text-brand-medium-brown mb-2">{new Date(celebration.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <h3 className="text-2xl font-bold text-brand-navy mb-2">Today's Celebration</h3>
        <div className="text-xl font-extrabold text-brand-caramel mb-2">{celebration.coffee_name}</div>
        <div className="text-brand-medium-brown mb-6">{celebration.description}</div>
        <Button 
          className="rounded-full px-8 py-3 text-lg font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg transition"
          onClick={() => router.push('/menu')}
        >
          Order Now
        </Button>
      </div>
      <style jsx>{`
        .fade-in { animation: fadeIn 1s ease; }
        .fade-in-text { animation: fadeInText 1.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        @keyframes fadeInText { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
      `}</style>
    </section>
  );
}

export default function LandingPage() {
  const [bestSellers, setBestSellers] = useState<any[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showReviews, setShowReviews] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [newReview, setNewReview] = useState({
    customer_name: "",
    rating: 5,
    comment: "",
  })
  const reviewsSectionRef = useRef<HTMLDivElement>(null)
  const settings = useSettings()
  const cafeName = settings?.cafe_name || 'Café'
  const router = useRouter()

  useEffect(() => {
    fetchBestSellers()
    fetchReviews()
  }, [])

  const fetchBestSellers = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("isbestselling", true)
        .order("reviews_count", { ascending: false })
        .limit(3)

      if (error) throw error
      setBestSellers(data || [])
    } catch (error) {
      console.error("Error fetching best sellers:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error fetching reviews:", error)
        return
      }
      setReviews(data || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const submitReview = async () => {
    if (!newReview.customer_name || !newReview.comment) {
      toast({
        title: "Incomplete Fields",
        description: "Please fill in all fields.",
      })
      return
    }

    try {
      const { error } = await supabase.from("reviews").insert({
        customer_name: newReview.customer_name,
        rating: newReview.rating,
        comment: newReview.comment,
        table_number: 0, // For takeaway reviews
        status: "pending",
      })

      if (error) {
        console.error("Review submission error:", error)
        toast({
          title: "Submission Failed",
          description: "Failed to submit review. Please try again.",
        })
        throw error
      }

      toast({
        title: "Thank you for your review!",
        description: "It will be published after approval.",
      })
      setNewReview({ customer_name: "", rating: 5, comment: "" })
      setShowReviewForm(false)
      fetchReviews()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit review. Please try again.",
      })
    }
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-500 fill-current" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
          />
        ))}
      </div>
    )
  }

  const handleShowReviews = () => {
    setShowReviews(true)
    setTimeout(() => {
      reviewsSectionRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  // Add a simple addToCart function using localStorage
  const addToCart = (product: any) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingIndex = cart.findIndex((item: any) => item.id === product.id)
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1
    } else {
      cart.push({ ...product, quantity: 1, size: "M" })
    }
    localStorage.setItem("cart", JSON.stringify(cart))
  }

  return (
    <div className="min-h-screen bg-brand-cream relative overflow-hidden">
      {/* Coffee Pattern Background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23102341' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='53' cy='53' r='2'/%3E%3Cpath d='M20 20h20v20H20z' fill='none' stroke='%23102341' stroke-width='1'/%3E%3Cpath d='M25 15c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10 10 4.477 10 10zm20 20c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10 10 4.477 10 10z' fill='none' stroke='%23102341' stroke-width='0.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      {/* Floating Coffee Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 opacity-10 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-brand-medium-brown" />
        </div>
        <div className="absolute top-40 right-20 opacity-10 animate-pulse" style={{animationDelay: '1s'}}>
          <div className="w-6 h-6 rounded-full bg-brand-caramel" />
        </div>
        <div className="absolute bottom-40 left-20 opacity-10 animate-pulse" style={{animationDelay: '2s'}}>
          <div className="w-4 h-4 rounded-full bg-brand-dark-brown" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-10 animate-pulse" style={{animationDelay: '0.5s'}}>
          <div className="w-5 h-5 rounded-full bg-brand-navy" />
        </div>
      </div>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-cream/90 backdrop-blur-sm border-b border-brand-caramel/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo on the left */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-brand-cream">&</span>
              </div>
              <span className="text-2xl font-bold text-brand-navy">{cafeName}</span>
            </div>

            {/* Desktop Navigation on the right */}
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                <Link href="#" className="text-brand-medium-brown hover:text-brand-navy transition-colors">
                  Home
                </Link>
                <Link href="/about" className="text-brand-medium-brown hover:text-brand-navy transition-colors">
                  About Us
                </Link>
                <Link
                  href="/menu?mode=takeaway"
                  className="text-brand-medium-brown hover:text-brand-navy transition-colors"
                >
                  Menu
                </Link>
                <Link href="/events" className="text-brand-medium-brown hover:text-brand-navy transition-colors">
                  Events
                </Link>
                <button
                  onClick={handleShowReviews}
                  className="text-brand-medium-brown hover:text-brand-navy transition-colors"
                >
                  Reviews
                </button>
                <Link href="/contact" className="text-brand-medium-brown hover:text-brand-navy transition-colors">
                  Contact
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <nav className="md:hidden mt-4 pb-4 border-t border-brand-caramel/30 pt-4">
              <div className="flex flex-col space-y-3">
                <Link href="#" className="text-brand-medium-brown hover:text-brand-navy transition-colors">
                  Home
                </Link>
                <Link href="/about" className="text-brand-medium-brown hover:text-brand-navy transition-colors">
                  About Us
                </Link>
                <Link
                  href="/menu?mode=takeaway"
                  className="text-brand-medium-brown hover:text-brand-navy transition-colors"
                >
                  Menu
                </Link>
                <Link href="/events" className="text-brand-medium-brown hover:text-brand-navy transition-colors">
                  Events
                </Link>
                <button
                  onClick={() => {
                    handleShowReviews()
                    setShowMobileMenu(false)
                  }}
                  className="text-brand-medium-brown hover:text-brand-navy transition-colors text-left"
                >
                  Reviews
                </button>
                <Link href="/contact" className="text-brand-medium-brown hover:text-brand-navy transition-colors">
                  Contact
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 text-center">
        {/* Hero Background Accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cream via-brand-cream to-brand-caramel/10 rounded-3xl mx-4" />
        
        <div className="relative z-10">
          <div className="inline-block mb-6">
            <div className="bg-brand-navy/5 backdrop-blur-sm rounded-full px-6 py-2 border border-brand-caramel/20">
              <span className="text-brand-medium-brown font-medium">☕ Premium Coffee Experience</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-brand-navy mb-6 leading-tight">
            <span className="bg-gradient-to-r from-brand-navy via-brand-dark-brown to-brand-medium-brown bg-clip-text text-transparent">
              Order Ahead
            </span>
            <br />
            <span className="text-brand-dark-brown">Skip the Wait.</span>
          </h1>
          
          <p className="text-xl text-brand-medium-brown mb-10 max-w-3xl mx-auto leading-relaxed">
            Order your favorite coffee and food online. Pay now, pick up when you arrive. 
            <span className="font-semibold text-brand-dark-brown">No waiting, no hassle.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/menu?mode=takeaway">
              <Button
                size="lg"
                className="bg-gradient-to-r from-brand-dark-brown to-brand-medium-brown hover:from-brand-medium-brown hover:to-brand-dark-brown text-brand-cream px-10 py-5 text-lg rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-2 border-brand-dark-brown/20"
              >
                🚀 Order Now for Takeaway
              </Button>
            </Link>
            
            <Link href="/dine-in/scan">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-brand-dark-brown text-brand-dark-brown hover:bg-brand-dark-brown hover:text-brand-cream px-10 py-5 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                🍽️ Dine In Experience
              </Button>
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-brand-medium-brown">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">5-10 min pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.8/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">1000+ happy customers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">
            Why Choose <span className="text-brand-dark-brown">{cafeName}</span>?
          </h2>
          <p className="text-lg text-brand-medium-brown max-w-2xl mx-auto">
            Experience the perfect blend of quality, convenience, and exceptional service
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-brand-caramel/20">
            <div className="flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-brand-medium-brown mr-2" />
              <span className="text-4xl font-bold text-brand-medium-brown">1K+</span>
            </div>
              <p className="text-brand-medium-brown font-medium">Happy Customers</p>
              <p className="text-sm text-brand-medium-brown/70 mt-2">Serving smiles daily</p>
            </div>
          </div>
          
          <div className="text-center group">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-brand-caramel/20">
              <div className="flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-brand-medium-brown mr-2" />
                <span className="text-4xl font-bold text-brand-medium-brown">5min</span>
              </div>
              <p className="text-brand-medium-brown font-medium">Average Pickup Time</p>
              <p className="text-sm text-brand-medium-brown/70 mt-2">Lightning fast service</p>
            </div>
          </div>
          
          <div className="text-center group">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-brand-caramel/20">
              <div className="flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-brand-medium-brown mr-2" />
                <span className="text-4xl font-bold text-brand-medium-brown">150K+</span>
              </div>
              <p className="text-brand-medium-brown font-medium">Orders Completed</p>
              <p className="text-sm text-brand-medium-brown/70 mt-2">Trusted by thousands</p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">
            Ready to <span className="text-brand-dark-brown">Order</span>?
          </h2>
          <p className="text-lg text-brand-medium-brown">
            Choose your preferred way to enjoy our coffee
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link href="/menu?mode=takeaway" className="block group">
            <div className="bg-gradient-to-br from-brand-dark-brown to-brand-medium-brown rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 text-brand-cream relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 text-6xl">☕</div>
                <div className="absolute bottom-4 left-4 text-4xl">🚀</div>
              </div>
              
              <div className="relative z-10 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Order Takeaway</h3>
                <p className="text-brand-cream/80 mb-4">Ready in minutes, skip the wait!</p>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                  <span className="text-sm font-medium">⚡ 5-10 min pickup</span>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dine-in/scan" className="block group">
            <div className="bg-white/70 backdrop-blur-sm border-2 border-brand-caramel rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-brand-navy relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 text-6xl">🍽️</div>
                <div className="absolute bottom-4 left-4 text-4xl">✨</div>
              </div>
              
              <div className="relative z-10 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-brand-medium-brown" />
                <h3 className="text-2xl font-bold mb-2 text-brand-dark-brown">Dine In Experience</h3>
                <p className="text-brand-medium-brown mb-4">Full service dining experience</p>
                <div className="bg-brand-caramel/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                  <span className="text-sm font-medium text-brand-dark-brown">🏪 Table service</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Best Selling Products */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-brand-navy text-center mb-12">Most Popular Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-white border-brand-caramel/20">
                  <CardContent className="p-6">
                    <div className="bg-amber-100 rounded-lg h-48 mb-4 animate-pulse"></div>
                    <div className="h-4 bg-amber-100 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 bg-amber-100 rounded w-1/2 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))
            : bestSellers.map((product) => (
                <Card
                  key={product.id}
                  className="bg-white border-brand-caramel/20 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push('/menu')}
                >
                  <CardContent className="p-6">
                    <div className="relative bg-amber-100 rounded-lg h-48 mb-4 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                          onError={e => { e.currentTarget.src = "/placeholder.svg"; }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-brand-navy rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-brand-cream">&</span>
                        </div>
                      )}
                      {/* Best Seller Badge */}
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        ⭐ Best Seller
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-brand-navy text-lg mb-1 group-hover:text-brand-caramel transition-colors">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-brand-medium-brown line-clamp-2 leading-relaxed">{product.description}</p>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="bg-brand-navy/10 text-brand-navy text-xs px-2 py-1 rounded-full font-medium">
                              {tag}
                            </span>
                          ))}
                          {product.tags.length > 2 && (
                            <span className="text-xs text-brand-medium-brown">+{product.tags.length - 2} more</span>
                          )}
                        </div>
                      )}
                      
                      {/* Price and Rating */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {product.sale_price && product.sale_price < product.price ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500 line-through">RM{product.price.toFixed(2)}</span>
                              <span className="text-lg font-bold text-green-600">RM{product.sale_price.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-brand-caramel">RM{product.price.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-amber-600 ml-1 font-medium">{product.rating}</span>
                          </div>
                          <span className="text-xs text-brand-medium-brown">({product.reviews_count || 0} reviews)</span>
                        </div>
                      </div>
                      
                      {/* Add to Cart Button */}
                      <Button 
                        className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white font-medium py-2 rounded-lg transition-all duration-200 group-hover:shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/menu');
                        }}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </section>

      {/* Todays Celebration Section */}
      <TodaysCelebrationSection />

      {/* Our Premium Bean Categories Section */}
      <section className="container mx-auto px-4 py-16 bg-white/50 rounded-3xl mx-4">
        <h2 className="text-3xl font-bold text-brand-navy text-center mb-4">Our Premium Bean Categories</h2>
        <p className="text-brand-medium-brown text-center mb-12 max-w-2xl mx-auto">
          Discover our carefully curated selection of premium coffee beans from around the world
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              name: "Arabica Premium",
              origin: "Ethiopian Highlands",
              flavor: "Floral & Fruity",
              roast: "Light to Medium",
              icon: "☕",
            },
            {
              name: "Robusta Bold",
              origin: "Vietnamese Mountains",
              flavor: "Strong & Earthy",
              roast: "Dark",
              icon: "🫘",
            },
            {
              name: "Single Origin",
              origin: "Colombian Andes",
              flavor: "Chocolate & Nuts",
              roast: "Medium",
              icon: "🌱",
            },
            {
              name: "Signature Blend",
              origin: "House Special",
              flavor: "Balanced & Rich",
              roast: "Medium-Dark",
              icon: "⭐",
            },
          ].map((bean, index) => (
            <Card
              key={index}
              className="bg-white border-brand-caramel/20 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">{bean.icon}</div>
                <h3 className="font-bold text-brand-navy mb-2">{bean.name}</h3>
                <p className="text-sm text-brand-medium-brown mb-1">Origin: {bean.origin}</p>
                <p className="text-sm text-brand-medium-brown mb-1">Flavor: {bean.flavor}</p>
                <p className="text-sm text-brand-caramel font-medium">Roast: {bean.roast}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Customer Reviews Section */}
      {showReviews && (
        <section ref={reviewsSectionRef} className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-brand-navy">Customer Reviews</h2>
            <Button
              onClick={() => setShowReviewForm(true)}
              className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-brand-cream"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Write Review
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <Card key={review.id} className="bg-white border-brand-caramel/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-brand-navy">{review.customer_name}</h4>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-brand-medium-brown text-sm mb-3">{review.comment}</p>
                  <div className="flex items-center justify-between text-xs text-brand-medium-brown">
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {reviews.length === 0 && (
            <div className="text-center py-8">
              <p className="text-brand-medium-brown">No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </section>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-brand-navy">Write a Review</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">Your Name</label>
                  <input
                    type="text"
                    value={newReview.customer_name}
                    onChange={(e) => setNewReview({ ...newReview, customer_name: e.target.value })}
                    className="w-full p-2 border border-brand-caramel/30 rounded-md focus:border-brand-caramel focus:outline-none"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">Rating</label>
                  {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-navy mb-2">Your Review</label>
                  <Textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Share your experience..."
                    rows={4}
                    className="border-brand-caramel/30 focus:border-brand-caramel"
                  />
                </div>

                <Button
                  onClick={submitReview}
                  className="w-full bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-brand-cream"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
