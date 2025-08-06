"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Star, Users, TrendingUp, ShoppingBag, Bell, CreditCard, Menu, X, Send, MessageCircle } from "lucide-react"
import { useSettings } from '@/lib/settings-context'

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

export default function DineInLandingPage() {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table") || "1"
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

  const handleServiceRequest = async (type: string) => {
    try {
      const { error } = await supabase.from("service_requests").insert({
        table_number: Number.parseInt(tableNumber),
        type,
        status: "pending",
      })

      if (error) throw error

      const message =
        type === "call_service"
          ? "Service Requested!"
          : type === "request_payment"
            ? "Payment request sent to cashier!"
            : "Request sent successfully!"

      alert(message)
    } catch (error) {
      console.error("Error sending service request:", error)
      alert("Failed to send request. Please try again.")
    }
  }

  const submitReview = async () => {
    if (!newReview.customer_name || !newReview.comment) {
      alert("Please fill in all fields")
      return
    }

    try {
      const { error } = await supabase.from("reviews").insert({
        customer_name: newReview.customer_name,
        rating: newReview.rating,
        comment: newReview.comment,
        table_number: Number.parseInt(tableNumber),
        status: "pending",
      })

      if (error) {
        console.error("Review submission error:", error)
        throw error
      }

      alert("Thank you for your review! It will be published after approval.")
      setNewReview({ customer_name: "", rating: 5, comment: "" })
      setShowReviewForm(false)
      fetchReviews()
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review. Please try again.")
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

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-cream/90 backdrop-blur-sm border-b border-brand-caramel/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-brand-cream">&</span>
              </div>
              <span className="text-2xl font-bold text-brand-navy">{cafeName}</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link href="#" className="text-brand-medium-brown hover:text-brand-navy transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-brand-medium-brown hover:text-brand-navy transition-colors">
                About Us
              </Link>
              <Link
                href={`/menu?table=${tableNumber}`}
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

            <div className="flex items-center space-x-4">
              <Link href="/dine-in/scan">
                <div className="bg-gradient-to-r from-brand-dark-brown to-brand-medium-brown text-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <span className="text-sm font-bold">🪑 Table {tableNumber}</span>
                </div>
              </Link>

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
                  href={`/menu?table=${tableNumber}`}
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
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-brand-navy mb-6 leading-tight">
          Discover The Art
          <br />
          Of Perfect Coffee.
        </h1>
        <p className="text-lg text-brand-medium-brown mb-8 max-w-2xl mx-auto">
          Experience the difference as we meticulously select and roast the finest beans to create a truly unforgettable
          cup of coffee. Join us on a journey of taste, one sip at a time.
        </p>
        <Link href={`/menu?table=${tableNumber}`}>
          <Button
            size="lg"
            className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-brand-cream px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Order Now
          </Button>
        </Link>
      </section>
      {/* Action Buttons */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">
            Table <span className="text-brand-dark-brown">{tableNumber}</span> Services
          </h2>
          <p className="text-lg text-brand-medium-brown">
            Everything you need for a perfect dining experience
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <button
            onClick={() => handleServiceRequest("call_service")}
            className="block group"
          >
            <div className="bg-white/70 backdrop-blur-sm border-2 border-brand-caramel rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-brand-navy relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 text-6xl">🔔</div>
                <div className="absolute bottom-4 left-4 text-4xl">✨</div>
              </div>
              
              <div className="relative z-10 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-brand-medium-brown" />
                <h3 className="text-2xl font-bold mb-2 text-brand-dark-brown">Call for Service</h3>
                <p className="text-brand-medium-brown mb-4">Need assistance? We're here to help</p>
                <div className="bg-brand-caramel/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                  <span className="text-sm font-medium text-brand-dark-brown">🙋 Staff assistance</span>
                </div>
              </div>
            </div>
          </button>

          <Link href={`/menu?table=${tableNumber}`} className="block group">
            <div className="bg-gradient-to-br from-brand-dark-brown to-brand-medium-brown rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 text-brand-cream relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 text-6xl">🍽️</div>
                <div className="absolute bottom-4 left-4 text-4xl">🚀</div>
              </div>
              
              <div className="relative z-10 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Order Now</h3>
                <p className="text-brand-cream/80 mb-4">Browse our delicious menu</p>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                  <span className="text-sm font-medium">📋 View full menu</span>
                </div>
              </div>
            </div>
          </Link>

          <button
            onClick={() => handleServiceRequest("request_payment")}
            className="block group"
          >
            <div className="bg-white/70 backdrop-blur-sm border-2 border-brand-caramel rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-brand-navy relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 text-6xl">💳</div>
                <div className="absolute bottom-4 left-4 text-4xl">✨</div>
              </div>
              
              <div className="relative z-10 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-brand-medium-brown" />
                <h3 className="text-2xl font-bold mb-2 text-brand-dark-brown">Request to Pay</h3>
                <p className="text-brand-medium-brown mb-4">Ready to settle your bill?</p>
                <div className="bg-brand-caramel/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                  <span className="text-sm font-medium text-brand-dark-brown">💰 Payment request</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">
            Why Choose <span className="text-brand-dark-brown">{cafeName}</span>?
          </h2>
          <p className="text-lg text-brand-medium-brown">
            Trusted by thousands of coffee lovers
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-brand-cream to-brand-caramel/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 text-6xl">⭐</div>
              <div className="absolute bottom-4 left-4 text-4xl">👥</div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-brand-medium-brown mr-2" />
                <span className="text-4xl font-bold text-brand-medium-brown">1K+</span>
              </div>
              <p className="text-brand-medium-brown font-medium">Customer Reviews</p>
              <p className="text-sm text-brand-medium-brown/70 mt-2">Happy customers</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-brand-cream to-brand-caramel/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 text-6xl">📈</div>
              <div className="absolute bottom-4 left-4 text-4xl">☕</div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-brand-medium-brown mr-2" />
                <span className="text-4xl font-bold text-brand-medium-brown">3K+</span>
              </div>
              <p className="text-brand-medium-brown font-medium">Best Sellers Served</p>
              <p className="text-sm text-brand-medium-brown/70 mt-2">Popular choices</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-brand-cream to-brand-caramel/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 text-6xl">🛍️</div>
              <div className="absolute bottom-4 left-4 text-4xl">✨</div>
            </div>
            
            <div className="relative z-10 text-center">
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

      

      {/* Best Selling Products */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-brand-navy text-center mb-12">Best Selling Products</h2>
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
                      
                      {/* Order Now Button */}
                      <Button 
                        className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white font-medium py-2 rounded-lg transition-all duration-200 group-hover:shadow-md"
                        onClick={() => {
                          // Navigate to menu with this product highlighted
                          router.push(`/menu?highlight=${product.id}`);
                        }}
                      >
                        Order Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </section>

      {/* Todays Celebration Section */}
      <TodaysCelebrationSection />

      {/* Category Beans Section */}
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
                    <span>Table {review.table_number}</span>
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