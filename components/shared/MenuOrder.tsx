"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Search, Star, Plus, ShoppingCart, Loader2, CheckCircle, Tag, X, Pause, Edit, CreditCard, Minus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  rating: number
  reviews_count: number
  stock_quantity?: number
  track_stock?: boolean
  ribbon_text?: string
  ribbon_color?: string
}

interface AddOn {
  id: string
  product_id: string
  name: string
  price: number
  active: boolean
}

interface CartItem extends Product {
  quantity: number
  size: "S" | "M" | "L"
  notes?: string
  item_total: number
  selectedAddOns?: any[]
}

interface ParkedOrder {
  id: string
  cart: CartItem[]
  tableNumber: number | string
  orderType: "dine_in" | "takeaway" | "reservation"
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  globalOrderNotes: string
  selectedDiscount?: DiscountCode | null
  timestamp: Date
}

interface SplitPayment {
  method: "cash" | "visa" | "master" | "qr"
  amount: number
  cashReceived?: number
  screenshot?: File | null
}

interface DiscountCode {
  id: string
  code: string
  description: string
  type: "percentage" | "fixed"
  value: number
  min_order_amount: number
  usage_limit: number
  usage_count: number
  active: boolean
  expires_at: string
  applies_to?: string[]
}

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  loyalty_points: number
  total_orders: number
  total_spent: number
}

interface MenuOrderProps {
  tableNumber?: number | string
  onOrderPlaced?: () => void
  showTableInput?: boolean
  showOrderType?: boolean
  orderTypeDefault?: "dine_in" | "takeaway" | "reservation"
  promoBanner?: React.ReactNode
  locationInfo?: React.ReactNode
  quickProducts?: Product[]
  selectedCustomer?: Customer | null
  onCustomerChange?: (customer: Customer | null) => void
  isPOSMode?: boolean
}

export default function MenuOrder({
  tableNumber: initialTableNumber = 1,
  onOrderPlaced,
  showTableInput = false,
  showOrderType = false,
  orderTypeDefault = "dine_in",
  promoBanner,
  locationInfo,
  quickProducts = [],
  selectedCustomer,
  onCustomerChange,
  isPOSMode = false,
}: MenuOrderProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<"S" | "M" | "L">("M")
  const [productNotes, setProductNotes] = useState("")
  const [globalOrderNotes, setGlobalOrderNotes] = useState("")
  const [tableNumber, setTableNumber] = useState(initialTableNumber)
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "reservation">(orderTypeDefault)
  const [loading, setLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "visa" | "master" | "qr">("cash")
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [cashReceived, setCashReceived] = useState<string>("")
  
  // Customer information states
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [fees, setFees] = useState<any[]>([])
  const [availableDiscounts, setAvailableDiscounts] = useState<DiscountCode[]>([])
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(null)
  const [discountCode, setDiscountCode] = useState("")
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)
  const [manualDiscountAmount, setManualDiscountAmount] = useState("")
  const [manualDiscountReason, setManualDiscountReason] = useState("")
  const [editingItem, setEditingItem] = useState<{ id: string; size: string; notes?: string; selectedAddOns?: any[] } | null>(null)
  const [editItemNotes, setEditItemNotes] = useState("")
  const [productAddOns, setProductAddOns] = useState<AddOn[]>([])
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([])
  const [isCartExpanded, setIsCartExpanded] = useState(isPOSMode)
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // New enhanced features state
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([])
  const [showParkedOrders, setShowParkedOrders] = useState(false)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([])
  const [showSplitPayment, setShowSplitPayment] = useState(false)
  const [remainingAmount, setRemainingAmount] = useState(0)
  const [currentSplitPayment, setCurrentSplitPayment] = useState<SplitPayment>({
    method: "cash",
    amount: 0
  })
  const [isCartClosable, setIsCartClosable] = useState(!isPOSMode)

  useEffect(() => {
    fetchProducts()
    fetchAvailableDiscounts()
    fetchFees()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, selectedCategory, searchQuery])

  // Ensure cart is always expanded in POS mode
  useEffect(() => {
    if (isPOSMode) {
      setIsCartExpanded(true)
    }
  }, [isPOSMode])

  useEffect(() => {
    setTableNumber(initialTableNumber)
  }, [initialTableNumber])

  useEffect(() => {
    if (editingItem) {
      setEditItemNotes(editingItem.notes || "")
    }
  }, [editingItem])

  useEffect(() => {
    if (selectedProduct) {
      fetchProductAddOns(selectedProduct.id)
      setSelectedAddOns([])
    }
  }, [selectedProduct])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*")
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products
    if (selectedCategory !== "All") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    setFilteredProducts(filtered)
    const uniqueCategories = Array.from(new Set(products.map((product) => product.category)))
    setCategories(["All", ...uniqueCategories])
  }

  const addToCart = async (product: Product, size: "S" | "M" | "L" = "M", notes?: string, addOns: AddOn[] = []) => {
    setIsPlacingOrder(true)
    
    try {
      const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0)
      const itemPrice = getSizePrice(product.price, size) + addOnsTotal
      
      const existingItemIndex = cart.findIndex(
        (item) => item.id === product.id && item.size === size && item.notes === notes && 
        JSON.stringify(item.selectedAddOns) === JSON.stringify(addOns)
      )
      
      if (existingItemIndex >= 0) {
        const updatedCart = [...cart]
        updatedCart[existingItemIndex].quantity += 1
        updatedCart[existingItemIndex].item_total = updatedCart[existingItemIndex].quantity * itemPrice
        setCart(updatedCart)
      } else {
        const newItem: CartItem = {
          ...product,
          quantity: 1,
          size,
          notes,
          item_total: itemPrice,
          selectedAddOns: addOns
        }
        setCart([...cart, newItem])
      }
      setSelectedProduct(null)
      setProductNotes("")
      setSelectedAddOns([])
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const updateCartQuantity = (id: string, size: string, notes: string | undefined, change: number, addOns?: any[]) => {
    const updatedCart = cart
      .map((item) => {
        if (item.id === id && item.size === size && item.notes === notes && 
            JSON.stringify(item.selectedAddOns) === JSON.stringify(addOns || item.selectedAddOns)) {
          const newQuantity = Math.max(0, item.quantity + change)
          if (newQuantity === 0) {
            return null
          }
          const addOnsTotal = (item.selectedAddOns || []).reduce((total, addOn) => total + addOn.price, 0)
          const itemPrice = getSizePrice(item.price, item.size) + addOnsTotal
          return {
            ...item,
            quantity: newQuantity,
            item_total: newQuantity * itemPrice
          }
        }
        return item
      })
      .filter(Boolean) as CartItem[]
    setCart(updatedCart)
  }

  const removeFromCart = (id: string, size: string, notes: string | undefined, addOns?: any[]) => {
    setCart(cart.filter((item) => !(item.id === id && item.size === size && item.notes === notes && 
      JSON.stringify(item.selectedAddOns) === JSON.stringify(addOns || item.selectedAddOns))))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.item_total, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPaymentScreenshot(file)
    } else {
      setPaymentScreenshot(null)
    }
  }

  // Enhanced POS Features Functions
  const parkOrder = () => {
    if (cart.length === 0) return
    
    const parkedOrder: ParkedOrder = {
      id: `parked-${Date.now()}`,
      cart: [...cart],
      tableNumber,
      orderType,
      customerName,
      customerPhone,
      customerEmail,
      globalOrderNotes,
      selectedDiscount,
      timestamp: new Date()
    }
    
    setParkedOrders([...parkedOrders, parkedOrder])
    clearCart()
  }

  const loadParkedOrder = (parkedOrder: ParkedOrder) => {
    setCart(parkedOrder.cart)
    setTableNumber(parkedOrder.tableNumber)
    setOrderType(parkedOrder.orderType)
    setCustomerName(parkedOrder.customerName || '')
    setCustomerPhone(parkedOrder.customerPhone || '')
    setCustomerEmail(parkedOrder.customerEmail || '')
    setGlobalOrderNotes(parkedOrder.globalOrderNotes)
    setSelectedDiscount(parkedOrder.selectedDiscount)
    setParkedOrders(parkedOrders.filter(o => o.id !== parkedOrder.id))
    setShowParkedOrders(false)
  }

  const updateCartItemNotes = (id: string, size: string, oldNotes: string | undefined, newNotes: string, addOns?: any[]) => {
    const updatedCart = cart.map(item => {
      if (item.id === id && item.size === size && item.notes === oldNotes && 
          JSON.stringify(item.selectedAddOns) === JSON.stringify(addOns || item.selectedAddOns)) {
        return { ...item, notes: newNotes }
      }
      return item
    })
    setCart(updatedCart)
    setEditingItem(null)
    setEditItemNotes('')
  }

  const getFinalTotal = () => {
    const subtotal = getCartTotal()
    const serviceCharge = subtotal * 0.06
    const tax = (subtotal + serviceCharge) * 0.08
    const discountAmount = selectedDiscount 
      ? selectedDiscount.type === 'percentage' 
        ? subtotal * (selectedDiscount.value / 100)
        : selectedDiscount.value
      : manualDiscountAmount
    
    return Math.max(0, subtotal + serviceCharge + tax - discountAmount)
  }

  const clearCart = () => {
    setCart([])
    setGlobalOrderNotes("")
    setSelectedDiscount(null)
    setCustomerName("")
    setCustomerPhone("")
    setCustomerEmail("")
    setSplitPayments([])
    setShowSplitPayment(false)
  }

  const addSplitPayment = () => {
    if (currentSplitPayment.amount <= 0) return
    
    setSplitPayments([...splitPayments, { ...currentSplitPayment }])
    setCurrentSplitPayment({ method: "cash", amount: 0 })
    
    const totalPaid = splitPayments.reduce((sum, payment) => sum + payment.amount, 0) + currentSplitPayment.amount
    setRemainingAmount(Math.max(0, getFinalTotal() - totalPaid))
  }

  const removeSplitPayment = (index: number) => {
    const newSplitPayments = splitPayments.filter((_, i) => i !== index)
    setSplitPayments(newSplitPayments)
    
    const totalPaid = newSplitPayments.reduce((sum, payment) => sum + payment.amount, 0)
    setRemainingAmount(Math.max(0, getFinalTotal() - totalPaid))
  }

  const deductStock = async (orderItems: any[]) => {
    try {
      for (const item of orderItems) {
        const product = products.find(p => p.id === item.product_id)
        if (product && product.track_stock && product.stock_quantity !== undefined) {
          const newStock = Math.max(0, product.stock_quantity - item.quantity)
          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id)
        }
      }
    } catch (error) {
      console.error('Error deducting stock:', error)
    }
  }

  const placeOrder = async () => {
    if (cart.length === 0) return
    
    setIsPlacingOrder(true)
    try {
      let paymentProofUrl = null
      if (paymentMethod === 'qr' && paymentScreenshot) {
        const fileExt = paymentScreenshot.name.split('.').pop()
        const fileName = `payment-proof-${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentScreenshot)
        
        if (uploadError) {
          console.error('Error uploading payment proof:', uploadError)
          throw new Error('Failed to upload payment proof')
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName)
        
        paymentProofUrl = publicUrl
      }
      
      const orderItems = cart.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        size: item.size,
        price: getSizePrice(item.price, item.size),
        notes: item.notes || null,
        item_total: item.item_total,
        add_ons: item.selectedAddOns || []
      }))
      
      const subtotal = getCartTotal()
      const serviceCharge = subtotal * 0.06
      const tax = subtotal * 0.10
      const discountAmount = getDiscountAmount()
      const finalTotal = subtotal + serviceCharge + tax - discountAmount
      
      const orderData = {
        table_number: tableNumber,
        dining_type: orderType,
        items: orderItems,
        total: finalTotal,
        subtotal: subtotal,
        fees_total: serviceCharge + tax,
        discount_amount: discountAmount,
        discount_reason: selectedDiscount?.code || null,
        order_notes: globalOrderNotes || null,
        payment_method: splitPayments.length > 0 ? 'split' : paymentMethod,
        payment_proof_url: paymentProofUrl,
        cash_received: paymentMethod === 'cash' ? parseFloat(cashReceived) || null : null,
        change_due: paymentMethod === 'cash' ? getChangeDue() : null,
        customer_id: selectedCustomer?.id || null,
        customer_name: (orderType === "takeaway" || orderType === "reservation") ? customerName : null,
        customer_phone: (orderType === "takeaway" || orderType === "reservation") ? customerPhone : null,
        customer_email: (orderType === "takeaway" || orderType === "reservation") ? customerEmail : null,
        split_payments: splitPayments.length > 0 ? splitPayments : null,
        status: "pending"
      }
      
      const { data, error } = await supabase.from("orders").insert([orderData]).select()
      if (error) throw error
      
      if (selectedCustomer && isPOSMode) {
        const newTotalSpent = selectedCustomer.total_spent + getFinalTotal()
        const newTotalOrders = selectedCustomer.total_orders + 1
        await supabase
          .from('customers')
          .update({
            total_spent: newTotalSpent,
            total_orders: newTotalOrders
          })
          .eq('id', selectedCustomer.id)
        
        if (onCustomerChange) {
          const updatedCustomer = {
            ...selectedCustomer,
            total_spent: newTotalSpent,
            total_orders: newTotalOrders
          }
          onCustomerChange(updatedCustomer)
        }
      }
      
      // Deduct stock for products that track inventory
      await deductStock(orderItems)
      
      setOrderSuccess(true)
      clearCart()
      
      // Refresh products to show updated stock
      await fetchProducts()
      setCashReceived("")
      setPaymentScreenshot(null)
      
      setTimeout(() => {
        setOrderSuccess(false)
        if (onOrderPlaced) {
          onOrderPlaced()
        }
      }, 3000)
      
      if (selectedDiscount && selectedDiscount.id !== "manual") {
        await supabase
          .from("discount_codes")
          .update({ usage_count: selectedDiscount.usage_count + 1 })
          .eq("id", selectedDiscount.id)
      }
    } catch (error: any) {
      console.error("Error placing order:", error)
      alert("Failed to place order. Please try again.")
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const getSizePrice = (basePrice: number, size: "S" | "M" | "L") => {
    const multipliers = { S: 0.8, M: 1, L: 1.2 }
    return basePrice * multipliers[size]
  }

  const fetchAvailableDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("active", true)
        .gte("expires_at", new Date().toISOString())
      
      setAvailableDiscounts(data || [])
    } catch (error) {
      console.error("Failed to fetch discounts:", error)
    }
  }

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .eq("active", true)
      
      if (error) throw error
      setFees(data || [])
    } catch (error) {
      console.error("Error fetching fees:", error)
    }
  }

  const fetchProductAddOns = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_add_ons')
        .select('*')
        .eq('product_id', productId)
        .eq('active', true)

      if (error) throw error
      setProductAddOns(data || [])
    } catch (error) {
      console.error('Error fetching add-ons:', error)
      setProductAddOns([])
    }
  }

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code")
      return
    }
    setDiscountLoading(true)
    setDiscountError(null)
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode.trim().toUpperCase())
        .eq("active", true)
        .gte("expires_at", new Date().toISOString())
        .single()
      if (error || !data) {
        setDiscountError("Invalid or expired discount code")
        return
      }
      if (!Array.isArray(data.applies_to) || !data.applies_to.includes(orderType)) {
        setDiscountError("This discount is not valid for this order type.")
        return
      }
      const subtotal = getCartTotal()
      if (subtotal < data.min_order_amount) {
        setDiscountError(`Minimum order amount is RM${data.min_order_amount.toFixed(2)}`)
        return
      }
      if (data.usage_count >= data.usage_limit) {
        setDiscountError("This discount code has reached its usage limit")
        return
      }
      setSelectedDiscount(data)
      setDiscountCode("")
      setDiscountError(null)
    } catch (error) {
      setDiscountError("Failed to apply discount code")
    } finally {
      setDiscountLoading(false)
    }
  }

  const applyManualDiscount = () => {
    const amount = parseFloat(manualDiscountAmount)
    if (isNaN(amount) || amount <= 0) {
      setDiscountError("Please enter a valid discount amount")
      return
    }

    const subtotal = getCartTotal()
    if (amount > subtotal) {
      setDiscountError("Discount amount cannot exceed order total")
      return
    }

    const manualDiscount: DiscountCode = {
      id: "manual",
      code: "MANUAL",
      description: manualDiscountReason || "Manual discount",
      type: "fixed",
      value: amount,
      min_order_amount: 0,
      usage_limit: 1,
      usage_count: 0,
      active: true,
      expires_at: new Date().toISOString(),
    }

    setSelectedDiscount(manualDiscount)
    setManualDiscountAmount("")
    setManualDiscountReason("")
    setDiscountError(null)
  }

 const removeDiscount = () => {
    setSelectedDiscount(null)
    setDiscountCode("")
    setDiscountError(null)
  }

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns(prev => {
      const isSelected = prev.find(item => item.id === addOn.id)
      if (isSelected) {
        return prev.filter(item => item.id !== addOn.id)
      } else {
        return [...prev, addOn]
      }
    })
  }

  const getAddOnsTotal = () => {
    return selectedAddOns.reduce((total, addOn) => total + addOn.price, 0)
  }
  const getDiscountAmount = () => {
    if (!selectedDiscount) return 0
    const subtotal = getCartTotal()
    if (selectedDiscount.type === "percentage") {
      return (subtotal * selectedDiscount.value) / 100
    } else {
      return selectedDiscount.value
    }
  }

  const getApplicableFees = () => {
    const subtotal = getCartTotal()
    return fees
      .filter(fee => fee.applies_to === orderType || fee.applies_to === "both")
      .reduce((total, fee) => {
        if (fee.type === "percentage") {
          return total + (subtotal * fee.amount) / 100
        }
        return total + fee.amount
      }, 0)
  }



  const getChangeDue = () => {
    const received = parseFloat(cashReceived) || 0
    const total = getFinalTotal()
    return received - total
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center animate-pulse mx-auto mb-4">
            <span className="text-lg font-bold text-white">&</span>
          </div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-white">
      {/* Main Menu Area */}
      <div className="w-full overflow-y-auto">
        {/* Optional location info */}
        {locationInfo}
        {/* Optional promo banner */}
        {promoBanner}
        
        {/* Search and Filter Section */}
        <div className="p-4 bg-white border-b">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              {product.ribbon_text && (
                <div 
                  className="absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded z-10"
                  style={{ backgroundColor: product.ribbon_color || '#ef4444' }}
                >
                  {product.ribbon_text}
                </div>
              )}
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 leading-tight min-h-[3rem] flex items-center">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-green-600">RM{product.price.toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">{product.rating} ({product.reviews_count})</span>
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedProduct(product)}
                  className="w-full"
                  disabled={product.track_stock && product.stock_quantity === 0}
                >
                  {product.track_stock && product.stock_quantity === 0 ? (
                    "Out of Stock"
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Product Selection Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg">
              <img
                src={selectedProduct?.image_url}
                alt={selectedProduct?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-gray-600">{selectedProduct?.description}</p>
            
            {/* Size Selection */}
            <div>
              <Label className="text-sm font-medium">Size</Label>
              <div className="flex gap-2 mt-2">
                {["S", "M", "L"].map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSize(size as "S" | "M" | "L")}
                  >
                    {size} - RM{selectedProduct ? getSizePrice(selectedProduct.price, size as "S" | "M" | "L").toFixed(2) : "0.00"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            {productAddOns.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Add-ons</Label>
                <div className="space-y-2 mt-2">
                  {productAddOns.map((addOn) => (
                    <div key={addOn.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`addon-${addOn.id}`}
                          checked={selectedAddOns.some(item => item.id === addOn.id)}
                          onChange={() => toggleAddOn(addOn)}
                          className="rounded"
                        />
                        <label htmlFor={`addon-${addOn.id}`} className="text-sm">
                          {addOn.name}
                        </label>
                      </div>
                      <span className="text-sm font-medium">+RM{addOn.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Special Instructions</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests..."
                value={productNotes}
                onChange={(e) => setProductNotes(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Price Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="text-xl font-bold text-green-600">
                  RM{selectedProduct ? (getSizePrice(selectedProduct.price, selectedSize) + getAddOnsTotal()).toFixed(2) : "0.00"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedProduct && addToCart(selectedProduct, selectedSize, productNotes, selectedAddOns)}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Cart"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cart */}
      <div className={`fixed ${isPOSMode ? 'right-0 top-0 h-full w-96' : 'bottom-0 left-0 right-0'} bg-white border-t ${isPOSMode ? 'border-l' : ''} shadow-lg z-50`}>
        {/* Cart Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-semibold">Cart ({getCartItemCount()})</span>
            </div>
            <div className="flex items-center gap-2">
              {isPOSMode && cart.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={parkOrder}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Park
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowParkedOrders(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Parked ({parkedOrders.length})
                  </Button>
                </>
              )}
              {isCartClosable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCartExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {!isPOSMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCartExpanded(!isCartExpanded)}
                >
                  {isCartExpanded ? "Collapse" : "Expand"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Cart Content */}
        <div className={`${isCartExpanded || isPOSMode ? 'block' : 'hidden'} ${isPOSMode ? 'h-full flex flex-col' : ''}`}>
          {/* Cart Items */}
          <div className={`${isPOSMode ? 'flex-1 overflow-y-auto' : 'max-h-64 overflow-y-auto'} p-4`}>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={`${item.id}-${item.size}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-gray-600">Size: {item.size}</p>
                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <p className="text-xs text-gray-600">
                          Add-ons: {item.selectedAddOns.map(addon => addon.name).join(", ")}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-gray-600 truncate">Note: {item.notes}</p>
                      )}
                      <p className="text-sm font-semibold text-green-600">RM{item.item_total.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isPOSMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem({ id: item.id, size: item.size, notes: item.notes, selectedAddOns: item.selectedAddOns })}
                          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(item.id, item.size, item.notes, -1, item.selectedAddOns)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(item.id, item.size, item.notes, 1, item.selectedAddOns)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id, item.size, item.notes, item.selectedAddOns)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary and Checkout */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Table Number Input */}
              {showTableInput && (
                <div>
                  <Label htmlFor="table-number" className="text-sm font-medium">Table Number</Label>
                  <Input
                    id="table-number"
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Order Type Selection */}
              {showOrderType && (
                <div>
                  <Label className="text-sm font-medium">Order Type</Label>
                  <Select value={orderType} onValueChange={(value: "dine_in" | "takeaway" | "reservation") => setOrderType(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine_in">Dine In</SelectItem>
                      <SelectItem value="takeaway">Takeaway</SelectItem>
                      <SelectItem value="reservation">Reservation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Customer Information for Takeaway/Reservation */}
              {(orderType === "takeaway" || orderType === "reservation") && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customer-name" className="text-sm font-medium">Customer Name (Optional)</Label>
                    <Input
                      id="customer-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-phone" className="text-sm font-medium">Phone Number (Optional)</Label>
                    <Input
                      id="customer-phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-email" className="text-sm font-medium">Email (Optional)</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Discount Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm font-medium">Discount</span>
                </div>
                
                {selectedDiscount ? (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                    <div>
                      <span className="text-sm font-medium text-green-800">{selectedDiscount.code}</span>
                      <p className="text-xs text-green-600">{selectedDiscount.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-800">-RM{getDiscountAmount().toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeDiscount}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter discount code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={applyDiscountCode}
                        disabled={discountLoading}
                        size="sm"
                      >
                        {discountLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                    
                    {/* Manual Discount for POS Mode */}
                    {isPOSMode && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs text-gray-600">Manual Discount</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Amount"
                            type="number"
                            step="0.01"
                            value={manualDiscountAmount}
                            onChange={(e) => setManualDiscountAmount(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Reason"
                            value={manualDiscountReason}
                            onChange={(e) => setManualDiscountReason(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                        <Button
                          onClick={applyManualDiscount}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          Apply Manual Discount
                        </Button>
                      </div>
                    )}
                    
                    {discountError && (
                      <p className="text-xs text-red-600">{discountError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <Label className="text-sm font-medium">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: "cash" | "visa" | "master" | "qr") => setPaymentMethod(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="master">Mastercard</SelectItem>
                    <SelectItem value="qr">QR Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cash Payment Details */}
              {paymentMethod === 'cash' && (
                <div>
                  <Label htmlFor="cash-received" className="text-sm font-medium">Cash Received</Label>
                  <Input
                    id="cash-received"
                    type="number"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Enter amount received"
                    className="mt-1"
                  />
                  {cashReceived && (
                    <div className="mt-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span>RM{getFinalTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Change:</span>
                        <span className={getChangeDue() >= 0 ? 'text-green-600' : 'text-red-600'}>
                          RM{getChangeDue().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* QR Payment Screenshot */}
              {paymentMethod === 'qr' && (
                <div>
                  <Label htmlFor="payment-proof" className="text-sm font-medium">Payment Screenshot</Label>
                  <Input
                    id="payment-proof"
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentProofChange}
                    className="mt-1"
                    ref={fileInputRef}
                  />
                  {paymentScreenshot && (
                    <p className="text-xs text-green-600 mt-1">Screenshot uploaded: {paymentScreenshot.name}</p>
                  )}
                </div>
              )}

              {/* Order Notes */}
              <div>
                <Label htmlFor="order-notes" className="text-sm font-medium">Order Notes</Label>
                <Textarea
                  id="order-notes"
                  placeholder="Any special instructions for the kitchen..."
                  value={globalOrderNotes}
                  onChange={(e) => setGlobalOrderNotes(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>

              {/* Order Summary */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>RM{getCartTotal().toFixed(2)}</span>
                </div>
                {fees.map((fee) => {
                  if (fee.applies_to === orderType || fee.applies_to === "both") {
                    const feeAmount = fee.type === "percentage" 
                      ? (getCartTotal() * fee.amount) / 100 
                      : fee.amount
                    return (
                      <div key={fee.id} className="flex justify-between text-sm">
                        <span>{fee.name}:</span>
                        <span>RM{feeAmount.toFixed(2)}</span>
                      </div>
                    )
                  }
                  return null
                })}
                {selectedDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({selectedDiscount.code}):</span>
                    <span>-RM{getDiscountAmount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>RM{getFinalTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Split Payment Section */}
              {isPOSMode && splitPayments.length > 0 && (
                <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm">Split Payments:</h4>
                  {splitPayments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{payment.method.toUpperCase()}: RM{payment.amount.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSplitPayment(index)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-sm font-medium">
                    Remaining: RM{(getFinalTotal() - splitPayments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Payment Buttons */}
              <div className="space-y-2">
                {isPOSMode && (
                  <Button
                    onClick={() => {
                      setShowSplitPayment(true)
                      setRemainingAmount(getFinalTotal() - splitPayments.reduce((sum, p) => sum + p.amount, 0))
                    }}
                    variant="outline"
                    className="w-full"
                    disabled={cart.length === 0}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Split Payment
                  </Button>
                )}
                
                <Button
                  onClick={placeOrder}
                  disabled={isPlacingOrder || 
                    (splitPayments.length === 0 && paymentMethod === 'cash' && (!cashReceived || getChangeDue() < 0)) ||
                    (splitPayments.length === 0 && paymentMethod === 'qr' && !paymentScreenshot) ||
                    (splitPayments.length > 0 && splitPayments.reduce((sum, p) => sum + p.amount, 0) < getFinalTotal()) ||
                    ((orderType === "takeaway" || orderType === "reservation") && (!customerName || !customerPhone))
                  }
                  className="w-full"
                  size="lg"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    `${splitPayments.length > 0 ? 'Complete' : 'Place'} Order - RM${getFinalTotal().toFixed(2)}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Success Modal */}
      <Dialog open={orderSuccess} onOpenChange={setOrderSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Order Placed Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Your order has been received and is being prepared.</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Order Total:</span>
                <span className="font-semibold">RM{getFinalTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Table Number:</span>
                <span className="font-semibold">{tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Order Type:</span>
                <span className="font-semibold capitalize">{orderType.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Notes Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter special instructions..."
              value={editItemNotes}
              onChange={(e) => setEditItemNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingItem) {
                  updateCartItemNotes(
                    editingItem.id, 
                    editingItem.size, 
                    editingItem.notes, 
                    editItemNotes,
                    editingItem.selectedAddOns
                  )
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Parked Orders Dialog */}
      <Dialog open={showParkedOrders} onOpenChange={setShowParkedOrders}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Parked Orders ({parkedOrders.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {parkedOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No parked orders</p>
            ) : (
              parkedOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Table {order.tableNumber} - {order.orderType.replace('_', ' ')}</h4>
                      <p className="text-sm text-gray-600">{order.timestamp.toLocaleString()}</p>
                      {order.customerName && (
                        <p className="text-sm text-gray-600">Customer: {order.customerName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">RM{order.cart.reduce((sum, item) => sum + item.item_total, 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{order.cart.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.cart.slice(0, 3).map((item, idx) => (
                      <span key={idx}>
                        {item.name} ({item.quantity}x)
                        {idx < Math.min(order.cart.length, 3) - 1 ? ', ' : ''}
                      </span>
                    ))}
                    {order.cart.length > 3 && ` +${order.cart.length - 3} more`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => loadParkedOrder(order)}
                      className="flex-1"
                    >
                      Load Order
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setParkedOrders(parkedOrders.filter(o => o.id !== order.id))}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Split Payment Dialog */}
      <Dialog open={showSplitPayment} onOpenChange={setShowSplitPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Split Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">RM{getFinalTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className="font-medium text-red-600">RM{remainingAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Payment Method</Label>
              <Select 
                value={currentSplitPayment.method} 
                onValueChange={(value: "cash" | "visa" | "master" | "qr") => 
                  setCurrentSplitPayment({...currentSplitPayment, method: value})
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="master">Mastercard</SelectItem>
                  <SelectItem value="qr">QR Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Amount</Label>
              <Input
                type="number"
                step="0.01"
                max={remainingAmount}
                value={currentSplitPayment.amount}
                onChange={(e) => setCurrentSplitPayment({...currentSplitPayment, amount: parseFloat(e.target.value) || 0})}
                placeholder="Enter amount"
                className="mt-1"
              />
            </div>
            
            {currentSplitPayment.method === 'cash' && (
              <div>
                <Label className="text-sm font-medium">Cash Received</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentSplitPayment.cashReceived || ''}
                  onChange={(e) => setCurrentSplitPayment({...currentSplitPayment, cashReceived: parseFloat(e.target.value) || 0})}
                  placeholder="Enter cash received"
                  className="mt-1"
                />
                {currentSplitPayment.cashReceived && currentSplitPayment.amount && (
                  <p className="text-sm mt-1">
                    Change: RM{(currentSplitPayment.cashReceived - currentSplitPayment.amount).toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSplitPayment(false)}>
              Cancel
            </Button>
            <Button 
              onClick={addSplitPayment}
              disabled={currentSplitPayment.amount <= 0 || currentSplitPayment.amount > remainingAmount}
            >
              Add Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}