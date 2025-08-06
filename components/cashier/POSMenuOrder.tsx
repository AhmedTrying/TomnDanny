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

interface Fee {
  id: string
  name: string
  description: string
  amount: number
  type: "fixed" | "percentage"
  applies_to: "dine_in" | "takeaway" | "reservation" | "both"
  active: boolean
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

interface POSMenuOrderProps {
  tableNumber?: number | string
  onOrderPlaced?: () => void
  selectedCustomer?: Customer | null
  onCustomerChange?: (customer: Customer | null) => void
}

export default function POSMenuOrder({
  tableNumber: initialTableNumber = 1,
  onOrderPlaced,
  selectedCustomer,
  onCustomerChange,
}: POSMenuOrderProps) {
  // State variables
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<"S" | "M" | "L">("M")
  const [productNotes, setProductNotes] = useState("")
  const [globalOrderNotes, setGlobalOrderNotes] = useState("")
  const [tableNumber, setTableNumber] = useState<number | string>(initialTableNumber)
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "reservation">("dine_in")
  const [isLoading, setIsLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "visa" | "master" | "qr">("cash")
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [fees, setFees] = useState<Fee[]>([])
  const [availableDiscounts, setAvailableDiscounts] = useState<DiscountCode[]>([])
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(null)
  const [discountError, setDiscountError] = useState("")
  const [isLoadingDiscount, setIsLoadingDiscount] = useState(false)
  const [manualDiscountAmount, setManualDiscountAmount] = useState(0)
  const [manualDiscountReason, setManualDiscountReason] = useState("")
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)
  const [editItemNotes, setEditItemNotes] = useState("")
  const [editItemSize, setEditItemSize] = useState<"S" | "M" | "L">("M")
  const [editItemAddOns, setEditItemAddOns] = useState<AddOn[]>([])
  const [editItemAvailableAddOns, setEditItemAvailableAddOns] = useState<AddOn[]>([])
  const [productAddOns, setProductAddOns] = useState<AddOn[]>([])
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([])
  const [isCartExpanded, setIsCartExpanded] = useState(true)
  
  // New POS-specific state
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([])
  const [showParkedOrders, setShowParkedOrders] = useState(false)
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([])
  const [showSplitPayment, setShowSplitPayment] = useState(false)
  const [currentSplitPayment, setCurrentSplitPayment] = useState<SplitPayment>({
    method: "cash",
    amount: 0
  })
  const [remainingAmount, setRemainingAmount] = useState(0)
  const [isCartClosable, setIsCartClosable] = useState(true)

  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize states
  useEffect(() => {
    const urlTableNumber = searchParams.get('table')
    if (urlTableNumber) {
      setTableNumber(parseInt(urlTableNumber))
    }
  }, [searchParams])

  useEffect(() => {
    if (editingItem) {
      setEditItemNotes(editingItem.notes || "")
      setEditItemSize(editingItem.size)
      setEditItemAddOns(editingItem.selectedAddOns || [])
      fetchEditItemAddOns(editingItem.id)
    }
  }, [editingItem])

  useEffect(() => {
    if (selectedProduct) {
      fetchProductAddOns(selectedProduct.id)
    }
  }, [selectedProduct])

  // Fetch functions
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name')
      
      if (error) throw error
      setProducts(data || [])
      
      const uniqueCategories = Array.from(new Set(data?.map(p => p.category) || []))
      setCategories(['All', ...uniqueCategories])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('active', true)
        .order('name')
      
      if (error) throw error
      setFees(data || [])
    } catch (error) {
      console.error('Error fetching fees:', error)
    }
  }

  const fetchAvailableDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('active', true)
        .gte('expires_at', new Date().toISOString())
      
      if (error) throw error
      setAvailableDiscounts(data || [])
    } catch (error) {
      console.error('Error fetching discounts:', error)
    }
  }



  const applyManualDiscount = () => {
    if (manualDiscountAmount <= 0) {
      setDiscountError('Please enter a valid discount amount')
      return
    }

    if (manualDiscountAmount > getCartTotal()) {
      setDiscountError('Discount amount cannot exceed cart total')
      return
    }

    const manualDiscount: DiscountCode = {
      id: 'manual',
      code: 'MANUAL',
      description: manualDiscountReason || 'Manual discount',
      type: 'fixed',
      value: manualDiscountAmount,
      min_order_amount: 0,
      usage_limit: 1,
      usage_count: 0,
      active: true,
      expires_at: new Date().toISOString()
    }

    setSelectedDiscount(manualDiscount)
    setManualDiscountAmount(0)
    setManualDiscountReason('')
    setDiscountError('')
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

  const fetchEditItemAddOns = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_add_ons')
        .select('*')
        .eq('product_id', productId)
        .eq('active', true)
      
      if (error) throw error
      setEditItemAvailableAddOns(data || [])
    } catch (error) {
      console.error('Error fetching edit item add-ons:', error)
      setEditItemAvailableAddOns([])
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchFees()
    fetchAvailableDiscounts()
  }, [])

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Cart functions
  const addToCart = (product: Product, size: "S" | "M" | "L", notes?: string, addOns: AddOn[] = []) => {
    const sizeMultiplier = size === "S" ? 0.8 : size === "L" ? 1.2 : 1
    const basePrice = product.price * sizeMultiplier
    const addOnsPrice = addOns.reduce((sum, addOn) => sum + addOn.price, 0)
    const itemPrice = basePrice + addOnsPrice
    
    const existingItemIndex = cart.findIndex((item) => 
      item.id === product.id && 
      item.size === size && 
      item.notes === notes &&
      JSON.stringify(item.selectedAddOns) === JSON.stringify(addOns)
    )
    
    if (existingItemIndex > -1) {
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity += 1
      updatedCart[existingItemIndex].item_total = updatedCart[existingItemIndex].quantity * itemPrice
      setCart(updatedCart)
    } else {
      const cartItem: CartItem = {
        ...product,
        quantity: 1,
        size,
        notes,
        item_total: itemPrice,
        selectedAddOns: addOns
      }
      setCart([...cart, cartItem])
    }
    
    setSelectedProduct(null)
    setProductNotes("")
    setSelectedAddOns([])
  }

  const updateCartQuantity = (id: string, size: string, notes: string | undefined, newQuantity: number, addOns?: any[]) => {
    if (newQuantity <= 0) {
      removeFromCart(id, size, notes, addOns)
      return
    }
    
    const updatedCart = cart.map((item) => {
      if (item.id === id && item.size === size && item.notes === notes && 
          JSON.stringify(item.selectedAddOns) === JSON.stringify(addOns || item.selectedAddOns)) {
        const sizeMultiplier = size === "S" ? 0.8 : size === "L" ? 1.2 : 1
        const basePrice = item.price * sizeMultiplier
        const addOnsPrice = (item.selectedAddOns || []).reduce((sum: number, addOn: any) => sum + addOn.price, 0)
        const itemPrice = basePrice + addOnsPrice
        
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

  const getSubtotalWithFees = () => {
    const subtotal = getCartTotal()
    const applicableFees = fees.filter(fee => 
      fee.applies_to === orderType || fee.applies_to === 'both'
    )
    
    let totalFees = 0
    let runningTotal = subtotal
    
    applicableFees.forEach(fee => {
      const feeAmount = fee.type === 'percentage' 
        ? runningTotal * (fee.amount / 100)
        : fee.amount
      totalFees += feeAmount
      runningTotal += feeAmount
    })
    
    return subtotal + totalFees
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

  const updateCartItem = (originalItem: CartItem, newSize: string, newNotes: string, newAddOns: AddOn[]) => {
    // Remove the original item
    const cartWithoutOriginal = cart.filter(item => 
      !(item.id === originalItem.id && 
        item.size === originalItem.size && 
        item.notes === originalItem.notes &&
        JSON.stringify(item.selectedAddOns) === JSON.stringify(originalItem.selectedAddOns))
    )
    
    // Calculate new price
    const sizeMultiplier = newSize === "S" ? 0.8 : newSize === "L" ? 1.2 : 1
    const basePrice = originalItem.price * sizeMultiplier
    const addOnsPrice = newAddOns.reduce((sum, addOn) => sum + addOn.price, 0)
    const itemPrice = basePrice + addOnsPrice
    
    // Check if an item with the new configuration already exists
    const existingItemIndex = cartWithoutOriginal.findIndex(item => 
      item.id === originalItem.id && 
      item.size === newSize && 
      item.notes === newNotes &&
      JSON.stringify(item.selectedAddOns) === JSON.stringify(newAddOns)
    )
    
    if (existingItemIndex > -1) {
      // Merge with existing item
      const updatedCart = [...cartWithoutOriginal]
      updatedCart[existingItemIndex].quantity += originalItem.quantity
      updatedCart[existingItemIndex].item_total = updatedCart[existingItemIndex].quantity * itemPrice
      setCart(updatedCart)
    } else {
      // Create new item with updated configuration
      const updatedItem: CartItem = {
        ...originalItem,
        size: newSize as "S" | "M" | "L",
        notes: newNotes,
        selectedAddOns: newAddOns,
        item_total: originalItem.quantity * itemPrice
      }
      setCart([...cartWithoutOriginal, updatedItem])
    }
    
    setEditingItem(null)
    setEditItemNotes('')
    setEditItemSize('M')
    setEditItemAddOns([])
    setEditItemAvailableAddOns([])
  }

  const getFinalTotal = () => {
    const subtotal = getCartTotal()
    
    // Calculate fees based on database values
    const applicableFees = fees.filter(fee => 
      fee.applies_to === orderType || fee.applies_to === 'both'
    )
    
    let totalFees = 0
    let runningTotal = subtotal
    
    applicableFees.forEach(fee => {
      const feeAmount = fee.type === 'percentage' 
        ? runningTotal * (fee.amount / 100)
        : fee.amount
      totalFees += feeAmount
      runningTotal += feeAmount
    })
    
    const discountAmount = selectedDiscount 
      ? selectedDiscount.type === 'percentage' 
        ? subtotal * (selectedDiscount.value / 100)
        : selectedDiscount.value
      : manualDiscountAmount
    
    return Math.max(0, subtotal + totalFees - discountAmount)
  }

  const clearCart = () => {
    setCart([])
    setGlobalOrderNotes("")
    setSelectedDiscount(null)
    setCustomerName("")
    setCustomerPhone("")
    setCustomerEmail("")
    setManualDiscountAmount(0)
    setManualDiscountReason("")
    setSplitPayments([])
    setRemainingAmount(0)
  }

  const addSplitPayment = () => {
    if (currentSplitPayment.amount <= 0 || currentSplitPayment.amount > remainingAmount) return
    
    setSplitPayments([...splitPayments, currentSplitPayment])
    setRemainingAmount(remainingAmount - currentSplitPayment.amount)
    setCurrentSplitPayment({ method: "cash", amount: 0 })
    
    if (remainingAmount - currentSplitPayment.amount <= 0) {
      setShowSplitPayment(false)
    }
  }

  const removeSplitPayment = (index: number) => {
    const payment = splitPayments[index]
    setSplitPayments(splitPayments.filter((_, i) => i !== index))
    setRemainingAmount(remainingAmount + payment.amount)
  }

  const deductStock = async (orderItems: any[]) => {
    try {
      for (const item of orderItems) {
        const product = products.find(p => p.id === item.product_id)
        if (product?.track_stock && product.stock_quantity !== undefined) {
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

  // Update remaining amount when split payments or total changes
  useEffect(() => {
    const total = getFinalTotal()
    const paidAmount = splitPayments.reduce((sum, payment) => sum + payment.amount, 0)
    setRemainingAmount(total - paidAmount)
  }, [splitPayments, cart, selectedDiscount, manualDiscountAmount])

  const placeOrder = async () => {
    if (cart.length === 0) return
    
    setIsPlacingOrder(true)
    
    try {
      let paymentProofUrl = null
      
      // Upload payment proof if QR payment
      if (paymentMethod === 'qr' && paymentScreenshot) {
        const fileExt = paymentScreenshot.name.split('.').pop()
        const fileName = `payment-proof-${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentScreenshot)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName)
        
        paymentProofUrl = publicUrl
      }
      
      // Prepare order items
      const orderItems = cart.map((item) => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
        item_total: item.item_total,
        notes: item.notes || null,
        selected_addons: item.selectedAddOns || []
      }))
      
      // Calculate totals
      const subtotal = getCartTotal()
      
      // Calculate fees based on database values
      const applicableFees = fees.filter(fee => 
        fee.applies_to === orderType || fee.applies_to === 'both'
      )
      
      let totalFees = 0
      let runningTotal = subtotal
      
      applicableFees.forEach(fee => {
        const feeAmount = fee.type === 'percentage' 
          ? runningTotal * (fee.amount / 100)
          : fee.amount
        totalFees += feeAmount
        runningTotal += feeAmount
      })
      
      const discountAmount = selectedDiscount 
        ? selectedDiscount.type === 'percentage' 
          ? subtotal * (selectedDiscount.value / 100)
          : selectedDiscount.value
        : manualDiscountAmount
      
      const finalTotal = Math.max(0, subtotal + totalFees - discountAmount)
      
      // Prepare order data
      const orderData = {
        table_number: tableNumber,
        dining_type: orderType,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        items: orderItems,
        subtotal,
        fees_total: totalFees,
        discount_amount: discountAmount,
        discount_reason: selectedDiscount?.code || (manualDiscountReason ? 'Manual Discount' : null),
        total: finalTotal,
        payment_method: splitPayments.length > 0 ? 'split' : paymentMethod,
        split_payments: splitPayments.length > 0 ? splitPayments : null,
        cash_received: paymentMethod === 'cash' ? cashReceived : null,
        payment_proof_url: paymentProofUrl,
        order_notes: globalOrderNotes || null,
        status: 'pending'
      }
      
      // Insert order
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()
      
      if (orderError) throw orderError
      
      // Deduct stock
      await deductStock(orderItems)
      
      // Update customer stats if in POS mode
      if (customerPhone) {
        const { error: customerError } = await supabase
          .from('customers')
          .upsert({
            phone: customerPhone,
            name: customerName,
            email: customerEmail || null,
            total_spent: finalTotal,
            total_orders: 1
          }, {
            onConflict: 'phone',
            ignoreDuplicates: false
          })
        
        if (customerError) console.error('Error updating customer:', customerError)
      }
      
      setOrderSuccess(true)
      clearCart()
      await fetchProducts() // Refresh stock
      
      if (onOrderPlaced) {
        onOrderPlaced()
      }
      
      setTimeout(() => {
        setOrderSuccess(false)
      }, 3000)
      
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-3 md:p-4 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          {/* Search and Filter */}
          <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow relative">
                {product.ribbon_text && (
                  <div 
                    className="absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded z-10"
                    style={{ backgroundColor: product.ribbon_color || '#ef4444' }}
                  >
                    {product.ribbon_text}
                  </div>
                )}
                <CardContent className="p-3 md:p-4" onClick={() => setSelectedProduct(product)}>
                  <div className="aspect-square mb-2 md:mb-3 overflow-hidden rounded-lg">
                    <img
                      src={product.image_url || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2 leading-tight min-h-[2.5rem] flex items-center">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 md:mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-green-600">RM{product.price.toFixed(2)}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{product.rating}</span>
                      <span className="text-xs text-gray-500">({product.reviews_count})</span>
                    </div>
                  </div>
                  {product.track_stock && (
                    <div className="text-sm text-gray-500">
                      Stock: {product.stock_quantity || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-3 md:p-4">
              {/* Cart Header */}
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <h3 className="font-semibold">Cart ({getCartItemCount()})</h3>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={parkOrder}
                        className="flex items-center gap-1"
                      >
                        <Pause className="h-4 w-4" />
                        Park
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowParkedOrders(true)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Parked ({parkedOrders.length})
                      </Button>
                    </>
                  )}
                  {isCartClosable && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsCartExpanded(!isCartExpanded)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {isCartExpanded && (
                <>
                  {/* Cart Items */}
                  <div className="space-y-2 md:space-y-3 mb-3 md:mb-4 max-h-64 overflow-y-auto">
                    {cart.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                    ) : (
                      cart.map((item, index) => (
                        <div key={`${item.id}-${item.size}-${item.notes}-${index}`} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 border rounded-lg">
                          <img
                            src={item.image_url || '/placeholder.jpg'}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-gray-500">Size: {item.size}</p>
                            {item.notes && <p className="text-xs text-gray-500">Notes: {item.notes}</p>}
                            {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                              <p className="text-xs text-gray-500">
                                Add-ons: {item.selectedAddOns.map(a => a.name).join(', ')}
                              </p>
                            )}
                            <p className="text-sm font-medium text-green-600">RM{item.item_total.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                              className="p-1 h-8 w-8"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.id, item.size, item.notes, item.quantity - 1, item.selectedAddOns)}
                                className="p-1 h-8 w-8"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.id, item.size, item.notes, item.quantity + 1, item.selectedAddOns)}
                                className="p-1 h-8 w-8"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id, item.size, item.notes, item.selectedAddOns)}
                              className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {cart.length > 0 && (
                    <>
                      {/* Order Details */}
                      <div className="space-y-3 mb-4">
                        <div>
                          <Label className="text-sm font-medium">Table Number</Label>
                          <Input
                            type="number"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(parseInt(e.target.value) || 1)}
                            className="mt-1"
                          />
                        </div>

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

                        {(orderType === "takeaway" || orderType === "reservation") && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium">Customer Name (Optional)</Label>
                              <Input
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Enter customer name"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Phone Number (Optional)</Label>
                              <Input
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="Enter phone number"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Email (Optional)</Label>
                              <Input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-3 mb-4">
                        <Label className="text-sm font-medium">Payment Method</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {["cash", "visa", "master", "qr"].map((method) => (
                            <Button
                              key={method}
                              variant={paymentMethod === method ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPaymentMethod(method as any)}
                              className="capitalize"
                            >
                              {method === "qr" ? "QR Payment" : method}
                            </Button>
                          ))}
                        </div>

                        {paymentMethod === "cash" && (
                          <div>
                            <Label className="text-sm font-medium">Cash Received</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={cashReceived}
                              onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                              placeholder="Enter cash received"
                              className="mt-1"
                            />
                            {cashReceived > 0 && (
                              <p className="text-sm mt-1">
                                Change: RM{(cashReceived - getFinalTotal()).toFixed(2)}
                              </p>
                            )}
                          </div>
                        )}

                        {paymentMethod === "qr" && (
                          <div>
                            <Label className="text-sm font-medium">Payment Screenshot</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handlePaymentProofChange}
                              className="mt-1"
                              ref={fileInputRef}
                            />
                          </div>
                        )}
                      </div>

                      {/* Split Payments */}
                      {splitPayments.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <Label className="text-sm font-medium">Split Payments</Label>
                          {splitPayments.map((payment, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm capitalize">{payment.method}: RM{payment.amount.toFixed(2)}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeSplitPayment(index)}
                                className="p-1 h-6 w-6 text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Discount Section */}
                      <div className="space-y-3 mb-4">
                        <Label className="text-sm font-medium">Discount</Label>
                        
                        {/* Available Discount Codes */}
                        <div className="space-y-2">
                          {availableDiscounts.length > 0 ? (
                            <Select onValueChange={(value) => {
                               const discount = availableDiscounts.find(d => d.code === value)
                               if (discount) {
                                 // Validate minimum order amount against subtotal + fees
                                 const subtotalWithFees = getSubtotalWithFees()
                                 if (subtotalWithFees < discount.min_order_amount) {
                                   setDiscountError(`Minimum order amount of RM${discount.min_order_amount} required for this discount`)
                                   return
                                 }
                                 setSelectedDiscount(discount)
                                 setDiscountError("")
                               }
                             }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a discount code" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableDiscounts.map((discount) => (
                                  <SelectItem key={discount.id} value={discount.code}>
                                    {discount.code} - {discount.description} 
                                    ({discount.type === 'percentage' ? `${discount.value}%` : `RM${discount.value}`})
                                    {discount.min_order_amount > 0 && (
                                      <span className="text-xs text-gray-500"> - Min: RM{discount.min_order_amount}</span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm text-gray-500">No discount codes available</p>
                          )}
                        </div>
                        
                        {/* Manual Discount */}
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Manual Discount</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Amount"
                              value={manualDiscountAmount || ""}
                              onChange={(e) => setManualDiscountAmount(parseFloat(e.target.value) || 0)}
                              className="flex-1"
                            />
                            <Input
                              placeholder="Reason"
                              value={manualDiscountReason}
                              onChange={(e) => setManualDiscountReason(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              onClick={applyManualDiscount}
                              disabled={manualDiscountAmount <= 0}
                              variant="outline"
                              size="sm"
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                        
                        {/* Applied Discount Display */}
                        {selectedDiscount && (
                          <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">{selectedDiscount.code}</span>
                              <span className="text-xs text-green-600">({selectedDiscount.description})</span>
                            </div>
                            <Button
                               size="sm"
                               variant="ghost"
                               onClick={() => {
                                 setSelectedDiscount(null)
                                 setManualDiscountAmount(0)
                                 setManualDiscountReason("")
                                 setDiscountError("")
                               }}
                               className="p-1 h-6 w-6 text-green-600 hover:text-green-700"
                             >
                               <X className="h-3 w-3" />
                             </Button>
                          </div>
                        )}
                        
                        {/* Discount Error */}
                        {discountError && (
                          <p className="text-sm text-red-600">{discountError}</p>
                        )}
                      </div>

                      {/* Order Notes */}
                      <div className="mb-4">
                        <Label className="text-sm font-medium">Order Notes</Label>
                        <Textarea
                          placeholder="Any special instructions..."
                          value={globalOrderNotes}
                          onChange={(e) => setGlobalOrderNotes(e.target.value)}
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      {/* Order Summary */}
                      <div className="space-y-2 mb-3 md:mb-4 p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>RM{getCartTotal().toFixed(2)}</span>
                        </div>
                        {/* Dynamic Fees */}
                        {fees.filter(fee => fee.applies_to === orderType || fee.applies_to === 'both').map((fee, index) => {
                          const subtotal = getCartTotal()
                          let runningTotal = subtotal
                          
                          // Calculate running total up to this fee
                          fees.filter(f => f.applies_to === orderType || f.applies_to === 'both')
                               .slice(0, index)
                               .forEach(prevFee => {
                                 const prevFeeAmount = prevFee.type === 'percentage' 
                                   ? runningTotal * (prevFee.amount / 100)
                                   : prevFee.amount
                                 runningTotal += prevFeeAmount
                               })
                          
                          const feeAmount = fee.type === 'percentage' 
                            ? runningTotal * (fee.amount / 100)
                            : fee.amount
                          
                          return (
                            <div key={fee.id} className="flex justify-between text-sm">
                              <span>{fee.name} ({fee.type === 'percentage' ? `${fee.amount}%` : `RM${fee.amount}`}):</span>
                              <span>RM{feeAmount.toFixed(2)}</span>
                            </div>
                          )
                        })}
                        {(selectedDiscount || manualDiscountAmount > 0) && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount:</span>
                            <span>-RM{(
                              selectedDiscount 
                                ? selectedDiscount.type === 'percentage' 
                                  ? getCartTotal() * (selectedDiscount.value / 100)
                                  : selectedDiscount.value
                                : manualDiscountAmount
                            ).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>RM{getFinalTotal().toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => {
                            setRemainingAmount(getFinalTotal())
                            setShowSplitPayment(true)
                          }}
                          variant="outline"
                          className="w-full flex items-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          Split Payment
                        </Button>
                        
                        <Button
                          onClick={placeOrder}
                          disabled={isPlacingOrder || 
                            (paymentMethod === "cash" && cashReceived < getFinalTotal()) ||
                            (paymentMethod === "qr" && !paymentScreenshot) ||
                            (splitPayments.length > 0 && remainingAmount > 0) ||
                            ((orderType === "takeaway" || orderType === "reservation") && (!customerName || !customerPhone))
                          }
                          className="w-full"
                        >
                          {isPlacingOrder ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {splitPayments.length > 0 ? 'Processing Split Payment...' : 'Placing Order...'}
                            </>
                          ) : (
                            splitPayments.length > 0 ? `Complete Payment (RM${remainingAmount.toFixed(2)} remaining)` : 'Place Order'
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Selection Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <img
                src={selectedProduct.image_url || '/placeholder.jpg'}
                alt={selectedProduct.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <p className="text-gray-600">{selectedProduct.description}</p>
              
              <div>
                <Label className="text-sm font-medium">Size</Label>
                <div className="flex gap-2 mt-1">
                  {["S", "M", "L"].map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSize(size as "S" | "M" | "L")}
                    >
                      {size} - RM{(selectedProduct.price * (size === "S" ? 0.8 : size === "L" ? 1.2 : 1)).toFixed(2)}
                    </Button>
                  ))}
                </div>
              </div>

              {productAddOns.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Add-ons</Label>
                  <div className="space-y-2 mt-1">
                    {productAddOns.map((addOn) => (
                      <div key={addOn.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={addOn.id}
                          checked={selectedAddOns.some(a => a.id === addOn.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddOns([...selectedAddOns, addOn])
                            } else {
                              setSelectedAddOns(selectedAddOns.filter(a => a.id !== addOn.id))
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={addOn.id} className="text-sm flex-1">
                          {addOn.name} (+RM{addOn.price.toFixed(2)})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">Special Instructions</Label>
                <Textarea
                  placeholder="Any special requests..."
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Total Price:</span>
                <span className="text-xl font-bold text-green-600">
                  RM{(
                    selectedProduct.price * (selectedSize === "S" ? 0.8 : selectedSize === "L" ? 1.2 : 1) +
                    selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button onClick={() => addToCart(selectedProduct!, selectedSize, productNotes, selectedAddOns)}>
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Success Modal */}
      <Dialog open={orderSuccess} onOpenChange={setOrderSuccess}>
        <DialogContent className="max-w-md mx-4 text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Order Placed Successfully!
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">Your order has been sent to the kitchen.</p>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={editingItem.image_url || '/placeholder.jpg'}
                  alt={editingItem.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <h4 className="font-medium">{editingItem.name}</h4>
                  <p className="text-sm text-gray-500">Quantity: {editingItem.quantity}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Size</Label>
                <div className="flex gap-2 mt-1">
                  {["S", "M", "L"].map((size) => {
                    const sizePrice = editingItem.price * (size === "S" ? 0.8 : size === "L" ? 1.2 : 1)
                    return (
                      <Button
                        key={size}
                        variant={editItemSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditItemSize(size as "S" | "M" | "L")}
                      >
                        {size} - RM{sizePrice.toFixed(2)}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {editItemAvailableAddOns.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Add-ons</Label>
                  <div className="space-y-2 mt-1 max-h-32 overflow-y-auto">
                    {editItemAvailableAddOns.map((addOn) => (
                      <div key={addOn.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-addon-${addOn.id}`}
                          checked={editItemAddOns.some(a => a.id === addOn.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditItemAddOns([...editItemAddOns, addOn])
                            } else {
                              setEditItemAddOns(editItemAddOns.filter(a => a.id !== addOn.id))
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`edit-addon-${addOn.id}`} className="text-sm flex-1">
                          {addOn.name} (+RM{addOn.price.toFixed(2)})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">Special Instructions</Label>
                <Textarea
                  placeholder="Enter special instructions..."
                  value={editItemNotes}
                  onChange={(e) => setEditItemNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">New Total Price:</span>
                <span className="text-lg font-bold text-green-600">
                  RM{(
                    editingItem.quantity * (
                      editingItem.price * (editItemSize === "S" ? 0.8 : editItemSize === "L" ? 1.2 : 1) +
                      editItemAddOns.reduce((sum, addOn) => sum + addOn.price, 0)
                    )
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingItem) {
                  updateCartItem(editingItem, editItemSize, editItemNotes, editItemAddOns)
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Parked Orders Dialog */}
      <Dialog open={showParkedOrders} onOpenChange={setShowParkedOrders}>
        <DialogContent className="max-w-2xl mx-4">
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
        <DialogContent className="max-w-md mx-4">
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