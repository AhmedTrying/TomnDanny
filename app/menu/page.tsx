"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Search, Star, Plus, ShoppingCart, ArrowLeft, User, CheckCircle, Loader2, QrCode, X, AlertTriangle, Calendar, Edit3, Check, Home, Phone, CreditCard } from "lucide-react"
import { useSettings } from '@/lib/settings-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MenuCard from "@/components/shared/MenuCard";
import ExtendedMenuCard from "@/components/shared/ExtendedMenuCard";

interface Product {
  id: string
  name: string
  description: string
  detailed_description?: string
  price: number
  image_url: string
  category: string
  rating: number
  reviews_count: number
  stock_quantity?: number
  track_stock?: boolean
  sale_price?: number | null
  tags?: string[]
  allergens?: string[]
  estimated_prep_time?: string
  dietary_tags?: string[]
  is_supply?: boolean
  ribbon_text?: string
  ribbon_color?: string
  isbestselling?: boolean
}

interface CartItem extends Product {
  quantity: number;
  size: "S" | "M" | "L";
  notes?: string;
  item_total: number;
  selectedAddOns?: any[]; // Add this field
}

interface Promo {
  id: string;
  image_url: string;
  promo_text: string;
}

export default function MenuPage() {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table") || "1"
  const mode = searchParams.get("mode")
  const router = useRouter()
  const settings = useSettings()

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [addOns, setAddOns] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [selectedSize, setSelectedSize] = useState<"S" | "M" | "L">("M")
  const [productNotes, setProductNotes] = useState("")
  const [globalOrderNotes, setGlobalOrderNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fees, setFees] = useState<any[]>([])
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'reservation'>("dine_in")
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | null>(null)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reservation-specific state
  const [reservationDate, setReservationDate] = useState<string>("")
  const [reservationTime, setReservationTime] = useState<string>("")
  const [numberOfPeople, setNumberOfPeople] = useState<number>(2)
  const [tablePreference, setTablePreference] = useState<string>("")
  const [customerName, setCustomerName] = useState<string>("")
  const [customerPhone, setCustomerPhone] = useState<string>("")
  const [customerEmail, setCustomerEmail] = useState<string>("")
  const [availableTables, setAvailableTables] = useState<any[]>([])
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [editedTableNumber, setEditedTableNumber] = useState(tableNumber)
  const [showTableOptions, setShowTableOptions] = useState(false)



  // Reservation snapshot for confirmation modal
  const [reservationSnapshot, setReservationSnapshot] = useState<{
    date: string
    time: string
    people: number
    table: string
    name: string
    phone: string
    email: string
    total: number
  } | null>(null)

  // Cancel order state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelNotes, setCancelNotes] = useState("")
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<any>(null)

  // Add order snapshot state for modal
  const [orderSnapshot, setOrderSnapshot] = useState<{
    cart: CartItem[];
    paymentScreenshotUrl: string | null;
    total: number;
    tableNumber?: string | number;
  } | null>(null)

  // 1. Add upsell rules state
  const [upsellRules, setUpsellRules] = useState<any[]>([]);

  // 2. Fetch upsell rules on mount
  useEffect(() => {
    const fetchUpsellRules = async () => {
      const { data, error } = await supabase.from("upsell_rules").select("*").eq("active", true);
      if (!error) setUpsellRules(data || []);
    };
    fetchUpsellRules();
  }, []);

  // 1. Add state for discount code
  const [discountCode, setDiscountCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState<any | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  const [promos, setPromos] = useState<Promo[]>([]);
  const [promoLoading, setPromoLoading] = useState(true);

  useEffect(() => {
    fetchPromos();
  }, []);

  // Close table options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTableOptions && !(event.target as Element).closest('.table-options-container')) {
        setShowTableOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTableOptions])

  const fetchPromos = async () => {
    setPromoLoading(true);
    try {
      const res = await fetch('/api/menu-promos');
      const data = await res.json();
      setPromos(Array.isArray(data) ? data : []);
    } catch {
      setPromos([]);
    } finally {
      setPromoLoading(false);
    }
  };

  // Add carousel state for promo images
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  // Autoplay effect for promo carousel
  useEffect(() => {
    if (promos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [promos]);

  // --- Back button logic ---
  let backHref = "/";
  if (searchParams.get("table")) {
    backHref = `/dine-in/scan`;
  } else if (searchParams.get("mode") === "takeaway" || searchParams.get("mode") === "reservation") {
    backHref = "/";
  }

  useEffect(() => {
    if (settings?.operating_hours) {
      // 24/7 mode: open = '00:00', close = '23:59'
      if (settings.operating_hours.open === '00:00' && settings.operating_hours.close === '23:59') {
        return; // Always open
      }
      const now = new Date()
      const [openHour, openMinute] = settings.operating_hours.open.split(":").map(Number)
      const [closeHour, closeMinute] = settings.operating_hours.close.split(":").map(Number)
      const openTime = new Date(now)
      openTime.setHours(openHour, openMinute, 0, 0)
      const closeTime = new Date(now)
      closeTime.setHours(closeHour, closeMinute, 0, 0)
      if (now < openTime || now > closeTime) {
        router.replace("/closed")
      }
    }
  }, [settings])

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, selectedCategory, searchQuery])

  useEffect(() => {
    if (showCart) {
      fetchFees()
    }
  }, [showCart])

  // Set default reservation date/time on client only to avoid hydration errors
  useEffect(() => {
    if (mode === "reservation") {
      setOrderType("reservation")
      if (!reservationDate) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setReservationDate(tomorrow.toISOString().split('T')[0])
      }
      if (!reservationTime) {
        setReservationTime("12:00")
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "takeaway") setOrderType("takeaway");
    if (mode === "dine_in") setOrderType("dine_in");
  }, [searchParams]);

  useEffect(() => {
    if (selectedProduct?.id) {
      // Fetch add-ons
      supabase
        .from('product_add_ons')
        .select('*')
        .eq('product_id', selectedProduct.id)
        .eq('active', true)
        .order('name')
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching add-ons:', error);
            setAddOns([]);
          } else {
            setAddOns(data || []);
          }
        });
      // Fetch sizes
      supabase
        .from('product_sizes')
        .select('*')
        .eq('product_id', selectedProduct.id)
        .eq('active', true)
        .order('size_name')
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching sizes:', error);
            // Provide default sizes on error
            setSizes([
              { id: 'default-s', size_name: 'S', price_multiplier: 0.8, active: true },
              { id: 'default-m', size_name: 'M', price_multiplier: 1.0, active: true },
              { id: 'default-l', size_name: 'L', price_multiplier: 1.2, active: true }
            ]);
          } else if (!data || data.length === 0) {
            // If no sizes found, provide default sizes
            setSizes([
              { id: 'default-s', size_name: 'S', price_multiplier: 0.8, active: true },
              { id: 'default-m', size_name: 'M', price_multiplier: 1.0, active: true },
              { id: 'default-l', size_name: 'L', price_multiplier: 1.2, active: true }
            ]);
          } else {
            setSizes(data);
          }
        });
    } else {
      setAddOns([]);
      setSizes([]);
    }
  }, [selectedProduct?.id]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, detailed_description, price, image_url, category, rating, reviews_count, stock_quantity, track_stock, sale_price, tags, allergens, is_supply, ribbon_text, ribbon_color, isbestselling");

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      // Filter out supplies (products with is_supply true)
      const filteredData = (data || []).filter((p: any) => !p.is_supply)
      setProducts(filteredData)

      // Extract unique categories from non-supplies
      const uniqueCategories = ["All", ...new Set(filteredData.map((p: any) => p.category) || [])]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Failed to load menu items. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredProducts(filtered)
  }

  const addToCart = async (product: Product, size: "S" | "M" | "L" = "M", notes?: string, quantity: number = 1, selectedAddOns: any[] = []) => {
    setAddingToCart(true)
    setError(null)

    try {
      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300))

      const sizeMultiplier = size === "S" ? 0.8 : size === "L" ? 1.2 : 1
      const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + (a.price || 0), 0);
      const itemPrice = product.price * sizeMultiplier + addOnsTotal;

      const existingItemIndex = cart.findIndex(
        (item) => item.id === product.id && item.size === size && item.notes === notes && JSON.stringify(item.selectedAddOns || []) === JSON.stringify(selectedAddOns || [])
      )

      if (existingItemIndex >= 0) {
        const updatedCart = [...cart]
        updatedCart[existingItemIndex].quantity += quantity
        updatedCart[existingItemIndex].item_total = updatedCart[existingItemIndex].quantity * itemPrice
        setCart(updatedCart)
      } else {
        const newItem: CartItem = {
          ...product,
          quantity,
          size,
          notes,
          price: itemPrice,
          item_total: itemPrice * quantity,
          selectedAddOns,
        }
        setCart([...cart, newItem])
      }

      setSelectedProduct(null)
      setProductNotes("")
      setSelectedSize("M")
    } catch (error) {
      console.error("Error adding to cart:", error)
      setError("Failed to add item to cart")
    } finally {
      setAddingToCart(false)
    }
  }

  const updateCartQuantity = (id: string, size: string, notes: string | undefined, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id && item.size === size && item.notes === notes) {
            const newQuantity = item.quantity + change
            if (newQuantity <= 0) return null

            const updatedItem = { ...item, quantity: newQuantity }
            updatedItem.item_total = updatedItem.quantity * updatedItem.price
            return updatedItem
          }
          return item
        })
        .filter(Boolean) as CartItem[],
    )
  }



  const removeFromCart = (id: string, size: string, notes: string | undefined) => {
    setCart(cart.filter((item) => !(item.id === id && item.size === size && item.notes === notes)))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.item_total, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase.from("fees").select("*").eq("active", true)
      if (error) throw error
      setFees(data || [])
    } catch (error) {
      setFees([])
    }
  }

  const fetchAvailableTables = async (date: string, time: string, partySize: number) => {
    try {
      const { data, error } = await supabase.rpc('get_available_tables', {
        res_date: date,
        res_time: time,
        party_size: partySize,
        duration_mins: 120
      })
      if (error) throw error
      setAvailableTables(data || [])
    } catch (error) {
      console.error("Error fetching available tables:", error)
      setAvailableTables([])
    }
  }

  const getApplicableFee = () => {
    return fees
      .filter(fee => fee.active && (fee.applies_to === orderType || fee.applies_to === "both"))
      .reduce((total, fee) => {
        if (fee.type === "percentage") {
          return total + (getCartTotal() * fee.amount) / 100;
        }
        return total + fee.amount;
      }, 0);
  };

  const handleTableEdit = () => {
    setIsEditingTable(true)
    setEditedTableNumber(tableNumber)
  }

  const handleTableSave = () => {
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('table', editedTableNumber)
    router.push(newUrl.toString())
    setIsEditingTable(false)
    setShowTableOptions(false)
  }

  const handleTableCancel = () => {
    setEditedTableNumber(tableNumber)
    setIsEditingTable(false)
  }

  const handleGoHome = () => {
    router.push('/dine-in')
  }

  const handleCallService = () => {
    // You can implement service request functionality here
    alert('Service request sent!')
  }

  const handleRequestPayment = () => {
    // You can implement payment request functionality here
    alert('Payment request sent!')
  }

  // 2. Validate discount code
  const validateDiscountCode = async () => {
    setCheckingDiscount(true);
    setDiscountError('');
    setDiscountInfo(null);
    if (!discountCode) {
      setDiscountError('Please enter a code.');
      setCheckingDiscount(false);
      return;
    }
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', discountCode.toUpperCase())
      .eq('active', true)
      .maybeSingle();
    if (error || !data) {
      setDiscountError('Invalid or inactive code.');
      setCheckingDiscount(false);
      return;
    }
    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setDiscountError('This code has expired.');
      setCheckingDiscount(false);
      return;
    }
    // Check usage limit
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      setDiscountError('This code has reached its usage limit.');
      setCheckingDiscount(false);
      return;
    }
    // Check min order
    if (data.min_order_amount && getCartTotal() < data.min_order_amount) {
      setDiscountError(`Minimum order RM${data.min_order_amount} required.`);
      setCheckingDiscount(false);
      return;
    }
    setDiscountInfo(data);
    setDiscountError('');
    setCheckingDiscount(false);
  };

  // 3. Calculate discount amount
  const getDiscountAmount = () => {
    if (!discountInfo) return 0;
    if (discountInfo.type === 'fixed') return Math.min(discountInfo.value, getCartTotal());
    if (discountInfo.type === 'percentage') return Math.round(getCartTotal() * (discountInfo.value / 100));
    return 0;
  };

  // 4. Update order logic to include discount
  const discountAmount = getDiscountAmount();
  const feeAmount = getApplicableFee();
  const totalWithFeeAndDiscount = getCartTotal() + feeAmount - discountAmount;

  const placeOrder = async () => {
    setPlacingOrder(true)
    setError(null)

    try {
      if (cart.length === 0) {
        throw new Error("Cart is empty")
      }
      if (orderType === "takeaway" && !paymentScreenshot) {
        throw new Error("Please upload your payment screenshot.")
      }
      if (orderType === "reservation" && !paymentScreenshot) {
        throw new Error("Please upload your payment screenshot for reservation orders.")
      }
      if (orderType === "reservation") {
        if (!reservationDate || !reservationTime) {
          throw new Error("Please fill in reservation date and time.")
        }
      }

      // Prepare order data with proper structure
      const orderItems = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        notes: item.notes || null,
        item_total: item.item_total,
      }))
      const subtotal = getCartTotal()

      // Upload payment screenshot if takeaway or reservation
      let paymentProofUrl = null
      if ((orderType === "takeaway" || orderType === "reservation") && paymentScreenshot) {
        const fileExt = paymentScreenshot.name.split('.').pop()
        const fileName = `payment-proofs/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('paymentproofs')
          .upload(fileName, paymentScreenshot, {
            cacheControl: '3600',
            upsert: false
          })
        if (uploadError) {
          setError("Failed to upload payment proof. Please try again.")
          setPlacingOrder(false)
          return
        }
        const { data: publicUrlData } = supabase.storage.from('paymentproofs').getPublicUrl(fileName)
        paymentProofUrl = publicUrlData.publicUrl
      }

      const orderData = {
        table_number: Number.parseInt(tableNumber),
        items: orderItems,
        subtotal: Number.parseFloat(subtotal.toFixed(2)),
        total: Number.parseFloat(totalWithFeeAndDiscount.toFixed(2)),
        status: 'pending',
        dining_type: orderType,
        order_notes: globalOrderNotes || null,
        fees_total: Number.parseFloat(feeAmount.toFixed(2)),
        discount_amount: discountAmount,
        discount_reason: discountInfo ? discountInfo.code : null,
        payment_proof_url: paymentProofUrl,
        payment_status: (orderType === 'takeaway' || orderType === 'reservation') ? 'paid' : undefined,
      }

      const { data, error } = await supabase.from("orders").insert([orderData]).select()
      if (error) {
        console.error("Supabase error:", error)
        throw error
      }
      
      if (data && data[0] && data[0].id) {
        setLastOrderId(data[0].id)
        
        // If this is a reservation, create the reservation record
        if (orderType === "reservation") {
          const reservationTimeFormatted = reservationTime.length === 5 ? reservationTime + ':00' : reservationTime;
          const reservationArgs = {
            p_order_id: data[0].id,
            p_reservation_date: reservationDate,
            p_reservation_time: reservationTimeFormatted,
            p_number_of_people: Number(numberOfPeople),
            p_table_preference: tablePreference || null,
            p_customer_name: customerName,
            p_customer_phone: customerPhone || null,
            p_customer_email: customerEmail || null,
            p_special_requests: globalOrderNotes || null,
            p_preorder_items: JSON.stringify(orderItems), // pass as JSONB
            p_payment_proof_url: paymentProofUrl // pass payment proof
          };
          console.log('create_reservation args:', reservationArgs);
          const { error: reservationError } = await supabase.rpc('create_reservation', reservationArgs)
          if (reservationError) {
            console.error("Reservation creation error:", reservationError)
            // Don't throw error here as the order was created successfully
          }
        }
      }
      
      setOrderSuccess(true)
      // Take a snapshot of cart and payment details for modal
      setOrderSnapshot({
        cart: [...cart],
        paymentScreenshotUrl,
        total: totalWithFeeAndDiscount,
        tableNumber: tableNumber,
      });
      
      // Snapshot reservation details for the confirmation modal
      if (orderType === "reservation") {
        setReservationSnapshot({
          date: reservationDate,
          time: reservationTime,
          people: numberOfPeople,
          table: tablePreference,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          total: totalWithFeeAndDiscount
        })
      }
      setTimeout(() => {
        setCart([])
        setGlobalOrderNotes("")
        setShowCart(false)
        setPaymentScreenshot(null)
        setPaymentScreenshotUrl(null)
        // Reset reservation fields
        if (orderType === "reservation") {
          setReservationDate("")
          setReservationTime("")
          setNumberOfPeople(2)
          setTablePreference("")
          setCustomerName("")
          setCustomerPhone("")
          setCustomerEmail("")
        }
      }, 2000)
    } catch (error: any) {
      console.error("Error placing order:", error)
      setError(error.message || "Failed to place order. Please try again.")
    } finally {
      setPlacingOrder(false)
    }
  }

  const getSizePrice = (basePrice: number, size: "S" | "M" | "L") => {
    const multiplier = size === "S" ? 0.8 : size === "L" ? 1.2 : 1
    return basePrice * multiplier
  }

  const handleCancelOrder = (order: any) => {
    setOrderToCancel(order)
    setCancelNotes("")
    setShowCancelDialog(true)
  }

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return
    
    setCancellingOrder(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "cancelled",
          cancel_notes: cancelNotes || null
        })
        .eq("id", orderToCancel.id)

      if (error) throw error

      // Close dialog and reset state
      setShowCancelDialog(false)
      setOrderToCancel(null)
      setCancelNotes("")
      
      // Show success message
      setError("Order cancelled successfully!")
      setTimeout(() => setError(null), 3000)
      
    } catch (error: any) {
      console.error("Error cancelling order:", error)
      setError("Failed to cancel order. Please try again.")
    } finally {
      setCancellingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-navy rounded-full flex items-center justify-center animate-pulse mx-auto mb-4">
            <span className="text-lg font-bold text-brand-cream">&</span>
          </div>
          <p className="text-brand-medium-brown">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-brand-dark-brown text-white">
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream to-white relative overflow-hidden">
      {/* Coffee Pattern Background */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23654321' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Cpath d='M20 20h4v4h-4zM36 36h4v4h-4z'/%3E%3Cpath d='M15 15c2-2 6-2 8 0s2 6 0 8-6 2-8 0-2-6 0-8zM45 45c2-2 6-2 8 0s2 6 0 8-6 2-8 0-2-6 0-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Floating Coffee Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-brand-caramel/20 text-4xl animate-pulse">☕</div>
        <div className="absolute top-40 right-20 text-brand-medium-brown/20 text-3xl animate-bounce" style={{animationDelay: '1s'}}>🫘</div>
        <div className="absolute bottom-40 left-20 text-brand-caramel/20 text-5xl animate-pulse" style={{animationDelay: '2s'}}>☕</div>
        <div className="absolute bottom-20 right-10 text-brand-medium-brown/20 text-3xl animate-bounce" style={{animationDelay: '0.5s'}}>🫘</div>
        <div className="absolute top-60 left-1/2 text-brand-caramel/20 text-2xl animate-pulse" style={{animationDelay: '1.5s'}}>☕</div>
      </div>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-caramel/20 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={backHref}>
                <Button variant="ghost" size="sm" className="hover:bg-brand-cream/50 rounded-full">
                  <ArrowLeft className="h-5 w-5 text-brand-navy" />
                </Button>
              </Link>
              <div className="bg-gradient-to-r from-brand-cream to-brand-caramel/20 rounded-lg px-3 py-2">
                <p className="text-xs text-brand-medium-brown font-medium">📍 Location</p>
                <p className="font-bold text-brand-navy">Eco Botanic, Johor</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                {isEditingTable ? (
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-brand-dark-brown to-brand-medium-brown text-white px-4 py-2 rounded-full shadow-md">
                    <span className="text-sm font-bold">🪑 Table</span>
                    <Input
                      value={editedTableNumber}
                      onChange={(e) => setEditedTableNumber(e.target.value)}
                      className="w-16 h-6 text-center text-xs bg-white text-black border-0 rounded"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleTableSave}
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleTableCancel}
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Button
                      onClick={() => setShowTableOptions(!showTableOptions)}
                      className="bg-gradient-to-r from-brand-dark-brown to-brand-medium-brown text-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <span className="text-sm font-bold">
                        {orderType === "reservation" ? "🍽️ Reservation" : `🪑 Table ${tableNumber}`}
                      </span>
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    
                    {showTableOptions && (
                       <div className="table-options-container absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-48 z-50">
                        <div className="space-y-2">
                          <Button
                            onClick={handleTableEdit}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left hover:bg-gray-100"
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Table Number
                          </Button>
                          <Button
                            onClick={handleGoHome}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left hover:bg-gray-100"
                          >
                            <Home className="h-4 w-4 mr-2" />
                            Go to Home
                          </Button>
                          <Button
                            onClick={handleCallService}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left hover:bg-gray-100"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call for Service
                          </Button>
                          <Button
                            onClick={handleRequestPayment}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left hover:bg-gray-100"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Request Payment
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-brand-caramel to-brand-medium-brown rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="mt-6 relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <Search className="h-5 w-5 text-brand-medium-brown" />
              <span className="text-brand-medium-brown text-sm">☕</span>
            </div>
            <Input
              placeholder="Search for your perfect coffee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-16 pr-4 py-3 bg-white/80 border-2 border-brand-caramel/30 focus:border-brand-caramel rounded-2xl shadow-inner text-brand-navy placeholder:text-brand-medium-brown/70 transition-all duration-200 hover:shadow-md focus:shadow-lg"
            />
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-700 mt-2"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Banner */}
      <div className="container mx-auto px-4 py-6">
        {/* Promo Banner Carousel */}
        <div className="w-full max-w-4xl mx-auto mb-8">
          {promoLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
            </div>
          ) : promos.length > 0 ? (
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <div className="flex transition-transform duration-700" style={{ transform: `translateX(-${currentPromoIndex * 100}%)` }}>
                {promos.map((promo) => (
                  <div
                    key={promo.id}
                    className="min-w-full flex-shrink-0 snap-center relative"
                  >
                    {/* Background Image Only */}
                    <div 
                      className="relative overflow-hidden rounded-2xl shadow-xl h-48 md:h-64"
                      style={{
                        backgroundImage: `url(${promo.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  </div>
                ))}
              </div>
              {/* Carousel indicators */}
              {promos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {promos.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-2 rounded-full transition-all duration-300 ${
                        index === currentPromoIndex ? 'bg-yellow-400' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
        
      </div>

      {/* Enhanced Category Tabs */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-brand-caramel/20">
          <h3 className="text-lg font-bold text-brand-navy mb-4 flex items-center">
            <span className="mr-2">🏷️</span>
            Browse Categories
          </h3>
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap transition-all duration-300 transform hover:scale-105 rounded-full px-6 py-2 font-medium shadow-md ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-brand-dark-brown to-brand-medium-brown hover:from-brand-dark-brown/90 hover:to-brand-medium-brown/90 text-white shadow-lg"
                    : "border-2 border-brand-caramel/50 text-brand-navy hover:bg-brand-cream hover:border-brand-caramel bg-white/80 backdrop-blur-sm"
                }`}
              >
                {category === "All" && "🌟"}
                {category === "Coffee" && "☕"}
                {category === "Tea" && "🍵"}
                {category === "Pastries" && "🥐"}
                {category === "Snacks" && "🍪"}
                {category === "Cold Drinks" && "🧊"}
                {category === "Hot Drinks" && "🔥"}
                <span className="ml-1">{category}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Products Grid */}
      <div className="container mx-auto px-4 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-brand-navy mb-2 flex items-center">
            <span className="mr-2">🍽️</span>
            Our Menu
          </h2>
          <p className="text-brand-medium-brown">
            Discover our carefully crafted selection of premium coffee and treats
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              onClick={() => setSelectedProduct(product)} 
              className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <MenuCard
                product={product}
                onAddToCart={() => setSelectedProduct(product)}
              />
            </div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">☕</div>
            <h3 className="text-xl font-semibold text-brand-navy mb-2">No items found</h3>
            <p className="text-brand-medium-brown">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>

      {/* Enhanced Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setShowCart(true)}
            size="lg"
            className="bg-gradient-to-r from-brand-dark-brown to-brand-medium-brown hover:from-brand-dark-brown/90 hover:to-brand-medium-brown/90 rounded-full shadow-2xl relative animate-bounce text-white font-bold px-6 py-3 border-2 border-white/20"
          >
            <ShoppingCart className="h-6 w-6 mr-2" />
            <span>Cart</span>
            <Badge className="absolute -top-3 -right-3 bg-brand-caramel text-white animate-pulse shadow-lg border-2 border-white min-w-[24px] h-6 flex items-center justify-center rounded-full">
              {getCartItemCount()}
            </Badge>
            {/* Floating coffee icon */}
            <div className="absolute -top-2 -left-2 text-lg animate-bounce" style={{animationDelay: '0.5s'}}>☕</div>
          </Button>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="p-6">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <ExtendedMenuCard
              product={selectedProduct}
              sizes={sizes}
              addOns={addOns}
              onAddToCart={(size, quantity, selectedAddOns) => {
                addToCart(selectedProduct, size, productNotes, quantity, selectedAddOns);
                setSelectedProduct(null);
              }}
            />
            {/* You can keep your upsell and notes UI if you want, or move them into ExtendedMenuCard */}
          </DialogContent>
        </Dialog>
      )}

      {/* Cart Modal */}
{showCart && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
    <Card className="w-full max-w-md bg-white max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 cart-modal">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-brand-navy">Order Summary</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowCart(false)} className="hover:bg-gray-100 rounded-full h-8 w-8 p-0">
            ×
          </Button>
        </div>
        
        {/* Order type and table information */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          {orderType === "dine_in" && (
            <div className="text-left text-brand-navy font-medium">
              Table Number: <span className="font-bold">{tableNumber}</span>
            </div>
          )}
        </div>

        {/* Order Type Radio Buttons (hide if takeaway mode) */}
        {mode !== "takeaway" && (
          <div className="mb-4">
            <Label className="text-brand-navy font-medium block mb-2">Order Type:</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={orderType === "dine_in" ? "default" : "outline"}
                size="sm"
                className={`flex-1 ${orderType === "dine_in" ? "bg-brand-navy text-white" : "text-brand-navy"}`}
                onClick={() => setOrderType("dine_in")}
              >
                Dine In
              </Button>
                    <Button
                      type="button"
                      variant={orderType === "takeaway" ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 ${orderType === "takeaway" ? "bg-brand-navy text-white" : "text-brand-navy"}`}
                      onClick={() => setOrderType("takeaway")}
                    >
                      Take Away
                    </Button>
                    <Button
                      type="button"
                      variant={orderType === "reservation" ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 ${orderType === "reservation" ? "bg-brand-navy text-white" : "text-brand-navy"}`}
                      onClick={() => setOrderType("reservation")}
                    >
                      Reservation
                    </Button>
                  </div>
                </div>
              )}

              {/* Reservation fields */}
              {orderType === "reservation" && (
                <div className="mb-6 space-y-4">
                  <div className="border border-brand-caramel/30 rounded-lg p-4 bg-brand-cream/20">
                    <h3 className="font-medium text-brand-navy mb-3">Reservation Details</h3>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label htmlFor="reservationDate" className="text-sm text-brand-medium-brown">
                          Date
                        </Label>
                        <Input
                          id="reservationDate"
                          type="date"
                          value={reservationDate}
                          onChange={(e) => {
                            setReservationDate(e.target.value)
                            if (e.target.value && reservationTime && numberOfPeople) {
                              fetchAvailableTables(e.target.value, reservationTime, numberOfPeople)
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="border-brand-caramel/30 focus:border-brand-caramel"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reservationTime" className="text-sm text-brand-medium-brown">
                          Time
                        </Label>
                        <Input
                          id="reservationTime"
                          type="time"
                          value={reservationTime}
                          onChange={(e) => {
                            setReservationTime(e.target.value)
                            if (reservationDate && e.target.value && numberOfPeople) {
                              fetchAvailableTables(reservationDate, e.target.value, numberOfPeople)
                            }
                          }}
                          className="border-brand-caramel/30 focus:border-brand-caramel"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label htmlFor="numberOfPeople" className="text-sm text-brand-medium-brown">
                          Number of People
                        </Label>
                        <Select value={numberOfPeople.toString()} onValueChange={(value) => {
                          const num = parseInt(value)
                          setNumberOfPeople(num)
                          if (reservationDate && reservationTime && num) {
                            fetchAvailableTables(reservationDate, reservationTime, num)
                          }
                        }}>
                          <SelectTrigger className="border-brand-caramel/30 focus:border-brand-caramel">
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
                        <Label htmlFor="tablePreference" className="text-sm text-brand-medium-brown">
                          Table Preference
                        </Label>
                        <Select value={tablePreference || "any"} onValueChange={value => setTablePreference(value === "any" ? "" : value)}>
                          <SelectTrigger className="border-brand-caramel/30 focus:border-brand-caramel">
                            <SelectValue placeholder="Any available table" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any available table</SelectItem>
                            {availableTables.map(table => (
                              <SelectItem key={table.table_number} value={table.table_number.toString()}>
                                Table {table.table_number} ({table.zone}, {table.capacity} seats)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="customerName" className="text-sm text-brand-medium-brown">
                          Your Name (Optional)
                        </Label>
                        <Input
                          id="customerName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter your full name"
                          className="border-brand-caramel/30 focus:border-brand-caramel"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="customerPhone" className="text-sm text-brand-medium-brown">
                            Phone Number
                          </Label>
                          <Input
                            id="customerPhone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="+60 12-345 6789"
                            className="border-brand-caramel/30 focus:border-brand-caramel"
                          />
                        </div>
                        <div>
                          <Label htmlFor="customerEmail" className="text-sm text-brand-medium-brown">
                            Email
                          </Label>
                          <Input
                            id="customerEmail"
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="border-brand-caramel/30 focus:border-brand-caramel"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment section for takeaway orders */}
              {(orderType === "takeaway" || orderType === "reservation") && (
                <div className="mb-6">
                  <div className="mb-4 flex flex-col items-center">
                    <span className="font-medium text-brand-navy mb-2">
                      Pay Now ({orderType === "takeaway" ? "Takeaway" : "Reservation"} Only)
                    </span>
                    <img src="/placeholder.jpg" alt="QR Code" className="w-40 h-40 object-contain border rounded mb-2" />
                    <span className="text-xs text-brand-medium-brown">Scan to pay. Upload your payment screenshot below.</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setPaymentScreenshot(file);
                        setPaymentScreenshotUrl(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                    <Button
                      type="button"
                      className="mb-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {paymentScreenshot ? "Change Screenshot" : "Upload Payment Screenshot"}
                    </Button>
                    {paymentScreenshotUrl && (
                      <img src={paymentScreenshotUrl} alt="Payment Screenshot" className="w-32 h-32 object-contain border rounded" />
                    )}
                  </div>
                </div>
              )}

              {/* Global Order Notes */}
              <div className="mb-6">
                <Label htmlFor="globalNotes" className="text-brand-navy font-medium mb-2 block">
                  Order Notes (Optional)
                </Label>
                <Textarea
                  id="globalNotes"
                  placeholder="e.g., Make it quick, Extra napkins, etc..."
                  value={globalOrderNotes}
                  onChange={(e) => setGlobalOrderNotes(e.target.value)}
                  className="border-brand-caramel/30 focus:border-brand-caramel"
                  rows={2}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4 mb-6 cart-items-container">
  <h3 className="font-medium text-brand-navy flex items-center gap-2 mb-2">
    <ShoppingCart className="h-4 w-4" />
    Cart Items ({getCartItemCount()})
  </h3>
  
  {cart.length === 0 ? (
    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
      <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500">Your cart is empty</p>
      <Button 
        variant="outline" 
        size="sm" 
        className="mt-3" 
        onClick={() => setShowCart(false)}
      >
        Browse Menu
      </Button>
    </div>
  ) : (
    <div className="max-h-[30vh] overflow-y-auto pr-1">
      {cart.map((item, index) => (
        <div
          key={`${item.id}-${item.size}-${index}`}
          className="border border-brand-caramel/20 rounded-lg p-3 mb-3 hover:border-brand-caramel/40 transition-colors"
        >
          <div className="flex items-start space-x-3">
            <div className="w-16 h-16 bg-brand-cream rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url.split("?")[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-brand-cream flex items-center justify-center">
                  <span className="text-2xl font-bold text-brand-navy">&</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <h4 className="font-medium text-brand-navy">{item.name}</h4>
                <span className="font-bold text-brand-caramel">RM{item.item_total.toFixed(2)}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                <p className="text-xs px-1.5 py-0.5 bg-brand-navy/10 rounded text-brand-navy">Size: {item.size}</p>
                <p className="text-xs px-1.5 py-0.5 bg-brand-navy/10 rounded text-brand-navy">Qty: {item.quantity} × RM{item.price.toFixed(2)}</p>
              </div>
              {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                <div className="mt-1">
                  <p className="text-xs text-brand-medium-brown">Add-ons: 
                    {item.selectedAddOns.map((addon, i) => (
                      <span key={i} className="text-xs">
                        {addon.name}{i < item.selectedAddOns.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                </div>
              )}
              {item.notes && (
                <p className="text-xs text-brand-caramel bg-brand-cream/50 px-2 py-1 rounded mt-1 line-clamp-1">
                  Note: {item.notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-brand-caramel/10">
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateCartQuantity(item.id, item.size, item.notes, -1)}
                className="w-7 h-7 p-0 rounded-full"
              >
                -
              </Button>
              <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateCartQuantity(item.id, item.size, item.notes, 1)}
                className="w-7 h-7 p-0 rounded-full"
              >
                +
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeFromCart(item.id, item.size, item.notes)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

              {/* Global Order Notes */}
              <div className="mb-6">
                <Label htmlFor="globalNotes" className="text-brand-navy font-medium mb-2 block">
                  Order Notes (Optional)
                </Label>
                <Textarea
                  id="globalNotes"
                  placeholder="e.g., Make it quick, Extra napkins, etc..."
                  value={globalOrderNotes}
                  onChange={(e) => setGlobalOrderNotes(e.target.value)}
                  className="border-brand-caramel/30 focus:border-brand-caramel"
                  rows={2}
                />
              </div>

              {/* Discount Code Input - moved here */}
              <div className="mt-4">
                <Label htmlFor="discountCode">Discount Code</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="discountCode"
                    value={discountCode}
                    onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="border-blue-300 focus:border-blue-500"
                    disabled={checkingDiscount}
                  />
                  <Button onClick={validateDiscountCode} disabled={checkingDiscount || !discountCode} variant="outline">
                    {checkingDiscount ? 'Checking...' : 'Apply'}
                  </Button>
                </div>
                {discountError && <div className="text-red-600 text-sm mt-1">{discountError}</div>}
                {discountInfo && !discountError && (
                  <div className="text-green-700 text-sm mt-1 flex items-center gap-2">
                    <span>
                      Code applied: {discountInfo.code} ({discountInfo.type === 'fixed' ? `RM${discountInfo.value}` : `${discountInfo.value}%`})
                    </span>
                    <button
                      type="button"
                      className="ml-2 text-red-600 underline text-xs"
                      onClick={() => {
                        setDiscountInfo(null);
                        setDiscountCode('');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-brand-caramel/20 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-brand-medium-brown">Subtotal</span>
                  <span className="font-medium text-brand-navy">RM{getCartTotal().toFixed(2)}</span>
                </div>
                {fees
                  .filter(fee => fee.active && (fee.applies_to === orderType || fee.applies_to === "both"))
                  .map(fee => (
                    <div className="flex justify-between items-center mb-2" key={fee.id}>
                      <span className="text-brand-medium-brown">{fee.name}</span>
                      <span className="font-medium text-brand-navy">
                        {fee.type === "percentage"
                          ? `${fee.amount}% (RM${((getCartTotal() * fee.amount) / 100).toFixed(2)})`
                          : `RM${fee.amount.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-2 text-green-700">
                    <span>Discount</span>
                    <span>-RM{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-brand-navy">Total</span>
                  <span className="text-brand-navy">RM{totalWithFeeAndDiscount.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={placeOrder}
                disabled={
                  placingOrder ||
                  cart.length === 0 ||
                  (orderType === "takeaway" && !paymentScreenshot)
                }
                className="w-full bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-brand-cream"
                size="lg"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : orderSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Order Placed!
                  </>
                ) : (
                  orderType === "reservation" ? "Confirm Reservation" : "Place Order"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Success Modal with Tracking Link/QR */}
      {orderSuccess && lastOrderId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white animate-in slide-in-from-bottom duration-300">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-brand-navy">
                {orderType === "reservation" ? "Reservation Confirmed!" : "Order Placed!"}
              </h2>
              <p className="mb-4 text-brand-medium-brown">
                {orderType === "reservation" 
                  ? `Thank you for your reservation. Your order will be prepared fresh and ready at ${reservationSnapshot?.time || 'your selected time'} on ${reservationSnapshot?.date || 'your selected date'}.`
                  : "Thank you for your order. You can track your order status here:"
                }
              </p>
              {orderType === "reservation" && reservationSnapshot ? (
                <div className="mb-4 bg-brand-cream/20 rounded-lg p-3 text-left">
                  <h3 className="font-medium text-brand-navy mb-2">Reservation Details:</h3>
                  <div className="text-sm text-brand-medium-brown space-y-1">
                    <p><strong>Name:</strong> {reservationSnapshot.name || 'N/A'}</p>
                    <p><strong>Date:</strong> {reservationSnapshot.date || 'N/A'}</p>
                    <p><strong>Time:</strong> {reservationSnapshot.time || 'N/A'}</p>
                    <p><strong>Party Size:</strong> {reservationSnapshot.people || 0} {(reservationSnapshot.people || 0) === 1 ? 'person' : 'people'}</p>
                    {reservationSnapshot.table && <p><strong>Table:</strong> {reservationSnapshot.table}</p>}
                    <p><strong>Total:</strong> RM{reservationSnapshot.total?.toFixed(2) || '0.00'}</p>
                    <p><strong>Order ID:</strong> {lastOrderId}</p>
                    {/* Show preorder items */}
                    {orderSnapshot?.cart && orderSnapshot.cart.length > 0 && (
                      <div className="mt-2">
                        <strong>Preorder Items:</strong>
                        <ul className="list-disc ml-5">
                          {orderSnapshot.cart.map((item, idx) => (
                            <li key={idx}>
                              {item.quantity}x {item.name} ({item.size}) - RM{item.item_total.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Show payment proof if uploaded */}
                    {orderSnapshot?.paymentScreenshotUrl && (
                      <div className="mt-2">
                        <strong>Payment Proof:</strong>
                        <div className="mt-1">
                          <img src={orderSnapshot.paymentScreenshotUrl} alt="Payment Proof" className="w-32 h-32 object-contain border rounded" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4 bg-brand-cream/20 rounded-lg p-3 text-left">
                  <h3 className="font-medium text-brand-navy mb-2">Order Details:</h3>
                  <div className="text-sm text-brand-medium-brown space-y-1">
                    {orderType === "dine_in" && (
                      <p><strong>Table Number:</strong> {orderSnapshot?.tableNumber}</p>
                    )}
                    <p><strong>Total:</strong> RM{orderSnapshot?.total.toFixed(2)}</p>
                    <p><strong>Order ID:</strong> {lastOrderId}</p>
                    <div className="mt-2">
                      <strong>Items:</strong>
                      <ul className="list-disc ml-5">
                        {orderSnapshot?.cart.map((item, idx) => (
                          <li key={idx}>
                            {item.quantity}x {item.name} ({item.size}) - RM{item.item_total.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {orderSnapshot?.paymentScreenshotUrl && (
                      <div className="mt-2">
                        <strong>Payment:</strong> <span>Online Payment (screenshot uploaded)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <a href={`/track/${lastOrderId}`} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-brand-cream mb-2">
                  Track {orderType === "reservation" ? "Reservation" : "Order"}
                </Button>
              </a>
              <Button onClick={() => setOrderSuccess(false)} className="w-full" variant="outline">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Cancel Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>
            </div>
            
            {orderToCancel && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Order Details:</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Order ID:</strong> {orderToCancel.id.slice(0, 8)}...</p>
                  <p><strong>Table:</strong> {orderToCancel.table_number}</p>
                  <p><strong>Total:</strong> RM{orderToCancel.total?.toFixed(2)}</p>
                  <p><strong>Items:</strong> {orderToCancel.items?.length || 0} items</p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="cancelNotes" className="text-sm font-medium text-gray-700">
                Cancellation Reason (Optional)
              </Label>
              <Textarea
                id="cancelNotes"
                placeholder="e.g., Customer requested cancellation, Out of stock, etc..."
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                className="mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false)
                setOrderToCancel(null)
                setCancelNotes("")
              }}
              disabled={cancellingOrder}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelOrder}
              disabled={cancellingOrder}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancellingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  )
}
