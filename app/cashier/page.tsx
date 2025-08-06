"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/protected-route"
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  CreditCard,
  Printer,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Loader2,
  Plus,
  ShoppingCart,
  History,
  Edit,
  Trash2,
  Search,
  Bell,
  Receipt,
  Save,
  LogOut,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
  AlertTriangle,
  User,
  Phone,
  Info,
  Timer,
  ChevronsUpDown,
  Menu,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useSettings } from '@/lib/settings-context'
import { useSmartRefresh } from "@/hooks/use-smart-refresh"
import { useSoundNotifications } from "@/hooks/use-sound-notifications"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ChangeEvent } from "react"
import dynamic from "next/dynamic"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
const POSMenuOrder = dynamic(() => import("@/components/cashier/POSMenuOrder"), { ssr: false })
import TableStatusIndicator from "@/components/cashier/table-status-indicator"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

interface Order {
  id: string
  table_number: number
  items: any[]
  total: number
  subtotal: number
  fees_total: number
  discount_amount: number
  discount_reason: string
  dining_type: "dine_in" | "takeaway" | "reservation"
  status: string
  order_notes: string
  created_at: string
  payment_method?: string
  payment_notes?: string
  payment_proof_url?: string
  payment_status?: string
  cancel_notes?: string
  reservation_time?: string
  customer_name?: string
  table_preference?: string
  number_of_people?: number
  customer_phone?: string
  reservation_date?: string
  reservation_notes?: string
  order_items?: any[]
  order_total?: number
  customer_email?: string
}

interface ServiceRequest {
  id: string
  table_number: number
  type: string
  status: string
  created_at: string
}

interface Product {
  id: string
  name: string
  price: number
  category: string
}

interface ManualOrderItem {
  id: string
  name: string
  price: number
  quantity: number
  size: string
  notes?: string
}

interface Fee {
  id: string
  name: string
  amount: number
  type: "fixed" | "percentage"
  applies_to: "dine_in" | "takeaway" | "reservation" | "both"
}

interface TableStatus {
  table_number: number
  status: string
  is_available: boolean
  current_order_id: string | null
  order_total: number | null
  order_status: string | null
  zone: string
  capacity: number
}

// Add helper for countdown
function getCountdown(reservationDate: string, reservationTime: string) {
  if (!reservationDate || !reservationTime) return null;
  const now = new Date();
  const target = new Date(`${reservationDate}T${reservationTime}`);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return "Started";
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours > 0) return `${hours}h ${remMins}m`;
  return `${remMins} min`;
}

export default function CashierDashboard() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([])
  const [dateRange, setDateRange] = useState("today")
  const [customDate, setCustomDate] = useState(new Date().toISOString().split("T")[0])
  const [dailyStats, setDailyStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrder: 0,
    busyHours: [],
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  // Manual Order State
  const [manualOrderTable, setManualOrderTable] = useState<number>(1)
  const [manualOrderItems, setManualOrderItems] = useState<ManualOrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemSize, setItemSize] = useState("M")
  const [itemNotes, setItemNotes] = useState("")
  const [manualOrderType, setManualOrderType] = useState<"dine_in" | "takeaway">("dine_in")
  const [manualPaymentMethod, setManualPaymentMethod] = useState<string>("cash")
  const [manualPaymentNotes, setManualPaymentNotes] = useState<string>("")
  const [manualPaymentProofFile, setManualPaymentProofFile] = useState<File | null>(null)
  const [manualPaymentProofUploading, setManualPaymentProofUploading] = useState(false)
  const [manualPaymentError, setManualPaymentError] = useState<string>("")

  // Payment Processing State
  const [processingOrder, setProcessingOrder] = useState<Order | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountReason, setDiscountReason] = useState("")
  const [selectedDiningType, setSelectedDiningType] = useState<"dine_in" | "takeaway" | "reservation">("dine_in")
  const [selectedFees, setSelectedFees] = useState<string[]>([])

  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editOrderItems, setEditOrderItems] = useState<any[]>([])
  const [editOrderNotes, setEditOrderNotes] = useState("")

  // Cancel Order State
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelNotes, setCancelNotes] = useState("")
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)

  // Cancel Individual Items State
  const [showCancelItemsDialog, setShowCancelItemsDialog] = useState(false)
  const [orderToCancelItems, setOrderToCancelItems] = useState<Order | null>(null)
  const [selectedItemsToCancel, setSelectedItemsToCancel] = useState<Set<number>>(new Set())
  const [cancelItemsNotes, setCancelItemsNotes] = useState("")
  const [cancellingItems, setCancellingItems] = useState(false)

  const settings = useSettings()
  const cafeName = settings?.cafe_name || 'TOMM&DANNY CAFÉ'
  const cafeLocation = settings?.location || 'Eco Botanic, Johor'

  const [processingTable, setProcessingTable] = useState<number | null>(null)
  const [showTablePaymentModal, setShowTablePaymentModal] = useState(false)

  // Add state for payment method and notes
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [paymentNotes, setPaymentNotes] = useState<string>("")
  
  // Add state for table payment discount
  const [tablePaymentDiscount, setTablePaymentDiscount] = useState(0)
  const [tablePaymentDiscountReason, setTablePaymentDiscountReason] = useState("")

  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [paymentProofUploading, setPaymentProofUploading] = useState(false)
  const [paymentError, setPaymentError] = useState<string>("")

  const [processingTakeawayOrder, setProcessingTakeawayOrder] = useState<Order | null>(null)
  const [showTakeawayPaymentModal, setShowTakeawayPaymentModal] = useState(false)
  const [takeawayPaymentMethod, setTakeawayPaymentMethod] = useState<string>("cash")
  const [takeawayPaymentNotes, setTakeawayPaymentNotes] = useState<string>("")
  const [takeawayPaymentProofFile, setTakeawayPaymentProofFile] = useState<File | null>(null)
  const [takeawayPaymentProofUploading, setTakeawayPaymentProofUploading] = useState(false)
  const [takeawayPaymentError, setTakeawayPaymentError] = useState<string>("")

  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false)
  const [splitPaymentItems, setSplitPaymentItems] = useState<Record<string, string | number>>({}) // {itemKey: quantity}
  const [splitPaymentMethod, setSplitPaymentMethod] = useState('cash')
  const [splitPaymentNotes, setSplitPaymentNotes] = useState('')
  const [splitPaymentProofFile, setSplitPaymentProofFile] = useState<File | null>(null)
  const [splitPaymentProofUploading, setSplitPaymentProofUploading] = useState(false)
  const [splitPaymentError, setSplitPaymentError] = useState('')
  const [splitPayments, setSplitPayments] = useState<any[]>([]) // previous payments for this order
  const [splitPaymentLoading, setSplitPaymentLoading] = useState(false)

  // Add after orderHistory state
  const [orderPayments, setOrderPayments] = useState<Record<string, any[]>>({});

  // Add after editOrderNotes state
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>("cash");
  const [editPaymentNotes, setEditPaymentNotes] = useState<string>("");
  const [editPaymentProofFile, setEditPaymentProofFile] = useState<File | null>(null);
  const [editPaymentProofUploading, setEditPaymentProofUploading] = useState(false);

  const [todayLog, setTodayLog] = useState<any>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [kitchenProductIds, setKitchenProductIds] = useState<Set<string>>(new Set())

  // Today's Celebration State
  const [celebrationDate, setCelebrationDate] = useState(new Date().toISOString().split("T")[0])
  const [celebrationCoffeeName, setCelebrationCoffeeName] = useState('Colombian Gesha')
  const [celebrationDescription, setCelebrationDescription] = useState('Experience delicate notes of jasmine, bergamot, and honey.')
  const [celebrationImage, setCelebrationImage] = useState<string | null>(null)
  const [celebrationImageFile, setCelebrationImageFile] = useState<File | null>(null)
  const [celebrationLoading, setCelebrationLoading] = useState(false)
  const [celebrationSuccess, setCelebrationSuccess] = useState('')
  const [celebrationError, setCelebrationError] = useState('')

  // Add orderNotes state for the modal form
  const [orderNotes, setOrderNotes] = useState("")

  // Group dine-in orders by table number, only for orders not paid/cancelled
  const dineInOrdersByTable: { [tableNumber: string]: Order[] } = useMemo(() => {
    const groups: { [tableNumber: string]: Order[] } = {}
    filteredOrders
      .filter((order) => order.dining_type === 'dine_in')
      .forEach((order) => {
        if (!groups[order.table_number]) groups[order.table_number] = []
        groups[order.table_number].push(order)
      })
    return groups
  }, [filteredOrders])

  // Create a filtered list for takeaway orders
  const takeawayOrders = useMemo(() => {
    return filteredOrders.filter((order) => order.dining_type === 'takeaway' && order.status !== 'payment_verification');
  }, [filteredOrders]);

  // Create a filtered list for orders needing payment verification
  const paymentVerificationOrders = useMemo(() => {
    return filteredOrders.filter((order) => order.status === 'payment_verification');
  }, [filteredOrders]);

  // Smart auto-refresh every 30 seconds when user is not active
  const { manualRefresh, forceRefresh, isUserActive } = useSmartRefresh({
    interval: 30000, // 30 seconds
    enabled: activeTab === "dashboard" || activeTab === "orders", // Only enable for live order tabs
    onRefresh: async () => {
      if (activeTab === "dashboard" || activeTab === "orders") {
        await fetchOrders()
        await fetchServiceRequests()
        await fetchDailyStats()
      }
      setLastRefresh(new Date())
    },
    userActivityThreshold: 5000 // 5 seconds after user activity
  })

  // Sound notifications for new orders and service requests
  const { checkNewOrders, checkNewServiceRequests, testSound } = useSoundNotifications({
    enabled: soundEnabled,
    volume: 0.5
  })

  // List of upcoming reservations (not paid/cancelled/completed/no_show), sorted by soonest reservation time
  const [upcomingReservations, setUpcomingReservations] = useState([]);

// Fetch from reservations table (e.g. in useEffect)
useEffect(() => {
  const fetchUpcomingReservations = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("reservations")
      .select("*, tables(number)") // join tables for table number
      .eq("status", "confirmed")
      .gte("reservation_date", todayStr)
      .order("reservation_date", { ascending: true });
    if (!error) setUpcomingReservations(data || []);
  };
  fetchUpcomingReservations();
}, []);

  // At the top of the component, add a timer to refetch orders every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([
        fetchOrders(),
        fetchServiceRequests(),
        fetchProducts(),
        fetchKitchenProducts(),
        fetchFees(),
        fetchTableStatuses(),
        fetchDailyStats(),
      ])
      setLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    fetchDailyStats()
  }, [dateRange, customDate])

  // Fetch staff list on mount
  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    const res = await fetch('/api/staff')
    const data = await res.json()
    setStaffList(data)
    if (user) {
      const found = data.find((s: any) => s.user_id === user.id)
      setSelectedStaff(found || data[0])
    } else {
      setSelectedStaff(data[0])
    }
  }

  // Update todayLog when selectedStaff changes
  useEffect(() => {
    if (activeTab === "checkin" && selectedStaff) {
      fetchTodayLog()
    }
    // eslint-disable-next-line
  }, [activeTab, selectedStaff])

  const fetchTodayLog = async () => {
    setCheckinLoading(true)
    setErrorMsg("")
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(`/api/checkins?user_id=${selectedStaff.user_id}&date=${today}`)
    const data = await res.json()
    setTodayLog(data[0] || null)
    setCheckinLoading(false)
  }

  const handleClock = async () => {
    setCheckinLoading(true)
    setErrorMsg("")
    const today = new Date().toISOString().split('T')[0]
    let resp
    if (!todayLog) {
      // Clock in
      resp = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedStaff.user_id, date: today, check_in_time: new Date().toISOString(), breaks: [] })
      })
    } else if (todayLog && !todayLog.check_out_time) {
      // Clock out
      resp = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: todayLog.id, user_id: selectedStaff.user_id, date: today, check_in_time: todayLog.check_in_time, check_out_time: new Date().toISOString(), breaks: todayLog.breaks || [], notes: todayLog.notes || "" })
      })
    }
    
    if (resp) {
      const result = await resp.json()
      if (result.error) setErrorMsg(result.error)
    }
    
    await fetchTodayLog()
    setCheckinLoading(false)
  }

  // Break logic
  const isOnBreak = todayLog && todayLog.breaks && todayLog.breaks.length > 0 && !todayLog.breaks[todayLog.breaks.length - 1].end;
  const handleBreak = async () => {
    if (!todayLog) return;
    setCheckinLoading(true);
    setErrorMsg("");
    let newBreaks = [...(todayLog.breaks || [])];
    if (!isOnBreak) {
      // Start break
      newBreaks.push({ start: new Date().toISOString(), end: null });
    } else {
      // End break
      newBreaks = newBreaks.map((b, i, arr) =>
        i === arr.length - 1 ? { ...b, end: new Date().toISOString() } : b
      );
    }
    const resp = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: todayLog.id, user_id: selectedStaff.user_id, date: todayLog.date, check_in_time: todayLog.check_in_time, check_out_time: todayLog.check_out_time, breaks: newBreaks, notes: todayLog.notes || "" })
    });
    const result = await resp.json();
    if (result.error) setErrorMsg(result.error);
    await fetchTodayLog();
    setCheckinLoading(false);
  };

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from("orders")
        .select("*")
        .in("dining_type", ["dine_in", "takeaway", "reservation"])
        .order("created_at", { ascending: false })

      // Apply date filtering based on order type
      if (dateRange === "custom") {
        query = query.or(`reservation_date.eq.${customDate},and(dining_type.neq.reservation,created_at.gte.${customDate}T00:00:00,created_at.lte.${customDate}T23:59:59)`)
      } else if (dateRange === "today") {
        const today = new Date().toISOString().split("T")[0]
        query = query.or(`reservation_date.eq.${today},and(dining_type.neq.reservation,created_at.gte.${today}T00:00:00,created_at.lte.${today}T23:59:59)`)
      } else if (dateRange === "week") {
        const today = new Date()
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 7)
        const startDate = weekStart.toISOString().split("T")[0]
        const endDate = today.toISOString().split("T")[0]
        query = query.or(`reservation_date.gte.${startDate},reservation_date.lte.${endDate},and(dining_type.neq.reservation,created_at.gte.${startDate}T00:00:00,created_at.lte.${endDate}T23:59:59)`)
      } else if (dateRange === "month") {
        const today = new Date()
        const monthStart = new Date(today)
        monthStart.setDate(today.getDate() - 30)
        const startDate = monthStart.toISOString().split("T")[0]
        const endDate = today.toISOString().split("T")[0]
        query = query.or(`reservation_date.gte.${startDate},reservation_date.lte.${endDate},and(dining_type.neq.reservation,created_at.gte.${startDate}T00:00:00,created_at.lte.${endDate}T23:59:59)`)
      }

      const { data, error } = await query
      if (error) throw error

      // Fetch all future confirmed reservations (status reservation_confirmed, reservation_date >= today)
      const todayStr = new Date().toISOString().split("T")[0]
      const { data: futureReservations, error: futureError } = await supabase
        .from("orders")
        .select("*")
        .eq("dining_type", "reservation")
        .eq("status", "reservation_confirmed")
        .gte("reservation_date", todayStr)
        .order("reservation_date", { ascending: true })
      if (futureError) throw futureError

      // Merge and deduplicate orders by id
      const allOrders = [...(data || [])]
      if (futureReservations) {
        const existingIds = new Set(allOrders.map(o => o.id))
        for (const res of futureReservations) {
          if (!existingIds.has(res.id)) allOrders.push(res)
        }
      }
      
      // Transform order items to map selected_addons to selectedAddOns for UI compatibility
      const transformedOrders = allOrders.map(order => ({
        ...order,
        items: order.items?.map((item: any) => ({
          ...item,
          selectedAddOns: item.selected_addons || item.selectedAddOns || []
        })) || []
      }))
      
      setOrders(transformedOrders)
      checkNewOrders(allOrders.length || 0)
    } catch (error) {
      console.error("Error fetching orders:", error)
    }
  }

  const fetchOrderHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["served", "paid", "cancelled", "reservation_confirmed", "reservation_completed", "completed", "no_show"])
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      
      // Transform order items to map selected_addons to selectedAddOns for UI compatibility
      const transformedHistory = (data || []).map(order => ({
        ...order,
        items: order.items?.map((item: any) => ({
          ...item,
          selectedAddOns: item.selected_addons || item.selectedAddOns || []
        })) || []
      }))
      
      setOrderHistory(transformedHistory)
    } catch (error) {
      console.error("Error fetching order history:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchKitchenProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id")
        .eq("show_in_kitchen", true)

      if (error) throw error
      setKitchenProductIds(new Set(data?.map(p => p.id) || []))
    } catch (error) {
      console.error("Error fetching kitchen products:", error)
    }
  }

  const isKitchenOrder = (order: Order) => {
    return order.items.some((item: any) => kitchenProductIds.has(item.id))
  }

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase.from("fees").select("*").eq("active", true)
      if (error) throw error
      setFees(data || [])
    } catch (error) {
      console.error("Error fetching fees:", error)
    }
  }

  const fetchServiceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error
      setServiceRequests(data || [])
      
      // Check for new service requests and play sound
      checkNewServiceRequests(data?.length || 0)
    } catch (error) {
      console.error("Error fetching service requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyStats = async () => {
    try {
      let startDate: string
      let endDate: string

      const today = new Date()

      switch (dateRange) {
        case "today":
          startDate = today.toISOString().split("T")[0]
          endDate = startDate
          break
        case "week":
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - 7)
          startDate = weekStart.toISOString().split("T")[0]
          endDate = today.toISOString().split("T")[0]
          break
        case "month":
          const monthStart = new Date(today)
          monthStart.setDate(today.getDate() - 30)
          startDate = monthStart.toISOString().split("T")[0]
          endDate = today.toISOString().split("T")[0]
          break
        case "custom":
          startDate = customDate
          endDate = customDate
          break
        default:
          startDate = today.toISOString().split("T")[0]
          endDate = startDate
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("dining_type", ["dine_in", "takeaway", "reservation"])
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)

      if (error) throw error

      const totalOrders = data?.length || 0
      const totalRevenue = data?.reduce((sum, order) => sum + order.total, 0) || 0
      const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

      setDailyStats({
        totalOrders,
        totalRevenue,
        averageOrder,
        busyHours: [],
      })
    } catch (error) {
      console.error("Error fetching daily stats:", error)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdating(orderId)
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
    } finally {
      setUpdating(null)
    }
  }

  const verifyPayment = async (orderId: string) => {
    setUpdating(orderId)
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "pending",
          payment_status: "paid"
        })
        .eq("id", orderId)

      if (error) throw error
      fetchOrders()
      alert("Payment verified successfully!")
    } catch (error) {
      console.error("Error verifying payment:", error)
      alert("Failed to verify payment. Please try again.")
    } finally {
      setUpdating(null)
    }
  }

  const rejectPayment = async (orderId: string) => {
    setUpdating(orderId)
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "cancelled",
          cancel_notes: "Payment verification failed"
        })
        .eq("id", orderId)

      if (error) throw error
      fetchOrders()
      alert("Payment rejected and order cancelled.")
    } catch (error) {
      console.error("Error rejecting payment:", error)
      alert("Failed to reject payment. Please try again.")
    } finally {
      setUpdating(null)
    }
  }

  const handleCancelOrder = (order: Order) => {
    setOrderToCancel(order)
    setCancelNotes("")
    setShowCancelDialog(true)
  }

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return
    
    setCancellingOrder(true)
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
      
      // Refresh orders
      fetchOrders()
      fetchOrderHistory()
      
    } catch (error) {
      console.error("Error cancelling order:", error)
      alert("Failed to cancel order. Please try again.")
    } finally {
      setCancellingOrder(false)
    }
  }

  const handleCancelItems = (order: Order) => {
    setOrderToCancelItems(order)
    setSelectedItemsToCancel(new Set())
    setCancelItemsNotes("")
    setShowCancelItemsDialog(true)
  }

  const toggleItemSelection = (index: number) => {
    const newSelection = new Set(selectedItemsToCancel)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedItemsToCancel(newSelection)
  }

  const confirmCancelItems = async () => {
    if (!orderToCancelItems || selectedItemsToCancel.size === 0) return
    
    setCancellingItems(true)
    try {
      // Create new items array with cancelled items marked
      const updatedItems = orderToCancelItems.items.map((item: any, index: number) => {
        if (selectedItemsToCancel.has(index)) {
          return {
            ...item,
            cancelled: true,
            cancel_reason: cancelItemsNotes || null
          }
        }
        return item
      })

      // Calculate new total excluding cancelled items
      const newSubtotal = updatedItems
        .filter((item: any) => !item.cancelled)
        .reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

      const { error } = await supabase
        .from("orders")
        .update({ 
          items: updatedItems,
          subtotal: newSubtotal,
          total: newSubtotal + (orderToCancelItems.fees_total || 0) - (orderToCancelItems.discount_amount || 0)
        })
        .eq("id", orderToCancelItems.id)

      if (error) throw error

      // Close dialog and reset state
      setShowCancelItemsDialog(false)
      setOrderToCancelItems(null)
      setSelectedItemsToCancel(new Set())
      setCancelItemsNotes("")
      
      // Refresh orders
      fetchOrders()
      fetchOrderHistory()
      
    } catch (error) {
      console.error("Error cancelling items:", error)
      alert("Failed to cancel items. Please try again.")
    } finally {
      setCancellingItems(false)
    }
  }

  const updateServiceRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase.from("service_requests").update({ status }).eq("id", requestId)

      if (error) throw error
      fetchServiceRequests()
    } catch (error) {
      console.error("Error updating service request:", error)
    }
  }

  const addItemToManualOrder = () => {
    if (!selectedProduct) return

    const sizeMultiplier = itemSize === "S" ? 0.8 : itemSize === "L" ? 1.2 : 1
    const itemPrice = selectedProduct.price * sizeMultiplier

    const newItem: ManualOrderItem = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: itemPrice,
      quantity: itemQuantity,
      size: itemSize,
      notes: itemNotes || undefined,
    }

    setManualOrderItems([...manualOrderItems, newItem])
    setSelectedProduct(null)
    setItemQuantity(1)
    setItemSize("M")
    setItemNotes("")
  }

  const removeItemFromManualOrder = (index: number) => {
    setManualOrderItems(manualOrderItems.filter((_, i) => i !== index))
  }

  const getManualOrderTotal = () => {
    return manualOrderItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const fetchTableStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('table_dashboard')
        .select('*')
        .order('table_number')

      if (error) throw error
      setTableStatuses(data || [])
    } catch (error) {
      console.error('Error fetching table statuses:', error)
    }
  }

  const submitManualOrder = async () => {
    if (manualOrderItems.length === 0) return

    // Check if table is available and has no open order (only for dine-in)
    if (manualOrderType === "dine_in") {
      const { data: openOrder, error: openOrderError } = await supabase
        .from('orders')
        .select('*')
        .eq('table_number', manualOrderTable)
        .not('status', 'in', ['paid', 'cancelled'])
        .maybeSingle();
      if (openOrder) {
        alert(`Table ${manualOrderTable} already has an open order. Please settle the current bill before starting a new one.`)
        return
      }
      if (openOrderError) {
        alert('Error checking for open orders. Please try again.')
        return
      }
    }

    // Validate payment for takeaway orders
    if (manualOrderType === "takeaway" && !manualPaymentMethod) {
      alert('Please select a payment method for takeaway orders.')
      return
    }

    try {
      const subtotal = getManualOrderTotal()
      let paymentProofUrl = null

      // Upload payment proof if provided for takeaway orders
      if (manualOrderType === "takeaway" && manualPaymentProofFile) {
        setManualPaymentProofUploading(true)
        const fileExt = manualPaymentProofFile.name.split('.').pop()
        const fileName = `payment-proof-manual-takeaway-${Date.now()}.${fileExt}`
        const { data, error } = await supabase.storage.from('paymentproofs').upload(fileName, manualPaymentProofFile)
        setManualPaymentProofUploading(false)
        if (error) throw error
        paymentProofUrl = data?.path ? supabase.storage.from('paymentproofs').getPublicUrl(data.path).data.publicUrl : null
      }

      const orderData = {
        table_number: manualOrderType === "dine_in" ? manualOrderTable : 0, // Use 0 for takeaway
        items: manualOrderItems,
        subtotal: subtotal,
        total: subtotal,
        status: manualOrderType === "takeaway" ? "payment_verification" : "pending",
        dining_type: manualOrderType,
        fees_total: 0,
        discount_amount: 0,
        payment_method: manualOrderType === "takeaway" ? manualPaymentMethod : undefined,
        payment_notes: manualOrderType === "takeaway" ? manualPaymentNotes : undefined,
        payment_proof_url: paymentProofUrl,
        payment_status: manualOrderType === "takeaway" ? "paid" : undefined,
      }

      const { error } = await supabase.from("orders").insert([orderData])
      if (error) throw error

      setManualOrderItems([])
      setManualOrderTable(1)
      setManualOrderType("dine_in")
      setManualPaymentMethod("cash")
      setManualPaymentNotes("")
      setManualPaymentProofFile(null)
      alert("Manual order submitted successfully!")
      
      // Refresh table statuses after order creation
      await fetchTableStatuses()
    } catch (error) {
      console.error("Error submitting manual order:", error)
      alert("Failed to submit order. Please try again.")
    }
  }

  const processPayment = async () => {
    if (!processingOrder) return

    try {
      const applicableFees = fees.filter(
        (fee) => selectedFees.includes(fee.id) && (fee.applies_to === "both" || fee.applies_to === selectedDiningType),
      )

      const feesTotal = applicableFees.reduce((total, fee) => {
        if (fee.type === "percentage") {
          return total + (processingOrder.subtotal * fee.amount) / 100
        }
        return total + fee.amount
      }, 0)

      const finalTotal = processingOrder.subtotal + feesTotal - discountAmount

      const { error } = await supabase
        .from("orders")
        .update({
          dining_type: selectedDiningType,
          fees_total: feesTotal,
          discount_amount: discountAmount,
          discount_reason: discountReason,
          total: finalTotal,
          status: "paid",
        })
        .eq("id", processingOrder.id)

      if (error) throw error

      // Add fees to order_fees table
      if (applicableFees.length > 0) {
        const orderFeesData = applicableFees.map((fee) => ({
          order_id: processingOrder.id,
          fee_id: fee.id,
          amount: fee.type === "percentage" ? (processingOrder.subtotal * fee.amount) / 100 : fee.amount,
        }))

        await supabase.from("order_fees").insert(orderFeesData)
      }

      alert("Payment processed successfully!")
      setProcessingOrder(null)
      setDiscountAmount(0)
      setDiscountReason("")
      setSelectedFees([])
      fetchOrders()
      
      // Refresh table statuses after payment
      await fetchTableStatuses()
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Failed to process payment. Please try again.")
    }
  }

  const editOrder = async () => {
    if (!editingOrder) return;
    try {
      let paymentProofUrl = editingOrder.payment_proof_url || null;
      if (editPaymentMethod === "qr" && editPaymentProofFile) {
        setEditPaymentProofUploading(true);
        const fileExt = editPaymentProofFile.name.split('.').pop();
        const fileName = `payment-proof-edit-${editingOrder.id}-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('paymentproofs').upload(fileName, editPaymentProofFile);
        setEditPaymentProofUploading(false);
        if (error) throw error;
        paymentProofUrl = data?.path ? supabase.storage.from('paymentproofs').getPublicUrl(data.path).data.publicUrl : null;
      }
      const newTotal = editOrderItems.reduce((total, item) => total + item.price * item.quantity, 0);
      const { error } = await supabase
        .from("orders")
        .update({
          items: editOrderItems,
          total: newTotal,
          subtotal: newTotal,
          order_notes: editOrderNotes,
          payment_method: editPaymentMethod,
          payment_notes: editPaymentNotes,
          payment_proof_url: paymentProofUrl,
          cancel_notes: editingOrder.cancel_notes || null,
        })
        .eq("id", editingOrder.id);
      if (error) throw error;
      alert("Order updated successfully!");
      setEditingOrder(null);
      setEditOrderItems([]);
      setEditOrderNotes("");
      setEditPaymentMethod("cash");
      setEditPaymentNotes("");
      setEditPaymentProofFile(null);
      fetchOrders();
      fetchOrderHistory();
    } catch (error) {
      setEditPaymentProofUploading(false);
      console.error("Error updating order:", error);
      alert("Failed to update order. Please try again.");
    }
  };

  const startEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditOrderItems([...order.items]);
    setEditOrderNotes(order.order_notes || "");
    setEditPaymentMethod(order.payment_method || "cash");
    setEditPaymentNotes(order.payment_notes || "");
    setEditPaymentProofFile(null);
  };

  const updateEditOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = [...editOrderItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setEditOrderItems(updatedItems)
  }

  const removeEditOrderItem = (index: number) => {
    const updatedItems = editOrderItems.filter((_, i) => i !== index)
    setEditOrderItems(updatedItems)
  }

  const printReceipt = (order: Order) => {
    const receiptContent = `
      ${cafeName}
      ${cafeLocation}
      
      Table: ${order.table_number}
      Order ID: ${order.id.slice(0, 8)}
      Date: ${new Date(order.created_at).toLocaleString()}
      
      ITEMS:
      ${order.items
        .map(
          (item: any) => `${item.quantity}x ${item.name} (${item.size}) - RM${(item.price * item.quantity).toFixed(2)}`,
        )
        .join("\n")}
      
      Subtotal: RM${order.subtotal?.toFixed(2) || order.total.toFixed(2)}
      Fees: RM${order.fees_total?.toFixed(2) || "0.00"}
      Discount: -RM${order.discount_amount?.toFixed(2) || "0.00"}
      TOTAL: RM${order.total.toFixed(2)}
      
      Thank you for visiting!
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`<pre>${receiptContent}</pre>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "preparing":
        return "bg-blue-500"
      case "ready":
        return "bg-green-500"
      case "served":
        return "bg-gray-500"
      case "paid":
        return "bg-purple-500"
      case "reservation_confirmed":
        return "bg-orange-500"
      case "reservation_ready":
        return "bg-indigo-500"
      default:
        return "bg-gray-500"
    }
  }

  const getOrderProgress = (status: string) => {
    const steps = ["pending", "preparing", "ready", "served", "paid"]
    const currentIndex = steps.indexOf(status)
    return steps.map((step, index) => ({
      step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }))
  }

  const OrderTimeline = ({ status }: { status: string }) => {
    const progress = getOrderProgress(status)

    return (
      <div className="flex items-center space-x-2 mb-3">
        {progress.map((item, index) => (
          <div key={item.step} className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                item.completed ? (item.active ? "bg-blue-500 animate-pulse" : "bg-green-500") : "bg-gray-300"
              }`}
            />
            {index < progress.length - 1 && (
              <div
                className={`w-8 h-0.5 transition-all duration-300 ${item.completed ? "bg-green-500" : "bg-gray-300"}`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const filteredOrderHistory = orderHistory.filter(
    (order) =>
      order.table_number.toString().includes(searchQuery) ||
      order.items.some((item: any) => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Live Orders", icon: ShoppingCart },
    { id: "manual-order", label: "Place Order", icon: Plus },
    { id: "reservations", label: "Reservations", icon: Calendar },
    { id: "history", label: "Order History", icon: History },
    { id: "checkin", label: "Check-In/Check-Out", icon: Clock },
    { id: "stock-management", label: "Stock Management", icon: TrendingUp },
    { id: "todays-celebration", label: "Today's Celebration", icon: Calendar },
  ]

  const handleLogout = async () => {
    await signOut()
  }

  const getTableStatusColor = (tableNumber: number) => {
    const table = tableStatuses.find(t => t.table_number === tableNumber)
    if (!table) return 'bg-gray-500'
    
    if (table.is_available) return 'bg-green-500'
    if (table.status === 'outstanding') return 'bg-red-500'
    return 'bg-yellow-500'
  }

  const getTableStatusText = (tableNumber: number) => {
    const table = tableStatuses.find(t => t.table_number === tableNumber)
    if (!table) return 'Unknown'
    
    if (table.is_available) return 'Available'
    if (table.status === 'outstanding') return 'Outstanding'
    return 'Occupied'
  }

  // Payment modal logic
  const handleOpenTablePayment = (tableNumber: number) => {
    setProcessingTable(tableNumber)
    setShowTablePaymentModal(true)
  }
  const handleCloseTablePayment = () => {
    setProcessingTable(null)
    setShowTablePaymentModal(false)
    setTablePaymentDiscount(0)
    setTablePaymentDiscountReason("")
  }

  const handlePaymentProofChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProofFile(e.target.files[0])
    }
  }

  const handleProcessTablePayment = async () => {
    if (!processingTable) return
    setPaymentError("")
    const tableOrders = dineInOrdersByTable[processingTable] || []
    let paymentProofUrl = null
    try {
      if (paymentMethod === "qr" && paymentProofFile) {
        setPaymentProofUploading(true)
        const fileExt = paymentProofFile.name.split('.').pop()
        const fileName = `payment-proof-table${processingTable}-${Date.now()}.${fileExt}`
        const { data, error } = await supabase.storage.from('paymentproofs').upload(fileName, paymentProofFile)
        setPaymentProofUploading(false)
        if (error) throw error
        paymentProofUrl = data?.path ? supabase.storage.from('paymentproofs').getPublicUrl(data.path).data.publicUrl : null
      }
      
      // Calculate discount per order (distribute evenly across all orders)
      const totalTableAmount = tableOrders.reduce((sum, o) => sum + o.total, 0)
      const discountPerOrder = totalTableAmount > 0 ? (tablePaymentDiscount / totalTableAmount) : 0
      
      for (const order of tableOrders) {
        const orderDiscount = order.total * discountPerOrder
        const finalTotal = order.total - orderDiscount
        
        let updateData: any = { 
          payment_method: paymentMethod, 
          payment_notes: paymentNotes,
          status: 'paid', // Use 'paid' instead of 'completed'
          discount_amount: orderDiscount,
          discount_reason: tablePaymentDiscountReason || 'Table discount',
          total: finalTotal
        };
        if (paymentProofUrl) updateData.payment_proof_url = paymentProofUrl;
        
        const { error, data } = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", order.id)
        console.log('Order update result:', { orderId: order.id, error, data })
        if (error) {
          setPaymentError(`Failed to update order ${order.id}: ${error.message}`)
          return
        }
      }
      alert(`Payment processed for Table ${processingTable}`)
      handleCloseTablePayment()
      setPaymentMethod("cash")
      setPaymentNotes("")
      setPaymentProofFile(null)
      setTablePaymentDiscount(0)
      setTablePaymentDiscountReason("")
      fetchOrders()
      fetchTableStatuses()
    } catch (error: any) {
      setPaymentProofUploading(false)
      setPaymentError(error.message || "Failed to process payment. Please try again.")
    }
  }

  const handleOpenTakeawayPayment = (order: Order) => {
    setProcessingTakeawayOrder(order)
    setShowTakeawayPaymentModal(true)
    setTakeawayPaymentMethod("cash")
    setTakeawayPaymentNotes("")
    setTakeawayPaymentProofFile(null)
    setTakeawayPaymentError("")
  }
  const handleCloseTakeawayPayment = () => {
    setProcessingTakeawayOrder(null)
    setShowTakeawayPaymentModal(false)
    setTakeawayPaymentMethod("cash")
    setTakeawayPaymentNotes("")
    setTakeawayPaymentProofFile(null)
    setTakeawayPaymentError("")
  }
  const handleTakeawayPaymentProofChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTakeawayPaymentProofFile(e.target.files[0])
    }
  }
  const handleProcessTakeawayPayment = async () => {
    if (!processingTakeawayOrder) return
    setTakeawayPaymentError("")
    let paymentProofUrl = processingTakeawayOrder.payment_proof_url || null
    try {
      if (takeawayPaymentMethod === "qr" && takeawayPaymentProofFile) {
        setTakeawayPaymentProofUploading(true)
        const fileExt = takeawayPaymentProofFile.name.split('.').pop()
        const fileName = `payment-proof-takeaway-${processingTakeawayOrder.id}-${Date.now()}.${fileExt}`
        const { data, error } = await supabase.storage.from('paymentproofs').upload(fileName, takeawayPaymentProofFile)
        setTakeawayPaymentProofUploading(false)
        if (error) throw error
        paymentProofUrl = data?.path ? supabase.storage.from('paymentproofs').getPublicUrl(data.path).data.publicUrl : null
      }
      const updateData: any = { 
        payment_method: takeawayPaymentMethod, 
        payment_notes: takeawayPaymentNotes,
        status: 'paid' // Use 'paid' instead of 'completed'
      };
      if (paymentProofUrl) updateData.payment_proof_url = paymentProofUrl;
      
      const { error, data } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", processingTakeawayOrder.id)
      console.log('Takeaway order update result:', { orderId: processingTakeawayOrder.id, error, data })
      if (error) {
        setTakeawayPaymentError(`Failed to update order: ${error.message}`)
        return
      }
      alert(`Payment processed for Takeaway Order`)
      handleCloseTakeawayPayment()
      fetchOrders()
      fetchTableStatuses()
    } catch (error: any) {
      setTakeawayPaymentProofUploading(false)
      setTakeawayPaymentError(error.message || "Failed to process payment. Please try again.")
    }
  }

  // Helper to get remaining unpaid quantity for each item
  function getRemainingQuantities(order: any, payments: any[]) {
    const remaining: Record<string, number> = {}
    order.items.forEach((item: any, idx: number) => {
      const key = `${item.id || idx}-${item.size}`
      let paid = 0
      payments.forEach((p: any) => {
        if (p.items && p.items[key]) paid += Number(p.items[key])
      })
      remaining[key] = item.quantity - paid
    })
    return remaining
  }

  // Open split payment modal for a table
  const handleOpenSplitPayment = async (tableNumber: number) => {
    setShowSplitPaymentModal(true)
    setSplitPaymentItems({})
    setSplitPaymentMethod('cash')
    setSplitPaymentNotes('')
    setSplitPaymentProofFile(null)
    setSplitPaymentError('')
    setSplitPaymentLoading(false)
    // Fetch previous payments for this table's open order(s)
    const tableOrders = dineInOrdersByTable[tableNumber] || []
    if (tableOrders.length > 0) {
      // For now, assume one open order per table (can be extended)
      const { data, error } = await supabase.from('payments').select('*').eq('order_id', tableOrders[0].id)
      setSplitPayments(data || [])
    } else {
      setSplitPayments([])
    }
  }
  const handleCloseSplitPayment = () => {
    setShowSplitPaymentModal(false)
    setSplitPaymentItems({})
    setSplitPaymentMethod('cash')
    setSplitPaymentNotes('')
    setSplitPaymentProofFile(null)
    setSplitPaymentError('')
    setSplitPaymentLoading(false)
  }
  const handleSplitPaymentProofChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSplitPaymentProofFile(e.target.files[0])
    }
  }
  const handleSplitPaymentItemQty = (key: string, maxQty: number, value: string) => {
    let qty: string | number = value
    if (qty === '') qty = ''
    else qty = Math.max(0, Math.min(Number(qty), maxQty))
    setSplitPaymentItems((prev: Record<string, string | number>) => ({ ...prev, [key]: qty }))
  }
  const getSplitPaymentSubtotal = (order: any) => {
    let total = 0
    order.items.forEach((item: any, idx: number) => {
      const key = `${item.id || idx}-${item.size}`
      const qty = Number(splitPaymentItems[key] || 0)
      total += qty * item.price
    })
    return total
  }
  const handleConfirmSplitPayment = async (tableNumber: number) => {
    setSplitPaymentError('')
    setSplitPaymentLoading(true)
    const tableOrders = dineInOrdersByTable[tableNumber] || []
    if (tableOrders.length === 0) return
    const order = tableOrders[0]
    const itemsToPay: Record<string, number> = {}
    let hasQty = false
    order.items.forEach((item, idx) => {
      const key = `${item.id || idx}-${item.size}`
      const qty = Number(splitPaymentItems[key] || 0)
      if (qty > 0) {
        itemsToPay[key] = qty
        hasQty = true
      }
    })
    if (!hasQty) {
      setSplitPaymentError('Please enter at least one quantity to pay.')
      setSplitPaymentLoading(false)
      return
    }
    let paymentProofUrl = null
    try {
      if (splitPaymentMethod === 'qr' && splitPaymentProofFile) {
        setSplitPaymentProofUploading(true)
        const fileExt = splitPaymentProofFile.name.split('.').pop()
        const fileName = `payment-proof-split-${order.id}-${Date.now()}.${fileExt}`
        const { data, error } = await supabase.storage.from('paymentproofs').upload(fileName, splitPaymentProofFile)
        setSplitPaymentProofUploading(false)
        if (error) throw error
        paymentProofUrl = data?.path ? supabase.storage.from('paymentproofs').getPublicUrl(data.path).data.publicUrl : null
      }
      const amount = getSplitPaymentSubtotal(order)
      const { error, data } = await supabase.from('payments').insert([{
        order_id: order.id,
        amount,
        method: splitPaymentMethod,
        notes: splitPaymentNotes,
        proof_url: paymentProofUrl,
        items: itemsToPay
      }])
      if (error) {
        setSplitPaymentError(error.message)
        setSplitPaymentLoading(false)
        return
      }
      // After payment, refetch payments and update UI
      const { data: newPayments } = await supabase.from('payments').select('*').eq('order_id', order.id)
      setSplitPayments(newPayments || [])
      setSplitPaymentItems({})
      setSplitPaymentMethod('cash')
      setSplitPaymentNotes('')
      setSplitPaymentProofFile(null)
      setSplitPaymentError('')
      setSplitPaymentLoading(false)
      fetchOrders()
      fetchTableStatuses()
      // Optionally, check if all items are fully paid and mark order as paid
      const remaining = getRemainingQuantities(order, newPayments || [])
      const allPaid = Object.values(remaining).every(qty => qty <= 0)
      if (allPaid) {
        await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id)
        fetchOrders()
        fetchTableStatuses()
        handleCloseSplitPayment()
      }
    } catch (error: any) {
      setSplitPaymentError(error.message || 'Failed to process payment.')
      setSplitPaymentLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "history") {
      fetchOrderHistory();
    }
  }, [activeTab, dateRange, customDate]);

  // Fetch payments for visible order history
  useEffect(() => {
    if (activeTab === "history" && orderHistory.length > 0) {
      const fetchPayments = async () => {
        const orderIds = orderHistory.map(o => o.id);
        const { data, error } = await supabase.from('payments').select('*').in('order_id', orderIds);
        if (!error && data) {
          // Group by order_id
          const grouped: Record<string, any[]> = {};
          data.forEach((p: any) => {
            if (!grouped[p.order_id]) grouped[p.order_id] = [];
            grouped[p.order_id].push(p);
          });
          setOrderPayments(grouped);
        } else {
          setOrderPayments({});
        }
      };
      fetchPayments();
    }
  }, [activeTab, orderHistory]);

  // At the top of the component, add state for the date picker
  const [upcomingReservationsDate, setUpcomingReservationsDate] = useState(new Date().toISOString().split('T')[0]);

  // Update the fetchUpcomingReservations effect to use the selected date
  useEffect(() => {
    const fetchUpcomingReservations = async () => {
      const now = new Date();
      const nowPlus10 = new Date(now.getTime() + 10 * 60000);
      const nowPlus10Str = nowPlus10.toTimeString().slice(0, 8);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('dining_type', 'reservation')
        .eq('reservation_date', upcomingReservationsDate)
        .eq('status', 'reservation_confirmed')
        .order('reservation_time', { ascending: true });
      if (!error) {
        // Update the upcomingReservations state instead of calling a non-existent function
        // This will be handled by the useMemo that filters orders
      }
    };
    fetchUpcomingReservations();
    const interval = setInterval(fetchUpcomingReservations, 60000);
    return () => clearInterval(interval);
  }, [upcomingReservationsDate]);

  // Today's Celebration Functions
  const handleCelebrationImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCelebrationImageFile(e.target.files[0]);
      setCelebrationImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleCelebrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCelebrationLoading(true);
    setCelebrationSuccess('');
    setCelebrationError('');
    let imageUrl = celebrationImage;
    try {
      // 1. Upload image if a new file is selected
      if (celebrationImageFile) {
        const fileExt = celebrationImageFile.name.split('.').pop();
        const fileName = `celebrations/${celebrationDate}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, celebrationImageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }

      // 2. Check if user exists in staff_profiles before setting created_by
      let createdBy = null;
      if (user?.id) {
        const { data: staffProfile } = await supabase
          .from('staff_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
        
        if (staffProfile) {
          createdBy = user.id;
        }
      }

      // 3. Upsert to todays_celebration table using the unique constraint on date
      const { error: upsertError } = await supabase.from('todays_celebration').upsert([
        {
          date: celebrationDate,
          coffee_name: celebrationCoffeeName,
          description: celebrationDescription,
          image_url: imageUrl,
          created_by: createdBy, // Will be null if user doesn't exist in staff_profiles
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'date' });
      
      if (upsertError) throw upsertError;
      setCelebrationSuccess('Today\'s Celebration updated successfully!');
    } catch (err: any) {
      setCelebrationError(err.message || 'Failed to update.');
    } finally {
      setCelebrationLoading(false);
    }
  };

  const handleEditPaymentProofChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditPaymentProofFile(e.target.files[0]);
    }
  };

  // Group upcoming reservations (not paid/cancelled/completed/no_show)
  const upcomingReservationsByTable = useMemo(() => {
    const groups: { [table: number]: Order[] } = {}
    orders
      .filter(o => o.dining_type === "reservation" && !["paid", "cancelled", "completed", "no_show"].includes(o.status))
      .forEach(order => {
        if (!groups[order.table_number]) groups[order.table_number] = []
        groups[order.table_number].push(order)
      })
    return groups
  }, [orders])

  // 1. Add state for modal visibility
  const [showAddOrderModal, setShowAddOrderModal] = useState(false)

  useEffect(() => {
    // Filter out paid and cancelled orders from the live view
    const liveOrders = orders.filter(order => !['paid', 'cancelled'].includes(order.status));
    setFilteredOrders(liveOrders);
  }, [orders]);

  // Table modal state
  const [showTableModal, setShowTableModal] = useState(false)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)

  // Add state for table payment discount modal
  const [showTableDiscountModal, setShowTableDiscountModal] = useState(false)

  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  // Fetch all reservations with table number on mount or when Reservations tab is active
  useEffect(() => {
    if (activeTab === 'reservations') {
      const fetchReservations = async () => {
        setReservationsLoading(true);
        // Join reservations with table_reservations to get table_number
        const { data, error } = await supabase
          .from('reservations')
          .select('*, table_reservations(table_number), orders(items, subtotal, total, payment_proof_url, payment_method, payment_notes)')
          .order('reservation_date', { ascending: false });
        if (!error) {
          setReservations(data || []);
        }
        setReservationsLoading(false);
      };
      fetchReservations();
    }
  }, [activeTab]);

  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleCancelReservation = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    setCancellingId(id);
    const { error } = await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
    if (!error) {
      setReservations(reservations => reservations.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    }
    setCancellingId(null);
  };

  const handleConfirmReservation = async (id: string, orderId?: string) => {
    setConfirmingId(id);
    // Update reservation status
    const { error } = await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', id);
    // If there is an associated order, update its status to 'reservation_confirmed'
    if (orderId) {
      await supabase.from('orders').update({ status: 'reservation_confirmed' }).eq('id', orderId);
    }
    if (!error) {
      setReservations(reservations => reservations.map(r => r.id === id ? { ...r, status: 'confirmed' } : r));
    }
    setConfirmingId(null);
  };

  const [editReservation, setEditReservation] = useState<any>(null);
  const [savingReservation, setSavingReservation] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [availableTables, setAvailableTables] = useState<any[]>([]);

  // Fetch available tables when modal opens
  useEffect(() => {
    if (showReservationModal) {
      supabase.from('tables').select('*').then(({ data }) => {
        setAvailableTables(data || []);
      });
      if (selectedReservation) {
        setEditReservation({ ...selectedReservation, table_number: selectedReservation.table_reservations?.table_number || "" });
        setSaveSuccess("");
        setSaveError("");
      }
    }
  }, [showReservationModal, selectedReservation]);

  const handleEditChange = (field: string, value: any) => {
    setEditReservation((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveReservation = async () => {
    setSavingReservation(true);
    setSaveSuccess("");
    setSaveError("");
    // Only send allowed fields to reservations table
    const allowedFields = [
      'customer_name', 'customer_phone', 'customer_email',
      'reservation_date', 'reservation_time', 'number_of_people',
      'special_requests', 'status', 'table_preference'
    ];
    const { id, table_number } = editReservation;
    const updateFields = {};
    for (const key of allowedFields) {
      if (key in editReservation) updateFields[key] = editReservation[key];
    }
    const { error } = await supabase.from('reservations').update(updateFields).eq('id', id);
    let tableError = null;
    if (!error && table_number) {
      // Update table_reservations
      const { error: tError } = await supabase.from('table_reservations').update({ table_number }).eq('reservation_id', id);
      tableError = tError;
    }
    if (!error && !tableError) {
      setSaveSuccess("Reservation updated successfully.");
      setReservations(reservations => reservations.map(r => r.id === id ? { ...r, ...updateFields, table_reservations: { table_number } } : r));
      setShowReservationModal(false);
    } else {
      setSaveError("Failed to update reservation.");
    }
    setSavingReservation(false);
  };

  if (loading && activeTab === "dashboard") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center animate-pulse mx-auto mb-4">
            <span className="text-lg font-bold text-white">&</span>
          </div>
          <p className="text-blue-700">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="cashier">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex relative">
        {/* Mobile Overlay */}
        {sidebarExpanded && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" 
            onClick={() => setSidebarExpanded(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`${sidebarExpanded ? 'w-64 lg:w-64 md:w-48' : 'w-16 md:w-16'} bg-white border-r border-blue-200 shadow-lg transition-all duration-300 ${sidebarExpanded ? 'md:relative' : 'md:relative'} ${sidebarExpanded ? 'fixed md:relative' : 'hidden md:block'} z-20 h-full`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-white">$</span>
                </div>
                {sidebarExpanded && (
                  <span className="text-xl font-bold text-blue-900">Cashier Panel</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="text-blue-700 hover:text-blue-900 hover:bg-blue-50 p-1"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <div key={item.id} className="relative group">
                  <Button
                    variant={activeTab === item.id ? "default" : "ghost"}
                    onClick={() => {
                      if (item.id === "manage-reservations") {
                        window.location.href = "/cashier/manage-reservations";
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`w-full ${sidebarExpanded ? 'justify-start' : 'justify-center'} transition-all duration-200 ${
                      activeTab === item.id
                        ? "bg-blue-900 text-white shadow-lg"
                        : "text-blue-700 hover:bg-blue-50 hover:text-blue-900"
                    }`}
                    title={!sidebarExpanded ? item.label : undefined}
                  >
                    <item.icon className={`h-4 w-4 ${sidebarExpanded ? 'mr-3' : ''}`} />
                    {sidebarExpanded && (
                      <>
                        {item.label}
                        {item.id === "orders" && (
                          (orders.filter((o) => o.status === "pending").length + serviceRequests.filter((r) => r.status === "pending").length) > 0 && (
                            <Badge className="ml-auto bg-red-500 text-white">
                              {orders.filter((o) => o.status === "pending").length + serviceRequests.filter((r) => r.status === "pending").length}
                            </Badge>
                          )
                        )}
                      </>
                    )}
                  </Button>
                  {!sidebarExpanded && item.id === "orders" && (
                    (orders.filter((o) => o.status === "pending").length + serviceRequests.filter((r) => r.status === "pending").length) > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">
                          {orders.filter((o) => o.status === "pending").length + serviceRequests.filter((r) => r.status === "pending").length}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="mt-8 pt-6 border-t border-blue-200">
              {sidebarExpanded && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium">{user?.email}</p>
                  <p className="text-xs text-blue-600">Cashier</p>
                </div>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className={`w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 ${!sidebarExpanded ? 'justify-center' : ''}`}
                title={!sidebarExpanded ? 'Sign Out' : undefined}
              >
                <LogOut className={`h-4 w-4 ${sidebarExpanded ? 'mr-2' : ''}`} />
                {sidebarExpanded && 'Sign Out'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-blue-200 p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarExpanded(!sidebarExpanded)}
                  className="md:hidden text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-blue-900">
                    {sidebarItems.find((item) => item.id === activeTab)?.label}
                  </h1>
                  <p className="text-sm md:text-base text-blue-700 hidden sm:block">Manage orders and payments</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className="bg-blue-600 text-white">{new Date().toLocaleDateString()}</Badge>
                {(activeTab === "dashboard" || activeTab === "orders") && (
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={manualRefresh}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                      title="Manual refresh"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={testSound}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                      title="Test sound"
                    >
                      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      variant="outline"
                      size="sm"
                      className={`${soundEnabled ? 'text-green-600' : 'text-red-600'} hover:bg-gray-50`}
                      title={soundEnabled ? 'Disable sound' : 'Enable sound'}
                    >
                      {soundEnabled ? '🔊' : '🔇'}
                    </Button>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${isUserActive ? 'text-yellow-600' : 'text-green-600'}`}
                    >
                      {isUserActive ? 'User Active' : 'Auto-refresh'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Table Status Dashboard Section */}
          {(activeTab === "dashboard" || activeTab === "orders") && (
            <section className="p-3 md:p-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Table Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tableStatuses.length === 0 ? (
                    <div className="text-blue-700">No tables found.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                      {tableStatuses.map((table) => {
                        const openOrdersForTable = orders.filter(
                          (order) =>
                            order.table_number === table.table_number &&
                            order.dining_type === 'dine_in' &&
                            !['paid', 'cancelled', 'completed', 'no_show'].includes(order.status)
                        )
                        return (
                          <button
                            key={table.table_number}
                            className="flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg p-2 hover:bg-blue-50 transition"
                            onClick={() => {
                              setSelectedTable(table.table_number)
                              setShowTableModal(true)
                            }}
                            type="button"
                          >
                            <div className="font-bold text-blue-900 mb-1">Table {table.table_number}</div>
                            <TableStatusIndicator tableNumber={table.table_number} showDetails={true} openOrdersForTable={openOrdersForTable} />
                            <div className="text-xs text-gray-500 mt-1">{table.zone} | {table.capacity}pax</div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Table Order Modal */}
          <Dialog open={showTableModal} onOpenChange={setShowTableModal}>
            <DialogContent className="max-w-2xl w-full">
              <DialogHeader>
                <DialogTitle>Table {selectedTable} - Current Order</DialogTitle>
              </DialogHeader>
              {(() => {
                const openOrders = filteredOrders.filter(
                  (order) => order.table_number === selectedTable && order.dining_type === "dine_in"
                )
                if (openOrders.length === 0) {
                  return <div className="text-blue-700 py-8 text-center">No active orders for this table.</div>
                }
                return (
                  <>
                    <div className="space-y-6">
                      {openOrders.map((order) => (
                        <Card className="mb-4" key={order.id}>
                          <CardHeader>
                            <CardTitle className="text-blue-900 flex items-center gap-2">
                              Order #
                              <span className="underline cursor-pointer select-all">{order.id.slice(0, 8)}</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>{order.status}</span>
                            </CardTitle>
                            <CardDescription>
                              Placed: {new Date(order.created_at).toLocaleString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="mb-2 font-semibold text-blue-900">Items:</div>
                            <ul className="mb-4 space-y-1">
                              {order.items.map((item: any, idx: number) => (
                                <li key={idx} className="flex justify-between text-sm">
                                  <span>{item.quantity}x {item.name} ({item.size})</span>
                                  <span>RM{(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="flex justify-between font-bold text-blue-900">
                              <span>Total:</span>
                              <span>RM{order.total.toFixed(2)}</span>
                            </div>
                            {order.order_notes && (
                              <div className="mt-2 text-xs text-blue-700 bg-blue-50 rounded p-2">
                                <strong>Notes:</strong> {order.order_notes}
                              </div>
                            )}
                            {order.discount_amount > 0 && (
                              <div className="flex justify-between text-xs text-green-600 mt-1">
                                <span>Discount ({order.discount_reason}):</span>
                                <span>-RM{order.discount_amount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-end text-xs text-blue-900 font-bold mt-1">
                              Total: RM{order.total.toFixed(2)}
                            </div>
                          </CardContent>
                          <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                            <Button variant="outline" onClick={() => printReceipt(order)}>
                              Print Receipt
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setOrderToCancel(order)
                                setShowCancelDialog(true)
                              }}
                            >
                              Cancel Order
                            </Button>
                            {/* Status update buttons */}
                            {order.status === "pending" && (
                              <Button onClick={() => updateOrderStatus(order.id, "preparing")}>Start Preparing</Button>
                            )}
                            {order.status === "preparing" && (
                              <Button onClick={() => updateOrderStatus(order.id, "ready")}>Mark Ready</Button>
                            )}
                            {order.status === "ready" && (
                              <Button onClick={() => updateOrderStatus(order.id, "served")}>Mark Served</Button>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                    <DialogFooter>
                      <Button
                        className="bg-blue-700 text-white hover:bg-blue-800"
                        onClick={() => selectedTable !== null && openOrders.length > 0 && handleOpenTablePayment(selectedTable)}
                        disabled={selectedTable === null || openOrders.length === 0}
                      >
                        Process Payment for Table
                      </Button>
                      <Button variant="outline" onClick={() => setShowTableModal(false)}>
                        Close
                      </Button>
                    </DialogFooter>
                  </>
                )
              })()}
            </DialogContent>
          </Dialog>

          <div className="p-3 md:p-6">
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div className="space-y-4 md:space-y-6">
                {/* Date Range Filter */}
                <Card className="bg-white border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Date Range Filter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex space-x-2">
                        {[
                          { value: "today", label: "Today" },
                          { value: "week", label: "Last 7 Days" },
                          { value: "month", label: "Last 30 Days" },
                          { value: "custom", label: "Custom Date" },
                        ].map((option) => (
                          <Button
                            key={option.value}
                            variant={dateRange === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDateRange(option.value)}
                            className={`${
                              dateRange === option.value
                                ? "bg-blue-600 text-white"
                                : "border-blue-300 text-blue-700 hover:bg-blue-50"
                            }`}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      {dateRange === "custom" && (
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="customDate" className="text-blue-700">
                            Select Date:
                          </Label>
                          <Input
                            id="customDate"
                            type="date"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="border-blue-300 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <Card className="bg-white border-blue-200 shadow-lg">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 text-sm">Total Orders</p>
                          <p className="text-2xl font-bold text-blue-900">{dailyStats.totalOrders}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-blue-200 shadow-lg">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 text-sm">Total Revenue</p>
                          <p className="text-2xl font-bold text-blue-900">RM{dailyStats.totalRevenue.toFixed(2)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-blue-200 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 text-sm">Average Order</p>
                          <p className="text-2xl font-bold text-blue-900">RM{dailyStats.averageOrder.toFixed(2)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-blue-200 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-700 text-sm">Pending Orders</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {orders.filter((o) => o.status === "pending").length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Kitchen Orders Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <Card className="bg-white border-orange-200 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-700 text-sm">Kitchen Orders Pending</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {orders.filter((o) => o.status === "pending" && isKitchenOrder(o)).length}
                          </p>
                        </div>
                        <div className="text-2xl">🍳</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-green-200 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-700 text-sm">Non-Kitchen Orders Pending</p>
                          <p className="text-2xl font-bold text-green-900">
                            {orders.filter((o) => o.status === "pending" && !isKitchenOrder(o)).length}
                          </p>
                        </div>
                        <div className="text-2xl">☕</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white border-blue-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-blue-900">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={() => setActiveTab("orders")}
                        variant="outline"
                        className="w-full border-blue-300 text-blue-700 justify-start"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        View Live Orders & Service Requests
                      </Button>
                      <Button
                        onClick={() => setActiveTab("manual-order")}
                        variant="outline"
                        className="w-full border-blue-300 text-blue-700 justify-start"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Place Manual Order
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-blue-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-blue-900">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></div>
                            <span className="text-sm text-blue-700">
                              Table {order.table_number} - RM{order.total.toFixed(2)}
                            </span>
                            <div className="ml-2 text-xs text-blue-700 font-mono">Order #: {order.id.slice(0, 8)}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-yellow-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-yellow-900">Recent Service Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {serviceRequests.slice(0, 3).map((request) => (
                          <div key={request.id} className="flex items-center justify-between">
                            <span className="text-sm text-yellow-700">
                              Table {request.table_number} - {request.type.replace("_", " ")}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => updateServiceRequestStatus(request.id, "completed")}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              Complete
                            </Button>
                          </div>
                        ))}
                        {serviceRequests.length === 0 && <p className="text-sm text-yellow-600">No pending requests</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Stock Management */}
            {activeTab === "stock-management" && (
              <div className="space-y-6">
                <iframe src="/admin/stock-management" className="w-full min-h-[80vh] border rounded-lg" />
              </div>
            )}

            {/* Live Orders */}
            {activeTab === "orders" && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-end mb-2">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 md:px-6 md:py-3 text-sm md:text-base font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] touch-manipulation" onClick={() => router.push('/cashier/place-order')}>
                    <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    Add Order
                  </Button>
                </div>

                {/* Payment Verification Orders */}
                {paymentVerificationOrders.length > 0 && (
                  <Card className="bg-white border-red-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-red-900 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Payment Verification Required ({paymentVerificationOrders.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                      <div className="space-y-4">
                        {paymentVerificationOrders.map(order => (
                          <div key={order.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-red-600 text-white animate-pulse">Payment Verification</Badge>
                                <Badge className="bg-orange-500 text-white">Takeaway</Badge>
                                <span className="text-xs text-red-700">{formatTime(order.created_at)}</span>
                              </div>
                              <div className="ml-2 text-xs text-red-700 font-mono">Order #: {order.id.slice(0, 8)}</div>
                            </div>
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name} ({item.size})</span>
                                <span>RM{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            {order.order_notes && (
                              <div className="mt-1 p-1 bg-red-100 rounded text-xs">
                                <strong>Order Notes:</strong> {order.order_notes}
                              </div>
                            )}
                            <div className="flex justify-end text-xs text-red-900 font-bold mt-1">
                              Total: RM{order.total.toFixed(2)}
                            </div>
                            {order.payment_proof_url && (
                              <div className="mt-2">
                                <span className="text-xs text-red-900 font-semibold">Payment Proof:</span>
                                <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="ml-2 underline text-blue-700">View Full Size</a>
                                <div className="mt-1">
                                  <img src={order.payment_proof_url} alt="Payment Proof" className="w-32 h-32 object-contain border rounded" />
                                </div>
                              </div>
                            )}
                            <div className="flex space-x-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => verifyPayment(order.id)}
                                disabled={updating === order.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {updating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                Verify Payment
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => rejectPayment(order.id)}
                                disabled={updating === order.id}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                {updating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                                Reject Payment
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Dine-in Orders Grouped by Table */}
                <Card className="bg-white border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Dine-In Orders by Table
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto">
                    <div className="space-y-6">
                      {Object.entries(dineInOrdersByTable).map(([tableNumber, tableOrders]) => (
                        <div key={tableNumber} className="border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-blue-900 text-white">Table {tableNumber}</Badge>
                              <Badge className="bg-green-500 text-white">Dine In</Badge>
                            </div>
                            <div className="ml-2 text-xs text-blue-700 font-mono">Order #: {tableOrders[0]?.id.slice(0, 8)}</div>
                            <Button
                              size="sm"
                              className="bg-purple-500 hover:bg-purple-600 text-white"
                              onClick={() => handleOpenTablePayment(Number(tableNumber))}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Process Payment
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => handleOpenSplitPayment(Number(tableNumber))}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Split Payment
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {tableOrders.map(order => (
                              <div key={order.id} className="border border-blue-100 rounded p-2 mb-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge className={`${getStatusColor(order.status)} text-white`}>{order.status}</Badge>
                                  {order.dining_type === "reservation" && (
                                    <Badge className="bg-purple-500 text-white">Reservation</Badge>
                                  )}
                                  <span className="text-xs text-blue-700">{formatTime(order.created_at)}</span>
                                </div>
                                {order.customer_name && (
                                  <div className="text-sm text-gray-600">
                                    <p><strong>Customer:</strong> {order.customer_name}</p>
                                    {order.customer_phone && <p><strong>Phone:</strong> {order.customer_phone}</p>}
                                    {order.customer_email && <p><strong>Email:</strong> {order.customer_email}</p>}
                                    {order.number_of_people && <p><strong>Party Size:</strong> {order.number_of_people} people</p>}
                                  </div>
                                )}
                                {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className={`flex justify-between text-sm ${item.cancelled ? 'line-through text-gray-500' : ''}`}>
                                    <div className="flex-1">
                                      <span>{item.quantity}x {item.name} ({item.size})
                                        {item.notes && <span className="text-blue-600 italic"> - {item.notes}</span>}
                                        {item.cancelled && (
                                          <Badge className="ml-2 bg-red-100 text-red-600 text-xs">Cancelled</Badge>
                                        )}
                                      </span>
                                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                        <div className="text-xs text-blue-600 ml-4">
                                          Add-ons: {item.selectedAddOns.map((addon: any) => addon.name).join(", ")}
                                        </div>
                                      )}
                                    </div>
                                    <span>RM{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                                {/* Order Notes and Special Information */}
                                {(order.order_notes || order.reservation_notes) && (
                                  <div className="mt-1 p-2 bg-yellow-50 rounded text-xs">
                                    <div className="font-semibold text-gray-700 mb-1">Notes & Information:</div>
                                    {order.order_notes && (
                                      <div><strong>Order Notes:</strong> {order.order_notes}</div>
                                    )}
                                    {order.reservation_notes && (
                                      <div><strong>Reservation Notes:</strong> {order.reservation_notes}</div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Reservation Details */}
                                {(order.reservation_date || order.reservation_time || order.table_preference) && (
                                  <div className="mt-1 p-2 bg-blue-50 rounded text-xs">
                                    <div className="font-semibold text-gray-700 mb-1">Reservation Details:</div>
                                    {order.reservation_date && (
                                      <div><strong>Date:</strong> {new Date(order.reservation_date).toLocaleDateString()}</div>
                                    )}
                                    {order.reservation_time && (
                                      <div><strong>Time:</strong> {order.reservation_time}</div>
                                    )}
                                    {order.table_preference && (
                                      <div><strong>Table Preference:</strong> {order.table_preference}</div>
                                    )}
                                  </div>
                                )}
                                {/* Order Financial Breakdown */}
                                <div className="mt-2 space-y-1">
                                  <div className="flex justify-between text-xs text-blue-700">
                                    <span>Subtotal:</span>
                                    <span>RM{order.subtotal.toFixed(2)}</span>
                                  </div>
                                  {order.fees_total > 0 && (
                                    <div className="flex justify-between text-xs text-orange-600">
                                      <span>Fees:</span>
                                      <span>RM{order.fees_total.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-xs text-green-600">
                                      <span>Discount ({order.discount_reason}):</span>
                                      <span>-RM{order.discount_amount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm text-blue-900 font-bold border-t pt-1">
                                    <span>Total:</span>
                                    <span>RM{order.total.toFixed(2)}</span>
                                  </div>
                                </div>
                                {/* Payment Information */}
                                {(order.payment_method || order.payment_status || order.payment_notes || order.payment_proof_url) && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                    <div className="font-semibold text-gray-700 mb-1">Payment Details:</div>
                                    {order.payment_method && (
                                      <div><strong>Method:</strong> {order.payment_method}</div>
                                    )}
                                    {order.payment_status && (
                                      <div><strong>Status:</strong> <span className={order.payment_status === 'verified' ? 'text-green-600' : order.payment_status === 'pending' ? 'text-orange-600' : 'text-red-600'}>{order.payment_status}</span></div>
                                    )}
                                    {order.payment_notes && (
                                      <div><strong>Notes:</strong> {order.payment_notes}</div>
                                    )}
                                    {order.payment_proof_url && (
                                      <div className="mt-1">
                                        <strong>Proof:</strong> <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="ml-1 underline text-blue-700">View Image</a>
                                        <div className="mt-1">
                                          <img src={order.payment_proof_url} alt="Payment Proof" className="w-20 h-20 object-contain border rounded" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {/* Status update buttons row */}
                                <div className="flex space-x-2 mt-2">
                                  {(order.status === "pending" || order.status === "reservation_confirmed") && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateOrderStatus(order.id, "preparing")}
                                      disabled={updating === order.id}
                                      className="bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                      {updating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Preparing"}
                                    </Button>
                                  )}
                                  {(order.status === "preparing" || order.status === "reservation_ready") && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateOrderStatus(order.id, "ready")}
                                      disabled={updating === order.id}
                                      className="bg-indigo-500 hover:bg-indigo-600 text-white"
                                    >
                                      {updating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Ready"}
                                    </Button>
                                  )}
                                  {order.status === "ready" && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateOrderStatus(order.id, "served")}
                                      disabled={updating === order.id}
                                      className="bg-indigo-500 hover:bg-indigo-600 text-white"
                                    >
                                      {updating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Served"}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => printReceipt(order)}
                                    className="border-blue-300 text-blue-700"
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditOrder(order)}
                                    className="border-blue-300 text-blue-700"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelOrder(order)}
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelItems(order)}
                                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel Items
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end mt-2">
                            <span className="font-bold text-blue-900">
                              Table Total: RM{tableOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {Object.keys(dineInOrdersByTable).length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-blue-600">No open dine-in orders</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Takeaway Orders */}
                <Card className="bg-white border-orange-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-orange-900 flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Takeaway Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto">
                    <div className="space-y-4">
                      {takeawayOrders.length > 0 ? (
                        takeawayOrders.map(order => (
                          <div key={order.id} className="border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-orange-500 text-white">Takeaway</Badge>
                                <Badge className={`${getStatusColor(order.status)} text-white`}>{order.status}</Badge>
                                <span className="text-xs text-orange-700">{formatTime(order.created_at)}</span>
                              </div>
                              <Button
                                size="sm"
                                className="bg-purple-500 hover:bg-purple-600 text-white"
                                onClick={() => handleOpenTakeawayPayment(order)}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Process Payment
                              </Button>
                            </div>
                            {/* Customer Information */}
                            {order.customer_name && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <div className="font-semibold text-gray-700 mb-1">Customer Details:</div>
                                <div><strong>Name:</strong> {order.customer_name}</div>
                                {order.customer_phone && <div><strong>Phone:</strong> {order.customer_phone}</div>}
                                {order.customer_email && <div><strong>Email:</strong> {order.customer_email}</div>}
                              </div>
                            )}
                            
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className={`flex justify-between text-sm ${item.cancelled ? 'line-through text-gray-500' : ''}`}>
                                <div className="flex-1">
                                  <span>{item.quantity}x {item.name} ({item.size})
                                    {item.notes && <span className="text-orange-600 italic"> - {item.notes}</span>}
                                    {item.cancelled && (
                                      <Badge className="ml-2 bg-red-100 text-red-600 text-xs">Cancelled</Badge>
                                    )}
                                  </span>
                                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                    <div className="text-xs text-orange-600 ml-4">
                                      Add-ons: {item.selectedAddOns.map((addon: any) => addon.name).join(", ")}
                                    </div>
                                  )}
                                </div>
                                <span>RM{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            
                            {/* Order Notes */}
                            {order.order_notes && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                                <strong>Order Notes:</strong> {order.order_notes}
                              </div>
                            )}
                            
                            {/* Financial Breakdown */}
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-xs text-orange-700">
                                <span>Subtotal:</span>
                                <span>RM{order.subtotal.toFixed(2)}</span>
                              </div>
                              {order.fees_total > 0 && (
                                <div className="flex justify-between text-xs text-orange-600">
                                  <span>Fees:</span>
                                  <span>RM{order.fees_total.toFixed(2)}</span>
                                </div>
                              )}
                              {order.discount_amount > 0 && (
                                <div className="flex justify-between text-xs text-green-600">
                                  <span>Discount{order.discount_reason ? ` (${order.discount_reason})` : ""}:</span>
                                  <span>-RM{order.discount_amount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm text-orange-900 font-bold border-t pt-1">
                                <span>Total:</span>
                                <span>RM{order.total.toFixed(2)}</span>
                              </div>
                            </div>
                            
                            {/* Payment Information */}
                            {(order.payment_method || order.payment_status || order.payment_notes || order.payment_proof_url) && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <div className="font-semibold text-gray-700 mb-1">Payment Details:</div>
                                {order.payment_method && (
                                  <div><strong>Method:</strong> {order.payment_method}</div>
                                )}
                                {order.payment_status && (
                                  <div><strong>Status:</strong> <span className={order.payment_status === 'verified' ? 'text-green-600' : order.payment_status === 'pending' ? 'text-orange-600' : 'text-red-600'}>{order.payment_status}</span></div>
                                )}
                                {order.payment_notes && (
                                  <div><strong>Notes:</strong> {order.payment_notes}</div>
                                )}
                                {order.payment_proof_url && (
                                  <div className="mt-1">
                                    <strong>Proof:</strong> <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="ml-1 underline text-blue-700">View Image</a>
                                    <div className="mt-1">
                                      <img src={order.payment_proof_url} alt="Payment Proof" className="w-20 h-20 object-contain border rounded" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Status update buttons */}
                            <div className="flex space-x-2 mt-2">
                              {order.status === "pending" && (
                                <Button size="sm" onClick={() => updateOrderStatus(order.id, "preparing")} disabled={updating === order.id} className="bg-orange-500 hover:bg-orange-600 text-white">
                                  {updating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Preparing"}
                                </Button>
                              )}
                              {order.status === "preparing" && (
                                <Button size="sm" onClick={() => updateOrderStatus(order.id, "ready")} disabled={updating === order.id} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                                  {updating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Ready"}
                                </Button>
                              )}
                              {order.status === "ready" && (
                                <Button size="sm" onClick={() => handleOpenTakeawayPayment(order)} className="bg-green-500 hover:bg-green-600 text-white">
                                  Ready for Pickup
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => printReceipt(order)}
                                className="border-orange-300 text-orange-700"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditOrder(order)}
                                className="border-orange-300 text-orange-700"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelOrder(order)}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelItems(order)}
                                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel Items
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500">No open takeaway orders</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Service Requests Section */}
                <Card className="bg-white border-yellow-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-yellow-900 flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Service Requests ({serviceRequests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-64 overflow-y-auto">
                    <div className="space-y-4">
                      {serviceRequests.map((request) => (
                        <div
                          key={request.id}
                          className="border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-yellow-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-yellow-600 text-white">Table {request.table_number}</Badge>
                              <Badge className="bg-yellow-500 text-white animate-pulse">
                                {request.type.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <div className="ml-2 text-xs text-yellow-700 font-mono">Order #: {request.id.slice(0, 8)}</div>
                            <span className="text-sm text-yellow-700">{formatTime(request.created_at)}</span>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              onClick={() => updateServiceRequestStatus(request.id, "completed")}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          </div>
                        </div>
                      ))}

                      {serviceRequests.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-yellow-700">No pending service requests</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Reservations */}
                <div className="flex flex-col items-center justify-center min-h-[20vh] border border-purple-200 bg-white shadow-lg rounded-lg my-4">
                  <h3 className="text-xl font-bold text-purple-900 mb-2 mt-4">Upcoming Reservations</h3>
                  <p className="text-purple-700 mb-4">Coming Soon!</p>
                </div>
              </div>
            )}

            {/* Manual Order Entry */}
            {activeTab === "manual-order" && (
              <div className="space-y-6">
                {/* Cashier Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">Place New Order</h1>
                      <p className="text-blue-100">Process customer orders efficiently</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-100">Current Time</div>
                      <div className="text-lg font-semibold">
                        {new Date().toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-white border-blue-200 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Today's Orders</p>
                          <p className="text-2xl font-bold text-blue-600">{dailyStats.totalOrders}</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border-green-200 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Revenue</p>
                          <p className="text-2xl font-bold text-green-600">RM{dailyStats.totalRevenue.toFixed(2)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border-orange-200 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Avg Order</p>
                          <p className="text-2xl font-bold text-orange-600">RM{dailyStats.averageOrder.toFixed(2)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border-purple-200 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Active Tables</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {tableStatuses.filter(t => !t.is_available).length}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Order Interface */}
                <Card className="shadow-sm border border-gray-200 bg-white">
                  <CardHeader className="border-b border-gray-100 px-6 py-4">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 text-lg font-medium">
                      <ShoppingCart className="h-5 w-5 text-gray-600" />
                      <span>Order Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <POSMenuOrder 
                      showTableInput 
                      showOrderType
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Order History */}
            {activeTab === "history" && (
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                  <Input
                    placeholder="Search by table number or item name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-blue-300 focus:border-blue-500"
                  />
                </div>

                <Card className="bg-white border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center">
                      <History className="h-5 w-5 mr-2" />
                      Order History ({filteredOrderHistory.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOrderHistory.map((order) => (
                          <div
                            key={order.id}
                            className="border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-blue-900 text-white">Table {order.table_number}</Badge>
                                <Badge className={`${getStatusColor(order.status)} text-white`}>{order.status}</Badge>
                                <Badge className="bg-gray-500 text-white">{order.dining_type}</Badge>
                                {isKitchenOrder(order) && (
                                  <Badge className="bg-orange-500 text-white animate-pulse">
                                    🍳 Kitchen Order
                                  </Badge>
                                )}
                              </div>
                              <div className="ml-2 text-xs text-blue-700 font-mono">Order #: {order.id.slice(0, 8)}</div>
                              <span className="text-sm text-blue-700">
                                {new Date(order.created_at).toLocaleDateString()} {formatTime(order.created_at)}
                              </span>
                              <div className="ml-2 text-xs text-blue-700 font-mono">Order #: {order.id.slice(0, 8)}</div>
                            </div>
                            <div className="mb-3">
                              {order.items.map((item: any, index: number) => (
                                <div key={index} className={`flex justify-between text-sm ${item.cancelled ? 'line-through text-gray-500' : ''}`}>
                                  <span className={item.cancelled ? 'text-gray-500' : 'text-blue-900'}>
                                    {item.quantity}x {item.name} ({item.size})
                                    {item.notes && <span className="text-blue-600 italic"> - {item.notes}</span>}
                                    {item.cancelled && (
                                      <Badge className="ml-2 bg-red-100 text-red-600 text-xs">Cancelled</Badge>
                                    )}
                                  </span>
                                  <span className={item.cancelled ? 'text-gray-500' : 'text-blue-700'}>
                                    RM{(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              {/* Customer Information */}
                              {order.customer_name && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                  <div className="font-semibold text-gray-700 mb-1">Customer Details:</div>
                                  <div><strong>Name:</strong> {order.customer_name}</div>
                                  {order.customer_phone && <div><strong>Phone:</strong> {order.customer_phone}</div>}
                                  {order.customer_email && <div><strong>Email:</strong> {order.customer_email}</div>}
                                </div>
                              )}
                              
                              {/* Order Notes */}
                              {order.order_notes && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                                  <strong>Order Notes:</strong> {order.order_notes}
                                </div>
                              )}
                              
                              {/* Payment Information */}
                              {(order.payment_method || order.payment_status || order.payment_notes || order.payment_proof_url) && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                  <div className="font-semibold text-gray-700 mb-1">Payment Details:</div>
                                  {order.payment_method && (
                                    <div><strong>Method:</strong> {order.payment_method}</div>
                                  )}
                                  {order.payment_status && (
                                    <div><strong>Status:</strong> <span className={order.payment_status === 'verified' ? 'text-green-600' : order.payment_status === 'pending' ? 'text-orange-600' : 'text-red-600'}>{order.payment_status}</span></div>
                                  )}
                                  {order.payment_notes && (
                                    <div><strong>Notes:</strong> {order.payment_notes}</div>
                                  )}
                                  {order.payment_proof_url && (
                                    <div className="mt-1">
                                      <strong>Proof:</strong> <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="ml-1 underline text-blue-700">View Image</a>
                                      <div className="mt-1">
                                        <img src={order.payment_proof_url} alt="Payment Proof" className="w-20 h-20 object-contain border rounded" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="w-full">
                                {/* Financial Breakdown */}
                                <div className="space-y-1 mb-2">
                                  <div className="flex justify-between text-sm text-blue-700">
                                    <span>Subtotal:</span>
                                    <span>RM{order.subtotal.toFixed(2)}</span>
                                  </div>
                                  {order.fees_total > 0 && (
                                    <div className="flex justify-between text-sm text-orange-600">
                                      <span>Fees:</span>
                                      <span>RM{order.fees_total.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                      <span>Discount{order.discount_reason ? ` (${order.discount_reason})` : ""}:</span>
                                      <span>-RM{order.discount_amount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-lg font-bold text-blue-900 border-t pt-1">
                                    <span>Total:</span>
                                    <span>RM{order.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => printReceipt(order)}
                                  className="border-blue-300 text-blue-700"
                                >
                                  <Printer className="h-4 w-4 mr-1" />
                                  Reprint
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditOrder(order)}
                                  className="border-blue-300 text-blue-700"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                            {/* Payment Details */}
                            {(order.payment_method || order.payment_notes || order.payment_proof_url) && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-900">
                                <div className="mb-1">
                                  <strong>Payment Method:</strong> {order.payment_method || 'N/A'}
                                </div>
                                {order.payment_notes && (
                                  <div className="mb-1">
                                    <strong>Payment Notes:</strong> {order.payment_notes}
                                  </div>
                                )}
                                {order.payment_proof_url && (
                                  <div>
                                    <strong>Payment Proof:</strong> <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Image</a>
                                  </div>
                                )}
                              </div>
                            )}
                            {orderPayments[order.id] && orderPayments[order.id].length > 0 && (
                              <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-900">
                                <div className="font-bold mb-1">Payments:</div>
                                {orderPayments[order.id].map((p, idx) => (
                                  <div key={p.id || idx} className="mb-1 border-b border-blue-200 pb-1 last:border-b-0 last:pb-0">
                                    <div><strong>Amount:</strong> RM{Number(p.amount).toFixed(2)}</div>
                                    <div><strong>Method:</strong> {p.method}</div>
                                    {p.notes && <div><strong>Notes:</strong> {p.notes}</div>}
                                    {p.proof_url && <div><strong>Proof:</strong> <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Image</a></div>}
                                    <div><strong>Date:</strong> {p.created_at ? new Date(p.created_at).toLocaleString() : ''}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {filteredOrderHistory.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-blue-600">No order history found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Check-In/Check-Out */}
            {activeTab === "checkin" && (
              <div className="flex justify-center items-start w-full mt-8">
                <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-blue-900 mb-6">Check-In/Check-Out</h2>
                  <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="font-semibold text-lg text-blue-900 mb-2">Staff:</div>
                      <select
                        className="border rounded p-2 w-full md:w-64 text-blue-900"
                        value={selectedStaff?.user_id || ''}
                        onChange={e => {
                          const staff = staffList.find(s => s.user_id === e.target.value)
                          setSelectedStaff(staff)
                        }}
                      >
                        {staffList.map(staff => (
                          <option key={staff.user_id} value={staff.user_id}>{staff.full_name || staff.email}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-sm mt-2 md:mt-0">
                      Status: <span className="font-semibold text-blue-900">{todayLog ? (todayLog.check_out_time ? 'Checked Out' : isOnBreak ? 'On Break' : 'Checked In') : 'Not Checked In'}</span>
                    </div>
                  </div>
                  {errorMsg && <div className="mb-4 text-red-600 font-semibold">{errorMsg}</div>}
                  <div className="mb-6 flex flex-col gap-4 md:flex-row">
                    <button
                      className={`w-full py-3 rounded-lg text-base font-semibold transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${!todayLog ? 'bg-blue-900 hover:bg-blue-800 text-white' : todayLog && !todayLog.check_out_time ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      onClick={handleClock}
                      disabled={checkinLoading || (todayLog && todayLog.check_out_time)}
                    >
                      {!todayLog ? 'Clock In' : todayLog && !todayLog.check_out_time ? 'Clock Out' : 'Done'}
                    </button>
                    <button
                      className={`w-full py-3 rounded-lg text-base font-semibold transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 ${!todayLog || todayLog.check_out_time ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : isOnBreak ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
                      onClick={handleBreak}
                      disabled={!todayLog || todayLog.check_out_time}
                    >
                      {isOnBreak ? 'End Break' : 'Start Break'}
                    </button>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="font-semibold text-blue-900 mb-2">Today's Log</div>
                    <div className="flex flex-col md:flex-row md:gap-8 gap-2 text-blue-900">
                      <div>Check-In: <span className="font-medium">{todayLog?.check_in_time ? new Date(todayLog.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span></div>
                      <div>Check-Out: <span className="font-medium">{todayLog?.check_out_time ? new Date(todayLog.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span></div>
                      <div>Notes: <span className="font-medium">{todayLog?.notes || '-'}</span></div>
                    </div>
                    <div className="mt-4">
                      <div className="font-semibold text-blue-900 mb-1">Breaks:</div>
                      {todayLog?.breaks && todayLog.breaks.length > 0 ? (
                        <ul className="ml-4 list-disc">
                          {todayLog.breaks.map((b: any, i: number) => (
                            <li key={i}>
                              Start: {b.start ? new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                              {b.end ? ` - End: ${new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (ongoing)'}
                            </li>
                          ))}
                        </ul>
                      ) : <span>-</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Celebration */}
            {activeTab === "todays-celebration" && (
              <div className="space-y-6">
                <div className="container mx-auto max-w-3xl">
                  <h1 className="text-2xl font-bold mb-6 text-blue-900">Manage Today's Celebration</h1>
                  <form onSubmit={handleCelebrationSubmit}>
                    <Card className="mb-8 bg-white/90 shadow-lg rounded-2xl">
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <Label className="block text-sm font-medium mb-1 text-blue-700">Date</Label>
                          <Input
                            type="date"
                            value={celebrationDate}
                            onChange={e => setCelebrationDate(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-medium mb-1 text-blue-700">Coffee Name</Label>
                          <Input
                            type="text"
                            value={celebrationCoffeeName}
                            onChange={e => setCelebrationCoffeeName(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-medium mb-1 text-blue-700">Description / Tasting Notes</Label>
                          <Textarea
                            value={celebrationDescription}
                            onChange={e => setCelebrationDescription(e.target.value)}
                            rows={3}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label className="block text-sm font-medium mb-1 text-blue-700">Image</Label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCelebrationImageChange}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {celebrationImage && (
                            <img src={celebrationImage} alt="Preview" className="mt-2 rounded-lg shadow w-full max-h-64 object-cover" />
                          )}
                        </div>
                        {celebrationError && <div className="text-red-600 text-sm">{celebrationError}</div>}
                        {celebrationSuccess && <div className="text-green-700 text-sm">{celebrationSuccess}</div>}
                        <Button
                          type="submit"
                          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg transition"
                          disabled={celebrationLoading}
                        >
                          {celebrationLoading ? 'Saving...' : 'Save Celebration'}
                        </Button>
                      </CardContent>
                    </Card>
                  </form>
                  <h2 className="text-xl font-semibold mb-4 text-blue-900">Preview</h2>
                  <div className="flex flex-col md:flex-row bg-white/90 rounded-2xl shadow-lg overflow-hidden">
                    {celebrationImage && (
                      <div className="md:w-1/2 w-full flex items-center justify-center bg-blue-50 p-6 fade-in">
                        <img src={celebrationImage} alt="Celebration Coffee" className="rounded-xl shadow-md w-full max-h-80 object-cover" />
                      </div>
                    )}
                    <div className="md:w-1/2 w-full flex flex-col justify-center p-8 fade-in-text">
                      <div className="text-xs text-blue-600 mb-2">{new Date(celebrationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <h3 className="text-2xl font-bold text-blue-900 mb-2">Today's Celebration</h3>
                      <div className="text-xl font-extrabold text-blue-700 mb-2">{celebrationCoffeeName}</div>
                      <div className="text-blue-600 mb-6">{celebrationDescription}</div>
                      <Button className="rounded-full px-8 py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition">Order Now</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reservations */}
            {activeTab === "reservations" && (
              <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">Reservations</h2>
                <p className="text-lg text-blue-700">Coming Soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Edit Order - Table {editingOrder.table_number}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {editOrderItems.map((item, index) => (
                  <div key={index} className="border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <Label className="text-blue-900 font-medium">Product</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateEditOrderItem(index, "name", e.target.value)}
                          className="border-blue-300"
                        />
                      </div>
                      <div>
                        <Label className="text-blue-900 font-medium">Size</Label>
                        <Select value={item.size} onValueChange={(value) => updateEditOrderItem(index, "size", value)}>
                          <SelectTrigger className="border-blue-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="S">Small</SelectItem>
                            <SelectItem value="M">Medium</SelectItem>
                            <SelectItem value="L">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-blue-900 font-medium">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateEditOrderItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                          className="border-blue-300"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeEditOrderItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="text-blue-900 font-medium">Notes</Label>
                      <Input
                        value={item.notes || ""}
                        onChange={(e) => updateEditOrderItem(index, "notes", e.target.value)}
                        placeholder="Special instructions..."
                        className="border-blue-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="editOrderNotes" className="text-blue-900 font-medium">
                  Order Notes
                </Label>
                <Textarea
                  id="editOrderNotes"
                  value={editOrderNotes}
                  onChange={(e) => setEditOrderNotes(e.target.value)}
                  placeholder="Order-level notes..."
                  className="border-blue-300"
                  rows={3}
                />
              </div>

              {editingOrder.status === "cancelled" && (
                <div>
                  <Label htmlFor="editCancelNotes" className="text-red-900 font-medium">
                    Cancellation Reason
                  </Label>
                  <Textarea
                    id="editCancelNotes"
                    value={editingOrder.cancel_notes || ""}
                    onChange={(e) => {
                      setEditingOrder({
                        ...editingOrder,
                        cancel_notes: e.target.value
                      })
                    }}
                    placeholder="Reason for cancellation..."
                    className="border-red-300"
                    rows={3}
                  />
                </div>
              )}

              <div className="border-t pt-4 space-y-4">
                <div>
                  <Label className="text-blue-900 font-medium">Payment Method</Label>
                  <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                    <SelectTrigger className="border-blue-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="card">Credit & Debit Cards</SelectItem>
                      <SelectItem value="qr">QR Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-blue-900 font-medium">Payment Notes</Label>
                  <Textarea
                    value={editPaymentNotes}
                    onChange={e => setEditPaymentNotes(e.target.value)}
                    placeholder="Payment notes..."
                    className="border-blue-300"
                    rows={2}
                  />
                </div>
                {editPaymentMethod === "qr" && (
                  <div>
                    <Label className="text-blue-900 font-medium">Upload Payment Proof (optional)</Label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleEditPaymentProofChange}
                      className="block w-full text-sm text-blue-900 border border-blue-200 rounded cursor-pointer"
                    />
                    {editPaymentProofFile && (
                      <div className="mt-2">
                        <img src={URL.createObjectURL(editPaymentProofFile)} alt="Payment Proof Preview" className="max-h-32 rounded border" />
                      </div>
                    )}
                    {editPaymentProofUploading && (
                      <div className="text-blue-600 text-sm">Uploading image...</div>
                    )}
                    {!editPaymentProofFile && editingOrder?.payment_proof_url && (
                      <div className="mt-2">
                        <a href={editingOrder.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Existing Proof</a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>New Total:</span>
                  <span>
                    RM{editOrderItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={editOrder} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setEditingOrder(null)
                    setEditOrderItems([])
                    setEditOrderNotes("")
                    setEditPaymentMethod("cash")
                    setEditPaymentNotes("")
                    setEditPaymentProofFile(null)
                  }}
                  variant="outline"
                  className="border-blue-300 text-blue-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Processing Modal */}
      {processingOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Process Payment - Table {processingOrder.table_number}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-blue-900 font-medium">Dining Type</Label>
                <Select
                  value={selectedDiningType}
                  onValueChange={(value: "dine_in" | "takeaway" | "reservation") => setSelectedDiningType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine_in">Dine In</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="reservation">Reservation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-blue-900 font-medium">Additional Fees</Label>
                <div className="space-y-2 mt-2">
                  {fees
                    .filter((fee) => fee.applies_to === "both" || fee.applies_to === selectedDiningType)
                    .map((fee) => (
                      <div key={fee.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={fee.id}
                          checked={selectedFees.includes(fee.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFees([...selectedFees, fee.id])
                            } else {
                              setSelectedFees(selectedFees.filter((id) => id !== fee.id))
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <label htmlFor={fee.id} className="text-sm text-blue-700">
                          {fee.name} - {fee.type === "percentage" ? `${fee.amount}%` : `RM${fee.amount.toFixed(2)}`}
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <Label htmlFor="discount" className="text-blue-900 font-medium">
                  Discount Amount (RM)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number.parseFloat(e.target.value) || 0)}
                  className="border-blue-300 focus:border-blue-500"
                />
              </div>

              {discountAmount > 0 && (
                <div>
                  <Label htmlFor="discountReason" className="text-blue-900 font-medium">
                    Discount Reason
                  </Label>
                  <Input
                    id="discountReason"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="e.g., Senior discount, Staff discount"
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>RM{processingOrder.subtotal?.toFixed(2) || processingOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fees:</span>
                    <span>
                      RM
                      {fees
                        .filter(
                          (fee) =>
                            selectedFees.includes(fee.id) &&
                            (fee.applies_to === "both" || fee.applies_to === selectedDiningType),
                        )
                        .reduce((total, fee) => {
                          if (fee.type === "percentage") {
                            return total + (processingOrder.subtotal * fee.amount) / 100
                          }
                          return total + fee.amount
                        }, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  {/* Show order's original discount */}
                  {processingOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>
                        Discount
                        {processingOrder.discount_reason ? ` (${processingOrder.discount_reason})` : ""}
                      </span>
                      <span>-RM{processingOrder.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {/* Show manual/extra discount */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>
                        Additional Discount
                        {discountReason ? ` (${discountReason})` : ""}
                      </span>
                      <span>-RM{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>
                      RM
                      {(
                        processingOrder.subtotal +
                        fees
                          .filter(
                            (fee) =>
                              selectedFees.includes(fee.id) &&
                              (fee.applies_to === "both" || fee.applies_to === selectedDiningType),
                          )
                          .reduce((total, fee) => {
                            if (fee.type === "percentage") {
                              return total + (processingOrder.subtotal * fee.amount) / 100
                            }
                            return total + fee.amount
                          }, 0)
                        - (processingOrder.discount_amount || 0)
                        - discountAmount
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={processPayment} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  <Receipt className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
                <Button
                  onClick={() => setProcessingOrder(null)}
                  variant="outline"
                  className="border-blue-300 text-blue-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table Payment Modal */}
      <Dialog open={showTablePaymentModal} onOpenChange={setShowTablePaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment - Table {processingTable}</DialogTitle>
          </DialogHeader>
          {processingTable && dineInOrdersByTable[processingTable] && (
            <div className="space-y-6">
              {paymentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm">
                  {paymentError}
                </div>
              )}
              <div className="space-y-2">
                {dineInOrdersByTable[processingTable].map(order => (
                  <div key={order.id} className="border border-blue-100 rounded p-2 mb-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={`${getStatusColor(order.status)} text-white`}>{order.status}</Badge>
                      <span className="text-xs text-blue-700">{formatTime(order.created_at)}</span>
                    </div>
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-blue-900">
                          {item.quantity}x {item.name} ({item.size})
                          {item.notes && <span className="text-blue-600 italic"> - {item.notes}</span>}
                        </span>
                        <span className="text-blue-700">RM{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.order_notes && (
                      <div className="mt-1 p-1 bg-blue-50 rounded text-xs">
                        <strong>Order Notes:</strong> {order.order_notes}
                      </div>
                    )}
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between text-xs text-green-600 mt-1">
                        <span>Discount ({order.discount_reason}):</span>
                        <span>-RM{order.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-end text-xs text-blue-900 font-bold mt-1">
                      Total: RM{order.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-900 text-lg">
                  Grand Total: RM{dineInOrdersByTable[processingTable].reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                </span>
              </div>
              
              {/* Discount Section */}
              <div className="flex justify-between items-center mb-2">
                {tablePaymentDiscount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-700 font-medium">Discount: -RM{tablePaymentDiscount.toFixed(2)} {tablePaymentDiscountReason && `(${tablePaymentDiscountReason})`}</span>
                    <Button size="sm" variant="outline" onClick={() => { setTablePaymentDiscount(0); setTablePaymentDiscountReason(""); }}>Remove</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setShowTableDiscountModal(true)}>Add Discount</Button>
                )}
              </div>
              
              {/* Final Total with Discount */}
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-bold text-blue-900 text-lg">Final Total:</span>
                <span className="font-bold text-blue-900 text-lg">
                  RM{(dineInOrdersByTable[processingTable].reduce((sum, o) => sum + o.total, 0) - tablePaymentDiscount).toFixed(2)}
                </span>
              </div>
              
              {/* Payment Method Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-900">Payment Method</label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={paymentMethod === "cash" ? "default" : "outline"} onClick={() => setPaymentMethod("cash")}>Cash</Button>
                  <Button type="button" variant={paymentMethod === "visa" ? "default" : "outline"} onClick={() => setPaymentMethod("visa")}>Visa</Button>
                  <Button type="button" variant={paymentMethod === "card" ? "default" : "outline"} onClick={() => setPaymentMethod("card")}>Credit & Debit Cards</Button>
                  <Button type="button" variant={paymentMethod === "qr" ? "default" : "outline"} onClick={() => setPaymentMethod("qr")}>QR Payment</Button>
                </div>
              </div>
              {/* Payment Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-900">Payment Notes</label>
                <textarea
                  className="w-full border border-blue-200 rounded p-2 text-sm"
                  rows={2}
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Enter any payment notes (optional)"
                />
              </div>
              {/* QR Payment Proof Upload */}
              {paymentMethod === "qr" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-900">Upload Payment Proof (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePaymentProofChange}
                    className="block w-full text-sm text-blue-900 border border-blue-200 rounded cursor-pointer"
                  />
                  {paymentProofFile && (
                    <div className="mt-2">
                      <img src={URL.createObjectURL(paymentProofFile)} alt="Payment Proof Preview" className="max-h-32 rounded border" />
                    </div>
                  )}
                  {paymentProofUploading && (
                    <div className="text-blue-600 text-sm">Uploading image...</div>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleProcessTablePayment}
                  disabled={paymentProofUploading}
                >
                  <Receipt className="h-4 w-4 mr-1" />
                  Confirm Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Takeaway Payment Modal */}
      <Dialog open={showTakeawayPaymentModal} onOpenChange={setShowTakeawayPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment - Takeaway</DialogTitle>
          </DialogHeader>
          {processingTakeawayOrder && (
            <div className="space-y-6">
              {takeawayPaymentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm">
                  {takeawayPaymentError}
                </div>
              )}
              <div className="space-y-2">
                <div className="border border-orange-100 rounded p-2 mb-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge className={`${getStatusColor(processingTakeawayOrder.status)} text-white`}>{processingTakeawayOrder.status}</Badge>
                    <span className="text-xs text-orange-700">{formatTime(processingTakeawayOrder.created_at)}</span>
                  </div>
                  {processingTakeawayOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-orange-900">
                        {item.quantity}x {item.name} ({item.size})
                        {item.notes && <span className="text-orange-600 italic"> - {item.notes}</span>}
                      </span>
                      <span className="text-orange-700">RM{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {processingTakeawayOrder.order_notes && (
                    <div className="mt-1 p-1 bg-orange-50 rounded text-xs">
                      <strong>Order Notes:</strong> {processingTakeawayOrder.order_notes}
                    </div>
                  )}
                  <div className="flex justify-end text-xs text-orange-900 font-bold mt-1">
                    Total: RM{processingTakeawayOrder.total.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-orange-900 text-lg">
                  Total: RM{processingTakeawayOrder.total.toFixed(2)}
                </span>
              </div>
              {/* Payment Method Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-orange-900">Payment Method</label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={takeawayPaymentMethod === "cash" ? "default" : "outline"} onClick={() => setTakeawayPaymentMethod("cash")}>Cash</Button>
                  <Button type="button" variant={takeawayPaymentMethod === "visa" ? "default" : "outline"} onClick={() => setTakeawayPaymentMethod("visa")}>Visa</Button>
                  <Button type="button" variant={takeawayPaymentMethod === "card" ? "default" : "outline"} onClick={() => setTakeawayPaymentMethod("card")}>Credit & Debit Cards</Button>
                  <Button type="button" variant={takeawayPaymentMethod === "qr" ? "default" : "outline"} onClick={() => setTakeawayPaymentMethod("qr")}>QR Payment</Button>
                </div>
              </div>
              {/* Payment Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-orange-900">Payment Notes</label>
                <textarea
                  className="w-full border border-orange-200 rounded p-2 text-sm"
                  rows={2}
                  value={takeawayPaymentNotes}
                  onChange={e => setTakeawayPaymentNotes(e.target.value)}
                  placeholder="Enter any payment notes (optional)"
                />
              </div>
              {/* QR Payment Proof Upload */}
              {takeawayPaymentMethod === "qr" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-orange-900">Upload Payment Proof (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleTakeawayPaymentProofChange}
                    className="block w-full text-sm text-orange-900 border border-orange-200 rounded cursor-pointer"
                  />
                  {takeawayPaymentProofFile && (
                    <div className="mt-2">
                      <img src={URL.createObjectURL(takeawayPaymentProofFile)} alt="Payment Proof Preview" className="max-h-32 rounded border" />
                    </div>
                  )}
                  {takeawayPaymentProofUploading && (
                    <div className="text-orange-600 text-sm">Uploading image...</div>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleProcessTakeawayPayment}
                  disabled={takeawayPaymentProofUploading}
                >
                  <Receipt className="h-4 w-4 mr-1" />
                  Confirm Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Split Payment Modal */}
      <Dialog open={showSplitPaymentModal} onOpenChange={setShowSplitPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Split Payment (by Items)</DialogTitle>
          </DialogHeader>
          {processingTable && dineInOrdersByTable[processingTable] && (
            <div className="space-y-6">
              {splitPaymentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm">{splitPaymentError}</div>
              )}
              {/* List all items with remaining unpaid quantity */}
              <div className="space-y-2">
                {(() => {
                  const order = dineInOrdersByTable[processingTable][0]
                  const remaining = getRemainingQuantities(order, splitPayments)
                  return order.items.map((item, idx) => {
                    const key = `${item.id || idx}-${item.size}`
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <span className="flex-1">{item.quantity}x {item.name} ({item.size}) - RM{item.price.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">Unpaid: {remaining[key]}</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          max={remaining[key]}
                          value={splitPaymentItems[key] || ''}
                          onChange={e => handleSplitPaymentItemQty(key, remaining[key], e.target.value)}
                          className="w-20"
                        />
                      </div>
                    )
                  })
                })()}
              </div>
              {/* Subtotal */}
              <div className="flex justify-between font-bold text-lg">
                <span>Subtotal:</span>
                <span>RM{(() => {
                  const order = dineInOrdersByTable[processingTable][0]
                  return getSplitPaymentSubtotal(order).toFixed(2)
                })()}</span>
              </div>
              {/* Payment Method Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-900">Payment Method</label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={splitPaymentMethod === "cash" ? "default" : "outline"} onClick={() => setSplitPaymentMethod("cash")}>Cash</Button>
                  <Button type="button" variant={splitPaymentMethod === "visa" ? "default" : "outline"} onClick={() => setSplitPaymentMethod("visa")}>Visa</Button>
                  <Button type="button" variant={splitPaymentMethod === "card" ? "default" : "outline"} onClick={() => setSplitPaymentMethod("card")}>Credit & Debit Cards</Button>
                  <Button type="button" variant={splitPaymentMethod === "qr" ? "default" : "outline"} onClick={() => setSplitPaymentMethod("qr")}>QR Payment</Button>
                </div>
              </div>
              {/* Payment Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-900">Payment Notes</label>
                <textarea
                  className="w-full border border-blue-200 rounded p-2 text-sm"
                  rows={2}
                  value={splitPaymentNotes}
                  onChange={e => setSplitPaymentNotes(e.target.value)}
                  placeholder="Enter any payment notes (optional)"
                />
              </div>
              {/* QR Payment Proof Upload */}
              {splitPaymentMethod === "qr" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-900">Upload Payment Proof (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleSplitPaymentProofChange}
                    className="block w-full text-sm text-blue-900 border border-blue-200 rounded cursor-pointer"
                  />
                  {splitPaymentProofFile && (
                    <div className="mt-2">
                      <img src={URL.createObjectURL(splitPaymentProofFile)} alt="Payment Proof Preview" className="max-h-32 rounded border" />
                    </div>
                  )}
                  {splitPaymentProofUploading && (
                    <div className="text-blue-600 text-sm">Uploading image...</div>
                  )}
                </div>
              )}
              {/* Previous Payments List */}
              <div className="space-y-2">
                <div className="font-bold text-blue-900">Previous Payments:</div>
                {splitPayments.length === 0 && <div className="text-sm text-gray-500">No payments yet.</div>}
                {splitPayments.map((p, idx) => (
                  <div key={p.id || idx} className="border border-blue-100 rounded p-2 text-xs">
                    <div>Amount: RM{p.amount.toFixed(2)} | Method: {p.method}</div>
                    <div>Items: {Object.entries(p.items || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
                    {p.notes && <div>Notes: {p.notes}</div>}
                    {p.proof_url && <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Proof</a>}
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleConfirmSplitPayment(processingTable)}
                  disabled={splitPaymentLoading || splitPaymentProofUploading}
                >
                  <Receipt className="h-4 w-4 mr-1" />
                  Confirm Split Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  <p><strong>Type:</strong> {orderToCancel.dining_type}</p>
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

      {/* Cancel Individual Items Dialog */}
      <Dialog open={showCancelItemsDialog} onOpenChange={setShowCancelItemsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Cancel Individual Items
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                Are you sure you want to cancel these items? This action cannot be undone.
              </p>
            </div>
            
            {orderToCancelItems && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Select Items to Cancel:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {orderToCancelItems.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                      <input
                        type="checkbox"
                        id={`item-${index}`}
                        checked={selectedItemsToCancel.has(index)}
                        onChange={() => toggleItemSelection(index)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`item-${index}`} className="flex-1 text-sm">
                        <div className="font-medium">{item.quantity}x {item.name} ({item.size})</div>
                        <div className="text-gray-600">RM{(item.price * item.quantity).toFixed(2)}</div>
                        {item.notes && <div className="text-gray-500 italic text-xs">Notes: {item.notes}</div>}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedItemsToCancel.size > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                    <strong>{selectedItemsToCancel.size}</strong> item(s) selected for cancellation
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="cancelItemsNotes" className="text-sm font-medium text-gray-700">
                Cancellation Reason (Optional)
              </Label>
              <Textarea
                id="cancelItemsNotes"
                placeholder="e.g., Out of stock, customer requested, etc..."
                value={cancelItemsNotes}
                onChange={(e) => setCancelItemsNotes(e.target.value)}
                className="mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelItemsDialog(false)
                setOrderToCancelItems(null)
                setSelectedItemsToCancel(new Set())
                setCancelItemsNotes("")
              }}
              disabled={cancellingItems}
            >
              Keep Items
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelItems}
              disabled={cancellingItems}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancellingItems ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Items
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Order Modal */}
      <Dialog open={showAddOrderModal} onOpenChange={setShowAddOrderModal}>
        <DialogContent className="max-w-7xl w-full">
          <DialogHeader>
            <DialogTitle>Place Takeaway Order</DialogTitle>
          </DialogHeader>
          <POSMenuOrder
            orderTypeDefault="takeaway"
            showOrderType={false}
            showTableInput={false}
            onOrderPlaced={() => {
              setShowAddOrderModal(false);
              fetchOrders();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Table Payment Discount Modal */}
      <Dialog open={showTableDiscountModal} onOpenChange={setShowTableDiscountModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Discount Code Section */}
            <div>
              <Label>Enter Discount Code</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Enter discount code"
                  value={tablePaymentDiscountReason}
                  onChange={e => setTablePaymentDiscountReason(e.target.value)}
                />
                <Button onClick={() => { setTablePaymentDiscount(5); setShowTableDiscountModal(false); }}>Apply</Button> {/* Replace 5 with actual logic */}
              </div>
            </div>
            {/* Available Discounts Dropdown (placeholder) */}
            <div>
              <Label>Or Select from Available Discounts</Label>
              <select className="w-full border rounded p-2 mt-1">
                <option>Choose a discount code</option>
              </select>
            </div>
            {/* Manual Discount Section */}
            <div className="border-t pt-4">
              <Label>Manual Discount</Label>
              <div className="mt-1">Enter a custom discount amount and reason</div>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Discount Amount (RM)"
                value={tablePaymentDiscount || ''}
                onChange={e => setTablePaymentDiscount(Number(e.target.value) || 0)}
                className="mt-2"
              />
              <Input
                placeholder="Reason (Optional)"
                value={tablePaymentDiscountReason}
                onChange={e => setTablePaymentDiscountReason(e.target.value)}
                className="mt-2"
              />
              <Button className="mt-2 w-full" onClick={() => setShowTableDiscountModal(false)} disabled={tablePaymentDiscount <= 0}>
                Apply Manual Discount
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}

