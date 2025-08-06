"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/protected-route"
import {
  LayoutDashboard,
  Coffee,
  Users,
  Lightbulb,
  Tag,
  Settings,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  CheckCircle,
  Plus,
  Search,
  Download,
  MessageCircle,
  Star,
  Check,
  XCircle,
  QrCode,
  DollarSign,
  Upload,
  LogOut,
  Printer,
  Calendar,
  Package,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import UserManagement from "@/components/admin/user-management";
import { saveAs } from "file-saver";
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Strike from '@tiptap/extension-strike';
import ImageResize from 'tiptap-extension-resize-image';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Switch } from "@/components/ui/switch"
import StockManagementPage from "@/app/admin/stock-management/page";
import DiscountManagement from "@/components/admin/discount-management";
import UpsellRuleManagement from "@/components/admin/upsell-rule-management";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import PromoManagement from '@/components/admin/promo-management';
import ProductManagementNew from '@/app/admin/product-management-new/page';

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  rating: number
  reviews_count: number
  show_in_kitchen: boolean
  active: boolean
  stock_quantity: number
  low_stock_threshold: number
  track_stock: boolean
  isbestselling?: boolean
}

interface Category {
  id: string
  name: string
  description: string
  image_url: string
  color: string
  active: boolean
}

interface Table {
  id: string
  number: number
  zone: string
  status: string
  capacity: number
  is_available: boolean
}

interface UpsellRule {
  id: string
  trigger_product: string
  suggested_product: string
  description: string
  active: boolean
}

interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string
  table_number: number
  status: "pending" | "approved" | "rejected"
  created_at: string
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

interface Event {
  id: string
  title: string
  description: string | null
  date: string
  image_url: string | null
  status: "draft" | "published" | "cancelled"
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

// Add Order interface (copy from cashier)
interface Order {
  id: string
  table_number: number
  items: any[]
  total: number
  subtotal: number
  fees_total: number
  discount_amount: number
  discount_reason: string
  dining_type: "dine_in" | "takeaway" | "reservation" | "both"
  status: string
  order_notes: string
  created_at: string
  payment_method?: string
  payment_notes?: string
  payment_proof_url?: string
}

export default function AdminDashboard() {
  // Reservation state (move to top)
  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationsSearch, setReservationsSearch] = useState("");
  const [selectedReservationDate, setSelectedReservationDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<Table[]>([])

  const [reviews, setReviews] = useState<Review[]>([])
  const [fees, setFees] = useState<Fee[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingTable, setEditingTable] = useState<Table | null>(null)

  const [editingFee, setEditingFee] = useState<Fee | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Events state
  const [events, setEvents] = useState<Event[]>([])
  const [eventRsvps, setEventRsvps] = useState<EventRSVP[]>([])
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 16),
    image_url: "",
    status: "draft"
  })
  const [eventImageFile, setEventImageFile] = useState<File | null>(null)
  const [uploadingEventImage, setUploadingEventImage] = useState(false)
  const [dragOverEvent, setDragOverEvent] = useState(false)
  
  // QR Code Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [menuUrl, setMenuUrl] = useState("")

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    image_url: "",
    show_in_kitchen: true,
    active: true,
    stock_quantity: 0,
    low_stock_threshold: 10,
    track_stock: true,
    isbestselling: false,
  })

  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: "",
    description: "",
    image_url: "",
    color: "#cccccc",
    active: true,
  })

  const [newTable, setNewTable] = useState({
    number: 0,
    zone: "main",
    capacity: 4,
  })



  const [newFee, setNewFee] = useState<Partial<Fee>>({
    name: "",
    description: "",
    amount: 0,
    type: "fixed",
    applies_to: "both",
    active: true,
  })

  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalTables: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingReviews: 0,
  })

  // Add file upload states
  const [uploadingProductImage, setUploadingProductImage] = useState(false)
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false)
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null)
  const [dragOverProduct, setDragOverProduct] = useState(false)
  const [dragOverCategory, setDragOverCategory] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)

  const { toast } = useToast()
  const { user: adminUser, signOut: adminSignOut } = useAuth()

  // Add at the top, after other useState hooks
  const [settings, setSettings] = useState({
    cafe_name: '',
    location: '',
    phone_number: '',
    operating_hours: { open: '06:00', close: '22:00' },
    system_config: {
      auto_print: true,
      notifications: true,
      kitchen_auto_refresh: true,
      order_timeout_alerts: true,
    },
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Fetch settings when settings tab is opened
  useEffect(() => {
    if (activeTab === 'settings') {
      setSettingsLoading(true);
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSettings({
              cafe_name: data.cafe_name || '',
              location: data.location || '',
              phone_number: data.phone_number || '',
              operating_hours: data.operating_hours || { open: '06:00', close: '22:00' },
              system_config: data.system_config || {
                auto_print: true,
                notifications: true,
                kitchen_auto_refresh: true,
                order_timeout_alerts: true,
              },
            });
          }
        })
        .catch(() => showError('Failed to load settings'))
        .finally(() => setSettingsLoading(false));
    }
  }, [activeTab]);

  // Save settings handler
  const saveSettings = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save settings');
      setSuccess('Settings saved successfully!');
      showSuccess('Settings saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
      showError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats()
    if (activeTab === "products") fetchProducts()
    if (activeTab === "categories") fetchCategories()
    if (activeTab === "tables") fetchTables()

    if (activeTab === "reviews") fetchReviews()
    if (activeTab === "fees") fetchFees()
    if (activeTab === "reservations") fetchReservations()
    if (activeTab === "events") fetchEvents()
    if (activeTab === "settings") {
      // any settings loading logic
    }
    if (activeTab === "order-history") {
      setOrderHistoryLoading(true);
      supabase
        .from("orders")
        .select("*")
        .in("status", ["served", "paid", "cancelled", "reservation_confirmed", "reservation_completed"])
        .in("dining_type", ["dine_in", "takeaway", "reservation"])
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          setOrderHistory(data || []);
          setOrderHistoryLoading(false);
          if (data && data.length > 0) {
            const orderIds = data.map((o) => o.id);
            supabase
              .from("payments")
              .select("*")
              .in("order_id", orderIds)
              .then(({ data: payments, error }) => {
                if (!error && payments) {
                  const grouped: Record<string, any[]> = {};
                  payments.forEach((p) => {
                    if (!grouped[p.order_id]) grouped[p.order_id] = [];
                    grouped[p.order_id].push(p);
                  });
                  setOrderPayments(grouped);
                } else {
                  setOrderPayments({});
                }
              });
          } else {
            setOrderPayments({});
          }
        });
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === "reservations") {
      fetchReservations()
    }
  }, [activeTab, selectedReservationDate])

  const fetchDashboardStats = async () => {
    try {
      const [productsRes, tablesRes, ordersRes, reviewsRes] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("tables").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total").in("dining_type", ["dine_in", "takeaway", "reservation"]),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ])

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + order.total, 0) || 0

      setDashboardStats({
        totalProducts: productsRes.count || 0,
        totalTables: tablesRes.count || 0,
        totalOrders: ordersRes.data?.length || 0,
        totalRevenue,
        pendingReviews: reviewsRes.count || 0,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("products").select("*").order("name")
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      showError("Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      showError("Failed to fetch categories")
    } finally {
      setLoading(false)
    }
  }

  const fetchTables = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("tables").select("*").order("number")
      if (error) throw error
      setTables(data || [])
    } catch (error) {
      console.error("Error fetching tables:", error)
      showError("Failed to fetch tables")
    } finally {
      setLoading(false)
    }
  }



  const fetchReviews = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false })
      console.log("fetchReviews response:", { data, error })
      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
      showError("Failed to fetch reviews")
    } finally {
      setLoading(false)
    }
  }

  const fetchFees = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("fees").select("*").order("name")
      if (error) throw error
      setFees(data || [])
    } catch (error) {
      console.error("Error fetching fees:", error)
      showError("Failed to fetch fees")
    } finally {
      setLoading(false)
    }
  }

  const fetchReservations = async (date?: string) => {
    setReservationsLoading(true)
    try {
      const targetDate = date || selectedReservationDate
      const { data, error } = await supabase.rpc('get_reservations_by_date', { target_date: targetDate })
      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error("Error fetching reservations:", error)
      showError("Failed to fetch reservations")
    } finally {
      setReservationsLoading(false)
    }
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("events").select("*").order("date", { ascending: false })
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
      showError("Failed to fetch events")
    } finally {
      setLoading(false)
    }
  }

  const fetchEventRsvps = async () => {
    try {
      const { data, error } = await supabase.from("event_rsvps").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setEventRsvps(data || [])
    } catch (error) {
      console.error("Error fetching event RSVPs:", error)
      showError("Failed to fetch event RSVPs")
    }
  }

  // Add file upload functions
  const uploadImage = async (file: File, type: 'product' | 'category' | 'event'): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${type}-${Date.now()}.${fileExt}`
    const filePath = `${type}s/${fileName}`

    const { error: uploadError, data } = await supabase.storage
      .from('images')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleFileSelect = (file: File, type: 'product' | 'category' | 'event') => {
    if (file.type.startsWith('image/')) {
      if (type === 'product') {
        setProductImageFile(file)
        setNewProduct({ ...newProduct, image_url: URL.createObjectURL(file) })
      } else if (type === 'category') {
        setCategoryImageFile(file)
        setNewCategory({ ...newCategory, image_url: URL.createObjectURL(file) })
      } else if (type === 'event') {
        setEventImageFile(file)
        setNewEvent({ ...newEvent, image_url: URL.createObjectURL(file) })
      }
    } else {
      showError('Please select an image file')
    }
  }

  const handleDragOver = (e: React.DragEvent, type: 'product' | 'category' | 'event') => {
    e.preventDefault()
    if (type === 'product') {
      setDragOverProduct(true)
    } else if (type === 'category') {
      setDragOverCategory(true)
    } else if (type === 'event') {
      setDragOverEvent(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent, type: 'product' | 'category' | 'event') => {
    e.preventDefault()
    if (type === 'product') {
      setDragOverProduct(false)
    } else if (type === 'category') {
      setDragOverCategory(false)
    } else if (type === 'event') {
      setDragOverEvent(false)
    }
  }

  const handleDrop = (e: React.DragEvent, type: 'product' | 'category' | 'event') => {
    e.preventDefault()
    if (type === 'product') {
      setDragOverProduct(false)
    } else if (type === 'category') {
      setDragOverCategory(false)
    } else if (type === 'event') {
      setDragOverEvent(false)
    }

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0], type)
    }
  }

  const saveProduct = async () => {
    // Validate price
    const price = Number(newProduct.price);
    if (!newProduct.name || isNaN(price) || price <= 0) {
      showError("Please fill in all required fields");
      return;
    }
    // Check price is not too large and has at most 2 decimal places
    if (price > 99999999.99) {
      showError("Price is too large. Please enter a value less than 100,000,000.");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(price.toString())) {
      showError("Price must have at most 2 decimal places.");
      return;
    }
    if (!productImageFile && !newProduct.image_url) {
      showError("Please select an image");
      return;
    }

    setSaving(true)
    try {
      let imageUrl = newProduct.image_url

      // Upload new image if file is selected
      if (productImageFile) {
        setUploadingProductImage(true)
        imageUrl = await uploadImage(productImageFile, 'product')
        setUploadingProductImage(false)
      }

      const productData = {
        ...newProduct,
        image_url: imageUrl,
      }

      if (editingProduct) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id)
        if (error) throw error
        showSuccess("Product updated successfully!")
      } else {
        const { error } = await supabase.from("products").insert([
          {
            ...productData,
            rating: 4.5,
            reviews_count: 0,
          },
        ])
        if (error) throw error
        showSuccess("Product added successfully!")
      }

      setNewProduct({ 
        name: "", 
        description: "", 
        price: 0, 
        category: "", 
        image_url: "", 
        show_in_kitchen: true,
        active: true,
        stock_quantity: 0,
        low_stock_threshold: 10,
        track_stock: true,
        isbestselling: false,
      })
      setProductImageFile(null)
      setEditingProduct(null)
      fetchProducts()
      fetchDashboardStats()
    } catch (error) {
      console.error("Error saving product:", JSON.stringify(error, null, 2))
      showError("Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  const saveCategory = async () => {
    if (!newCategory.name) {
      showError("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      let imageUrl = newCategory.image_url

      // Upload new image if file is selected
      if (categoryImageFile) {
        setUploadingCategoryImage(true)
        imageUrl = await uploadImage(categoryImageFile, 'category')
        setUploadingCategoryImage(false)
      }

      const categoryData = {
        ...newCategory,
        image_url: imageUrl,
      }

      if (editingCategory) {
        const { error } = await supabase.from("categories").update(categoryData).eq("id", editingCategory.id)
        if (error) throw error
        showSuccess("Category updated successfully!")
      } else {
        const { error } = await supabase.from("categories").insert([categoryData])
        if (error) throw error
        showSuccess("Category added successfully!")
      }

      setNewCategory({ name: "", description: "", color: "#cccccc", image_url: "" })
      setCategoryImageFile(null)
      setEditingCategory(null)
      fetchCategories()
    } catch (error) {
      let errMsg = '';
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') errMsg = error.message;
        else if ('msg' in error && typeof error.msg === 'string') errMsg = error.msg;
        else errMsg = JSON.stringify(error);
      } else {
        errMsg = String(error);
      }
      if (
        errMsg.includes('duplicate key value') && errMsg.includes('categories_name_key')
      ) {
        showError('Category name already exists. Please choose a different name.');
      } else {
        showError('Failed to save category');
      }
      console.error("Error saving category:", errMsg, error);
      showError("Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  const saveTable = async () => {
    if (!newTable.number || newTable.capacity <= 0) {
      showError("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      if (editingTable) {
        const { error } = await supabase.from("tables").update(newTable).eq("id", editingTable.id)
        if (error) throw error
        showSuccess("Table updated successfully!")
      } else {
        const { error } = await supabase.from("tables").insert([newTable])
        if (error) throw error
        showSuccess("Table added successfully!")
      }

      setNewTable({ number: 0, zone: "Indoor", capacity: 4 })
      setEditingTable(null)
      fetchTables()
      fetchDashboardStats()
    } catch (error) {
      console.error("Error saving table:", error)
      showError("Failed to save table")
    } finally {
      setSaving(false)
    }
  }



  const saveFee = async () => {
    if (!newFee.name || (newFee.amount ?? 0) <= 0) {
      showError("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      if (editingFee) {
        const { error } = await supabase.from("fees").update(newFee).eq("id", editingFee.id)
        if (error) throw error
        showSuccess("Fee updated successfully!")
      } else {
        const { error } = await supabase.from("fees").insert([{ ...newFee, active: true }])
        if (error) throw error
        showSuccess("Fee added successfully!")
      }

      setNewFee({ name: "", description: "", amount: 0, type: "fixed", applies_to: "both" })
      setEditingFee(null)
      fetchFees()
    } catch (error) {
      console.error("Error saving fee:", error)
      showError("Failed to save fee")
    } finally {
      setSaving(false)
    }
  }

  const saveEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      showError("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      let imageUrl = newEvent.image_url

      // Upload new image if file is selected
      if (eventImageFile) {
        setUploadingEventImage(true)
        imageUrl = await uploadImage(eventImageFile, 'event')
        setUploadingEventImage(false)
      }

      const eventData = {
        ...newEvent,
        image_url: imageUrl,
      }

      if (editingEvent) {
        const { error } = await supabase.from("events").update(eventData).eq("id", editingEvent.id)
        if (error) throw error
        showSuccess("Event updated successfully!")
      } else {
        const { error } = await supabase.from("events").insert([eventData])
        if (error) throw error
        showSuccess("Event added successfully!")
      }

      setNewEvent({
        title: "",
        description: "",
        date: new Date().toISOString().slice(0, 16),
        image_url: "",
        status: "draft"
      })
      setEventImageFile(null)
      setEditingEvent(null)
      fetchEvents()
    } catch (error) {
      console.error("Error saving event:", error)
      showError("Failed to save event")
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (table: string, id: string, refreshFunction: () => void) => {
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return
    }

    try {
      await supabase.from(table).delete().eq("id", id)
      showSuccess("Item deleted successfully.")
      refreshFunction()
    } catch (error: any) {
      console.error("Error deleting item:", error)
      showError(error.message || "Failed to delete item.")
    }
  }

  const updateReviewStatus = async (id: string, status: "approved" | "rejected") => {
    console.log("updateReviewStatus called with:", { id, status });
    if (!user) {
      showError("You must be logged in to perform this action.");
      return;
    }
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          status,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq("id", id);

      console.log("Supabase response:", { error });

      if (error) throw error;
      showSuccess(`Review ${status} successfully!`);
      fetchReviews();
      fetchDashboardStats();
    } catch (error) {
      console.error("Error updating review status:", error);
      showError("Failed to update review status");
    }
  }



  const generateQRCode = (tableNumber: number) => {
    const url = `${window.location.origin}/menu?table=${tableNumber}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
    
    setSelectedTableNumber(tableNumber)
    setQrCodeUrl(qrUrl)
    setMenuUrl(url)
    setQrModalOpen(true)
  }

  const printQRCode = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow && selectedTableNumber) {
      printWindow.document.write(`
        <html>
          <head><title>QR Code - Table ${selectedTableNumber}</title></head>
          <body style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Table ${selectedTableNumber}</h2>
            <img src="${qrCodeUrl}" alt="QR Code for Table ${selectedTableNumber}" style="border: 2px solid #d1d5db; border-radius: 8px;" />
            <p style="color: #6b7280; margin-top: 15px; font-size: 16px;">Scan to view menu</p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">${menuUrl}</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const startEdit = (item: any, type: string) => {
    switch (type) {
      case "product":
        setEditingProduct(item)
        setNewProduct({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image_url: item.image_url,
          show_in_kitchen: item.show_in_kitchen,
        })
        break
      case "category":
        setEditingCategory(item)
        setNewCategory({
          name: item.name,
          description: item.description,
          color: item.color,
          image_url: item.image_url,
        })
        break
      case "table":
        setEditingTable(item)
        setNewTable({
          number: item.number,
          zone: item.zone,
          capacity: item.capacity,
        })
        break

      case "fee":
        setEditingFee(item)
        setNewFee({
          name: item.name,
          description: item.description,
          amount: item.amount,
          type: item.type,
          applies_to: item.applies_to,
        })
        break
      case "event":
        setEditingEvent(item)
        setNewEvent({
          title: item.title,
          description: item.description,
          date: new Date(item.date).toISOString().slice(0, 16),
          image_url: item.image_url,
          status: item.status,
        })
        break
    }
  }

  const cancelEdit = () => {
    setEditingProduct(null)
    setEditingCategory(null)
    setEditingTable(null)

    setEditingFee(null)
    setEditingEvent(null)
    setNewProduct({
      name: "",
      description: "",
      price: 0,
      category: "",
      image_url: "",
      show_in_kitchen: true,
      active: true,
    })
    setNewCategory({
      name: "",
      description: "",
      image_url: "",
      color: "#cccccc",
      active: true,
    })
    setNewTable({ number: 0, zone: "main", capacity: 4 })

    setNewFee({
      name: "",
      description: "",
      amount: 0,
      type: "fixed",
      applies_to: "both",
      active: true,
    })
    setNewEvent({
      title: "",
      description: "",
      date: new Date().toISOString().slice(0, 16),
      image_url: "",
      status: "draft"
    })
    setProductImageFile(null)
    setCategoryImageFile(null)
    setEventImageFile(null)
  }

  const exportData = () => {
    const dataToExport = {
      products,
      categories,
      tables,

      reviews,
      fees,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cafe-data-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`h-4 w-4 ${star <= rating ? "text-yellow-500 fill-current" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredReviews = reviews.filter(
    (review) =>
      review.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "order-history", label: "Order History", icon: Calendar },
    { id: "reservations", label: "Reservations", icon: Calendar },
    { id: "events", label: "Events Management", icon: Calendar },
    { id: "products", label: "Menu Management", icon: Coffee },
    { id: "product-management-new", label: "Product Management", icon: Package },
    { id: "tables", label: "Table Management", icon: Users },
    { id: "promo-management", label: "Promo Management", icon: Tag },
    { id: "discount-management", label: "Discount Management", icon: Tag },
    { id: "user-management", label: "User Management", icon: Users },
    { id: "manage-checkins", label: "Manage Check-Ins", icon: Calendar },
    { id: "reviews", label: "Review Moderation", icon: MessageCircle },
    { id: "fees", label: "Fees Management", icon: DollarSign },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const handleLogout = async () => {
    await adminSignOut()
  }

  const showSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
      variant: "default",
    })
  }

  const showError = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    })
  }

  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [orderPayments, setOrderPayments] = useState<Record<string, any[]>>({});
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [orderHistorySearch, setOrderHistorySearch] = useState("");
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");

  // Inside the AdminDashboard component, before the return:
  const eventEditor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Blockquote,
      CodeBlock,
      HorizontalRule,
      Strike,
      ImageResize, // Add image resize extension
    ],
    content: newEvent.description || '',
    onUpdate: ({ editor }) => {
      setNewEvent((prev) => ({ ...prev, description: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-full mx-auto focus:outline-none',
      },
    },
  });

  // Add this function inside the AdminDashboard component:
  function exportOrderHistoryCSV(orders: Order[]) {
    if (!orders.length) return;
    const header = [
      "Order ID",
      "Table Number",
      "Dining Type",
      "Status",
      "Created At",
      "Total",
      "Discount Amount",
      "Order Notes",
      "Items"
    ];
    const rows = orders.map(order => [
      order.id,
      order.table_number,
      order.dining_type,
      order.status,
      order.created_at,
      order.total,
      order.discount_amount,
      order.order_notes || "",
      order.items?.map((item: any) => `${item.quantity}x ${item.name} (${item.size})${item.notes ? ' - ' + item.notes : ''}`).join("; ") || ""
    ]);
    const csvContent = [header, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `order-history-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  // At the top of AdminDashboard, after useState, add:
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [recentOrders, setRecentOrders] = useState<any[] | null>(null);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(false);
  const [lowStock, setLowStock] = useState<any[] | null>(null);
  const [lowStockLoading, setLowStockLoading] = useState(false);
  const [mostFrequentTable, setMostFrequentTable] = useState<any | null>(null);
  const [mostFrequentTableLoading, setMostFrequentTableLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "dashboard") {
      setRecentOrdersLoading(true);
      fetch("/api/orders/recent?limit=5")
        .then(res => res.json())
        .then(setRecentOrders)
        .catch(() => setRecentOrders([]))
        .finally(() => setRecentOrdersLoading(false));
      setLowStockLoading(true);
      fetch("/api/products/low-stock")
        .then(res => res.json())
        .then(setLowStock)
        .catch(() => setLowStock([]))
        .finally(() => setLowStockLoading(false));
      setMostFrequentTableLoading(true);
      fetch("/api/tables/most-frequent")
        .then(res => res.json())
        .then(setMostFrequentTable)
        .catch(() => setMostFrequentTable(null))
        .finally(() => setMostFrequentTableLoading(false));
    }
  }, [activeTab]);

  // Remove the sidebar item for categories
  // Add a local tab state for menu management
  const [menuTab, setMenuTab] = useState<'product-management-new' | 'categories' | 'stock' | 'reservations' | 'order-history' | 'upsell-rules'>('product-management-new');

  useEffect(() => {
    if (activeTab === 'products' && menuTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab, menuTab]);

  useEffect(() => {
    if (activeTab === 'products' && menuTab === 'reservations') {
      fetchReservations();
    }
  }, [activeTab, menuTab, selectedReservationDate]);

  useEffect(() => {
    if (activeTab === 'products' && menuTab === 'order-history') {
      setOrderHistoryLoading(true);
      supabase
        .from("orders")
        .select("*")
        .in("status", ["served", "paid", "cancelled", "reservation_confirmed", "reservation_completed"])
        .in("dining_type", ["dine_in", "takeaway", "reservation"])
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          setOrderHistory(data || []);
          setOrderHistoryLoading(false);
        });
    }
  }, [activeTab, menuTab]);



  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-brand-cream to-white flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-brand-caramel/30 shadow-lg">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-brand-cream">&</span>
              </div>
              <span className="text-xl font-bold text-brand-navy">Admin Panel</span>
            </div>

            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full justify-start transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-brand-navy text-white shadow-lg"
                      : "text-brand-medium-brown hover:bg-brand-cream hover:text-brand-navy"
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                  {item.id === "reviews" && dashboardStats.pendingReviews > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white">{dashboardStats.pendingReviews}</Badge>
                  )}
                </Button>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="mt-8 pt-6 border-t border-brand-caramel/20">
              <div className="mb-4 p-3 bg-brand-cream rounded-lg">
                <p className="text-sm text-brand-navy font-medium">{adminUser?.email}</p>
                <p className="text-xs text-brand-medium-brown">Administrator</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white border-b border-brand-caramel/30 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-brand-navy">
                  {sidebarItems.find((item) => item.id === activeTab)?.label}
                </h1>
                <p className="text-brand-medium-brown">Manage your café system</p>
              </div>
              <div className="flex items-center space-x-4">
                {success && (
                  <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full animate-in fade-in duration-300">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">{success}</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full animate-in fade-in duration-300">
                    <X className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                <Button onClick={exportData} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Badge className="bg-brand-caramel text-white">Administrator</Badge>
              </div>
            </div>
          </header>

          <div className="p-6">
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <Card className="bg-white border-brand-caramel/20 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-brand-medium-brown text-sm">Total Products</p>
                          <p className="text-2xl font-bold text-brand-navy">{dashboardStats.totalProducts}</p>
                        </div>
                        <Coffee className="h-8 w-8 text-brand-caramel" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-brand-caramel/20 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-brand-medium-brown text-sm">Total Tables</p>
                          <p className="text-2xl font-bold text-brand-navy">{dashboardStats.totalTables}</p>
                        </div>
                        <Users className="h-8 w-8 text-brand-caramel" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-brand-caramel/20 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-brand-medium-brown text-sm">Total Orders</p>
                          <p className="text-2xl font-bold text-brand-navy">{dashboardStats.totalOrders}</p>
                        </div>
                        <LayoutDashboard className="h-8 w-8 text-brand-caramel" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-brand-caramel/20 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-brand-medium-brown text-sm">Total Revenue</p>
                          <p className="text-2xl font-bold text-brand-navy">RM{dashboardStats.totalRevenue.toFixed(2)}</p>
                        </div>
                        <Tag className="h-8 w-8 text-brand-caramel" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-brand-caramel/20 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-brand-medium-brown text-sm">Pending Reviews</p>
                          <p className="text-2xl font-bold text-brand-navy">{dashboardStats.pendingReviews}</p>
                        </div>
                        <MessageCircle className="h-8 w-8 text-brand-caramel" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* New Dashboard Enhancements Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {/* Recent Orders Card */}
                  <Card className="bg-white border-brand-caramel/20 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-brand-navy">Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentOrdersLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="animate-spin" /></div>
                      ) : recentOrders && recentOrders.length > 0 ? (
                        <ul className="space-y-4">
                          {recentOrders.map(order => (
                            <li key={order.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs text-brand-medium-brown">{new Date(order.created_at).toLocaleString()}</div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {order.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex items-center space-x-2 bg-brand-cream rounded px-2 py-1">
                                        {item.image_url && (
                                          <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded object-cover" />
                                        )}
                                        <span className="text-sm font-medium">{item.name}</span>
                                        <span className="text-xs text-brand-medium-brown">x{item.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-brand-medium-brown py-4">No recent orders.</div>
                      )}
                    </CardContent>
                  </Card>
                  {/* Pending Stock Alerts Card */}
                  <Card className="bg-white border-brand-caramel/20 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-brand-navy">Pending Stock Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {lowStockLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="animate-spin" /></div>
                      ) : lowStock && lowStock.length > 0 ? (
                        <ul className="space-y-3">
                          {lowStock.map(item => (
                            <li key={item.id} className="flex items-center space-x-3">
                              {item.image_url && (
                                <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded object-cover" />
                              )}
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-red-600">{item.stock} left</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-brand-medium-brown py-4">All popular items are well stocked!</div>
                      )}
                    </CardContent>
                  </Card>
                  {/* Most Frequent Table Card */}
                  <Card className="bg-white border-brand-caramel/20 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-brand-navy">Most Frequent Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {mostFrequentTableLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="animate-spin" /></div>
                      ) : mostFrequentTable ? (
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="text-4xl font-bold text-brand-navy mb-2">{mostFrequentTable.table_number}</div>
                          <div className="text-sm text-brand-medium-brown">Orders: {mostFrequentTable.order_count}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-brand-medium-brown py-4">No table data available.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white border-brand-caramel/20 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-brand-navy">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={() => setActiveTab("products")}
                        className="w-full bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white justify-start"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Product
                      </Button>
                      <Button
                        onClick={() => setActiveTab("tables")}
                        variant="outline"
                        className="w-full border-brand-caramel text-brand-navy justify-start"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Table
                      </Button>
                      <Button
                        onClick={() => setActiveTab("reviews")}
                        variant="outline"
                        className="w-full border-brand-caramel text-brand-navy justify-start"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Moderate Reviews
                        {dashboardStats.pendingReviews > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white">{dashboardStats.pendingReviews}</Badge>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-brand-caramel/20 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-brand-navy">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-brand-medium-brown">System is running smoothly</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-brand-medium-brown">
                            {dashboardStats.totalProducts} products available
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm text-brand-medium-brown">
                            {dashboardStats.pendingReviews} reviews pending approval
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Products Management */}
            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="flex space-x-2 mb-6">
                  <button
                    className={`flex items-center px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200 border-2 focus:outline-none shadow-sm
                      ${menuTab === 'product-management-new'
                        ? 'bg-brand-navy text-white border-brand-navy scale-105 shadow-lg'
                        : 'bg-white text-brand-navy border-brand-caramel hover:bg-brand-cream hover:border-brand-navy'}
                    `}
                    onClick={() => setMenuTab('product-management-new')}
                  >
                    <Package className="h-5 w-5 mr-2" /> Product Management
                  </button>
                  <button
                    className={`flex items-center px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200 border-2 focus:outline-none shadow-sm
                      ${menuTab === 'categories'
                        ? 'bg-brand-navy text-white border-brand-navy scale-105 shadow-lg'
                        : 'bg-white text-brand-navy border-brand-caramel hover:bg-brand-cream hover:border-brand-navy'}
                    `}
                    onClick={() => setMenuTab('categories')}
                  >
                    <Tag className="h-5 w-5 mr-2" /> Categories
                  </button>
                  <button
                    className={`flex items-center px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200 border-2 focus:outline-none shadow-sm
                      ${menuTab === 'stock'
                        ? 'bg-brand-navy text-white border-brand-navy scale-105 shadow-lg'
                        : 'bg-white text-brand-navy border-brand-caramel hover:bg-brand-cream hover:border-brand-navy'}
                    `}
                    onClick={() => setMenuTab('stock')}
                  >
                    <Package className="h-5 w-5 mr-2" /> Stock Management
                  </button>
                  <button
                    className={`flex items-center px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200 border-2 focus:outline-none shadow-sm
                      ${menuTab === 'reservations'
                        ? 'bg-brand-navy text-white border-brand-navy scale-105 shadow-lg'
                        : 'bg-white text-brand-navy border-brand-caramel hover:bg-brand-cream hover:border-brand-navy'}
                    `}
                    onClick={() => setMenuTab('reservations')}
                  >
                    <Calendar className="h-5 w-5 mr-2" /> Reservations
                  </button>
                  <button
                    className={`flex items-center px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200 border-2 focus:outline-none shadow-sm
                      ${menuTab === 'order-history'
                        ? 'bg-brand-navy text-white border-brand-navy scale-105 shadow-lg'
                        : 'bg-white text-brand-navy border-brand-caramel hover:bg-brand-cream hover:border-brand-navy'}
                    `}
                    onClick={() => setMenuTab('order-history')}
                  >
                    <Calendar className="h-5 w-5 mr-2" /> Order History
                  </button>
                  <button
                    className={`flex items-center px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200 border-2 focus:outline-none shadow-sm
                      ${menuTab === 'upsell-rules'
                        ? 'bg-brand-navy text-white border-brand-navy scale-105 shadow-lg'
                        : 'bg-white text-brand-navy border-brand-caramel hover:bg-brand-cream hover:border-brand-navy'}
                    `}
                    onClick={() => setMenuTab('upsell-rules')}
                  >
                    <Lightbulb className="h-5 w-5 mr-2" /> Upsell Rules
                  </button>
                </div>
                {menuTab === 'product-management-new' && (
                  <ProductManagementNew />
                )}

                {menuTab === 'categories' && (
                  <div className="space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-medium-brown" />
                      <Input
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-brand-caramel/30 focus:border-brand-caramel"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Category Form */}
                      <Card className="bg-white border-brand-caramel/20 shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-brand-navy flex items-center">
                            <Tag className="h-5 w-5 mr-2" />
                            {editingCategory ? "Edit Category" : "Add New Category"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="categoryName" className="text-brand-navy font-medium">
                              Category Name *
                            </Label>
                            <Input
                              id="categoryName"
                              value={newCategory.name}
                              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                              className="border-brand-caramel/30 focus:border-brand-caramel"
                              placeholder="e.g., Coffee, Pastries, Cold Drinks"
                            />
                          </div>

                          <div>
                            <Label htmlFor="categoryDescription" className="text-brand-navy font-medium">
                              Description
                            </Label>
                            <Textarea
                              id="categoryDescription"
                              value={newCategory.description}
                              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                              className="border-brand-caramel/30 focus:border-brand-caramel"
                              placeholder="Describe this category..."
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label htmlFor="categoryColor" className="text-brand-navy font-medium">
                              Category Color
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="categoryColor"
                                type="color"
                                value={newCategory.color}
                                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                className="w-16 h-10 border-brand-caramel/30"
                              />
                              <Input
                                value={newCategory.color}
                                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                className="border-brand-caramel/30 focus:border-brand-caramel"
                                placeholder="#D5A373"
                              />
                            </div>
                          </div>

                          <div className="flex space-x-2 pt-4">
                            <Button
                              onClick={saveCategory}
                              disabled={saving}
                              className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  {editingCategory ? "Update" : "Add"} Category
                                </>
                              )}
                            </Button>
                            {editingCategory && (
                              <Button onClick={cancelEdit} variant="outline">
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Categories List */}
                      <Card className="bg-white border-brand-caramel/20 shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-brand-navy">Current Categories ({categories.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {categories.map((category) => (
                                <div
                                  key={category.id}
                                  className="border border-brand-caramel/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                                      <h3 className="font-semibold text-brand-navy">{category.name}</h3>
                                    </div>
                                    <div className="flex space-x-2">
                                      <Button size="sm" variant="outline" onClick={() => startEdit(category, "category")}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => deleteItem("categories", category.id, fetchCategories)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-brand-medium-brown">{category.description}</p>
                                  <div className="mt-2">
                                    <Badge className="bg-brand-caramel text-white">
                                      {products.filter((p) => p.category === category.name).length} products
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                {menuTab === 'stock' && (
                  <StockManagementPage />
                )}
                {menuTab === 'reservations' && (
                  <div className="flex flex-col items-center justify-center min-h-[40vh]">
                    <h2 className="text-2xl font-bold text-brand-navy mb-4">Reservations</h2>
                    <p className="text-lg text-brand-medium-brown">Coming Soon!</p>
                  </div>
                )}
                {menuTab === 'order-history' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                      <div className="flex items-center space-x-2 mb-2 md:mb-0">
                        <label className="text-brand-navy font-medium">From</label>
                        <Input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="w-36 border-brand-caramel/30" />
                        <label className="text-brand-navy font-medium">To</label>
                        <Input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="w-36 border-brand-caramel/30" />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <div className="relative w-full">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-medium-brown" />
                          <Input
                            placeholder="Search by table number or item name..."
                            value={orderHistorySearch}
                            onChange={(e) => setOrderHistorySearch(e.target.value)}
                            className="pl-10 border-brand-caramel/30 focus:border-brand-caramel"
                          />
                        </div>
                        <Button
                          className="ml-4 bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
                          onClick={() => {
                            const filtered = orderHistory.filter(order => {
                              const orderDate = new Date(order.created_at).toISOString().slice(0, 10);
                              const afterStart = !exportStartDate || orderDate >= exportStartDate;
                              const beforeEnd = !exportEndDate || orderDate <= exportEndDate;
                              const matchesSearch = order.table_number?.toString().includes(orderHistorySearch) ||
                                order.items?.some((item) => item.name?.toLowerCase().includes(orderHistorySearch.toLowerCase()));
                              return afterStart && beforeEnd && matchesSearch;
                            });
                            exportOrderHistoryCSV(filtered);
                          }}
                        >
                          Export CSV
                        </Button>
                      </div>
                    </div>
                    <Card className="bg-white border-brand-caramel/20 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-brand-navy flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          Order History ({orderHistory.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {orderHistoryLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {orderHistory
                              .filter((order) =>
                                order.table_number?.toString().includes(orderHistorySearch) ||
                                order.items?.some((item) => item.name?.toLowerCase().includes(orderHistorySearch.toLowerCase()))
                              )
                              .map((order) => (
                                <div
                                  key={order.id}
                                  className="border border-brand-caramel/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Badge className="bg-brand-navy text-white">Table {order.table_number}</Badge>
                                      <Badge className={`bg-brand-caramel text-white`}>{order.status}</Badge>
                                      <Badge className="bg-gray-500 text-white">{order.dining_type}</Badge>
                                    </div>
                                    <div className="ml-2 text-xs text-brand-navy font-mono">Order #: {order.id.slice(0, 8)}</div>
                                    <span className="text-sm text-brand-navy">
                                      {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="mb-3">
                                    {order.items?.map((item, index) => (
                                      <div key={index} className="flex justify-between text-sm">
                                        <span className="text-brand-navy">
                                          {item.quantity}x {item.name} ({item.size})
                                          {item.notes && <span className="text-brand-caramel italic"> - {item.notes}</span>}
                                        </span>
                                        <span className="text-brand-navy">RM{(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    ))}
                                    {order.order_notes && (
                                      <div className="mt-2 p-2 bg-brand-cream rounded text-sm">
                                        <strong>Order Notes:</strong> {order.order_notes}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-brand-navy">Total: RM{order.total.toFixed(2)}</span>
                                      {order.discount_amount > 0 && (
                                        <span className="text-sm text-green-600 ml-2">
                                          (Discount: RM{order.discount_amount.toFixed(2)})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {/* Payment Details */}
                                  {(order.payment_method || order.payment_notes || order.payment_proof_url) && (
                                    <div className="mt-2 p-2 bg-brand-cream rounded text-xs text-brand-navy">
                                      <div className="font-bold mb-1">Payment Details:</div>
                                      {order.payment_method && <div><strong>Method:</strong> {order.payment_method}</div>}
                                      {order.payment_notes && <div><strong>Notes:</strong> {order.payment_notes}</div>}
                                      {order.payment_proof_url && <div><strong>Proof:</strong> <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-brand-caramel underline">View Image</a></div>}
                                    </div>
                                  )}
                                  {/* Split Payments */}
                                  {Array.isArray(orderPayments[order.id]) && orderPayments[order.id].length > 0 && (
                                    <div className="mt-2 p-2 bg-brand-cream rounded text-xs text-brand-navy">
                                      <div className="font-bold mb-1">Payments:</div>
                                      {orderPayments[order.id].map((p: any, idx: number) => (
                                        <div key={p.id || idx} className="mb-1 border-b border-brand-caramel/20 pb-1 last:border-b-0 last:pb-0">
                                          <div><strong>Amount:</strong> RM{Number(p.amount).toFixed(2)}</div>
                                          <div><strong>Method:</strong> {p.method}</div>
                                          {p.notes && <div><strong>Notes:</strong> {p.notes}</div>}
                                          {p.proof_url && <div><strong>Proof:</strong> <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-brand-caramel underline">View Image</a></div>}
                                          <div><strong>Date:</strong> {p.created_at ? new Date(p.created_at).toLocaleString() : ''}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            {orderHistory.length === 0 && (
                              <div className="text-center py-8">
                                <p className="text-brand-medium-brown">No order history found</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
                {menuTab === 'upsell-rules' && (
                  <UpsellRuleManagement />
                )}
              </div>
            )}

            {/* Stock Management */}
            {activeTab === "stock-management" && (
              <div className="space-y-6">
                <iframe 
                  src="/admin/stock-management" 
                  className="w-full min-h-[80vh] border rounded-lg" 
                  style={{ border: '1px solid #e5e7eb' }}
                />
              </div>
            )}

            {/* Tables Management */}
            {activeTab === "tables" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Table Form */}
                <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      {editingTable ? "Edit Table" : "Add New Table"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="tableNumber" className="text-brand-navy font-medium">
                        Table Number *
                      </Label>
                      <Input
                        id="tableNumber"
                        type="number"
                        min="1"
                        value={newTable.number}
                        onChange={(e) => setNewTable({ ...newTable, number: Number.parseInt(e.target.value) || 0 })}
                        className="border-brand-caramel/30 focus:border-brand-caramel"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="zone" className="text-brand-navy font-medium">
                        Zone *
                      </Label>
                      <Select value={newTable.zone} onValueChange={(value) => setNewTable({ ...newTable, zone: value })}>
                        <SelectTrigger className="border-brand-caramel/30 focus:border-brand-caramel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Indoor">Indoor</SelectItem>
                          <SelectItem value="Outdoor">Outdoor</SelectItem>
                          <SelectItem value="VIP">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="capacity" className="text-brand-navy font-medium">
                        Capacity *
                      </Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        value={newTable.capacity}
                        onChange={(e) => setNewTable({ ...newTable, capacity: Number.parseInt(e.target.value) || 0 })}
                        className="border-brand-caramel/30 focus:border-brand-caramel"
                        placeholder="4"
                      />
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={saveTable}
                        disabled={saving}
                        className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingTable ? "Update" : "Add"} Table
                          </>
                        )}
                      </Button>
                      {editingTable && (
                        <Button onClick={cancelEdit} variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tables List */}
                <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy">Current Tables ({tables.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tables.map((table) => (
                          <div
                            key={table.id}
                            className="border border-brand-caramel/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-brand-navy">Table {table.number}</h3>
                              <Badge
                                className={`${
                                  table.status === "active"
                                    ? "bg-green-500"
                                    : table.status === "maintenance"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                                } text-white`}
                              >
                                {table.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-brand-medium-brown">Zone: {table.zone}</p>
                            <p className="text-sm text-brand-medium-brown mb-3">Capacity: {table.capacity} people</p>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => startEdit(table, "table")}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateQRCode(table.number)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteItem("tables", table.id, fetchTables)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* User Management */}
            {activeTab === "user-management" && (
              <UserManagement />
            )}



            {/* Review Moderation */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-medium-brown" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-brand-caramel/30 focus:border-brand-caramel"
                  />
                </div>

                <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy flex items-center">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Customer Reviews ({filteredReviews.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredReviews.map((review) => (
                          <div
                            key={review.id}
                            className="border border-brand-caramel/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-semibold text-brand-navy">{review.customer_name}</h4>
                                  {renderStars(review.rating)}
                                  <Badge className="bg-brand-caramel text-white">Table {review.table_number}</Badge>
                                  <Badge
                                    className={`${
                                      review.status === "pending"
                                        ? "bg-yellow-500"
                                        : review.status === "approved"
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                    } text-white`}
                                  >
                                    {review.status}
                                  </Badge>
                                </div>
                                <p className="text-brand-medium-brown mb-2">{review.comment}</p>
                                <p className="text-xs text-brand-medium-brown">
                                  {new Date(review.created_at).toLocaleDateString()} at{" "}
                                  {new Date(review.created_at).toLocaleTimeString()}
                                </p>
                              </div>

                              {review.status === "pending" && (
                                <div className="flex space-x-2 ml-4">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      console.log("Approve button clicked for review:", review.id)
                                      updateReviewStatus(review.id, "approved")
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      console.log("Reject button clicked for review:", review.id)
                                      updateReviewStatus(review.id, "rejected")
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteItem("reviews", review.id, fetchReviews)}
                                className="text-red-600 hover:text-red-700 ml-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {filteredReviews.length === 0 && (
                          <div className="text-center py-8">
                            <MessageCircle className="h-12 w-12 text-brand-medium-brown mx-auto mb-4" />
                            <p className="text-brand-medium-brown">No reviews found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Fees Management */}
            {activeTab === "fees" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fee Form */}
                <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      {editingFee ? "Edit Fee" : "Add New Fee"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="feeName" className="text-brand-navy font-medium">
                        Fee Name *
                      </Label>
                      <Input
                        id="feeName"
                        value={newFee.name}
                        onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
                        className="border-brand-caramel/30 focus:border-brand-caramel"
                        placeholder="e.g., Service Charge"
                      />
                    </div>

                    <div>
                      <Label htmlFor="feeDescription" className="text-brand-navy font-medium">
                        Description
                      </Label>
                      <Textarea
                        id="feeDescription"
                        value={newFee.description}
                        onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                        className="border-brand-caramel/30 focus:border-brand-caramel"
                        placeholder="Describe this fee..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="feeAmount" className="text-brand-navy font-medium">
                        Amount *
                      </Label>
                      <Input
                        id="feeAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newFee.amount ?? 0}
                        onChange={(e) => setNewFee({ ...newFee, amount: Number.parseFloat(e.target.value) || 0 })}
                        className="border-brand-caramel/30 focus:border-brand-caramel"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="feeType" className="text-brand-navy font-medium">
                        Fee Type *
                      </Label>
                      <Select
                        value={newFee.type}
                        onValueChange={(value: "fixed" | "percentage") => setNewFee({ ...newFee, type: value })}
                      >
                        <SelectTrigger className="border-brand-caramel/30 focus:border-brand-caramel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Amount (RM)</SelectItem>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="appliesTo" className="text-brand-navy font-medium">
                        Applies To *
                      </Label>
                      <Select
                        value={newFee.applies_to}
                        onValueChange={(value: "dine_in" | "takeaway" | "reservation" | "both") =>
                          setNewFee({ ...newFee, applies_to: value })
                        }
                      >
                        <SelectTrigger className="border-brand-caramel/30 focus:border-brand-caramel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dine_in">Dine In Only</SelectItem>
                          <SelectItem value="takeaway">Takeaway Only</SelectItem>
                          <SelectItem value="reservation">Reservation Only</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={saveFee}
                        disabled={saving}
                        className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingFee ? "Update" : "Add"} Fee
                          </>
                        )}
                      </Button>
                      {editingFee && (
                        <Button onClick={cancelEdit} variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Fees List */}
                <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy">Current Fees ({fees.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fees.map((fee) => (
                          <div
                            key={fee.id}
                            className="border border-brand-caramel/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-brand-navy">{fee.name}</h3>
                                <Badge className={`${fee.active ? "bg-green-500" : "bg-gray-500"} text-white`}>
                                  {fee.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => startEdit(fee, "fee")}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteItem("fees", fee.id, fetchFees)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-brand-medium-brown mb-2">{fee.description}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-brand-medium-brown">
                                Amount: {fee.type === "percentage" ? `${fee.amount}%` : `RM${fee.amount.toFixed(2)}`}
                              </span>
                              <Badge className="bg-brand-caramel text-white">
                                {fee.applies_to === "both" ? "All Orders" : fee.applies_to.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Events Management */}
            {activeTab === "events" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Event Form */}
                <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      {editingEvent ? "Edit Event" : "Add New Event"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="eventTitle" className="text-brand-navy font-medium">
                        Event Title *
                      </Label>
                      <Input
                        id="eventTitle"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className="border-brand-caramel/30 focus:border-brand-caramel"
                        placeholder="e.g., Latte Art Workshop"
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventDescription" className="text-brand-navy font-medium">
                        Description
                      </Label>
                      <RichTextEditor editor={eventEditor} uploadImage={uploadImage} />
                    </div>

                    <div>
                      <Label htmlFor="eventDate" className="text-brand-navy font-medium">
                        Date & Time *
                      </Label>
                      <Input
                        id="eventDate"
                        type="datetime-local"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="border-brand-caramel/30 focus:border-brand-caramel"
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventStatus" className="text-brand-navy font-medium">
                        Status
                      </Label>
                      <Select
                        value={newEvent.status}
                        onValueChange={(value: "draft" | "published" | "cancelled") => 
                          setNewEvent({ ...newEvent, status: value })
                        }
                      >
                        <SelectTrigger className="border-brand-caramel/30 focus:border-brand-caramel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-brand-navy font-medium">Event Image</Label>
                      <div className="text-xs text-brand-medium-brown/70 mb-2 mt-1 p-2 bg-brand-cream/50 rounded border border-brand-caramel/20">
                        📏 <strong>Recommended sizes:</strong> Events list: 16:9 aspect ratio (e.g., 800x450px) | Event detail: 16:9 aspect ratio (e.g., 1200x675px)
                        <br />
                        💡 <strong>Tips:</strong> Use high-quality images with good lighting. Images will be automatically resized and cropped to fit.
                      </div>
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          dragOverEvent
                            ? "border-brand-caramel bg-brand-cream"
                            : "border-brand-caramel/30 hover:border-brand-caramel/50"
                        }`}
                        onDragOver={(e) => handleDragOver(e, "event")}
                        onDragLeave={(e) => handleDragLeave(e, "event")}
                        onDrop={(e) => handleDrop(e, "event")}
                      >
                        {newEvent.image_url ? (
                          <div className="space-y-2">
                            <img
                              src={newEvent.image_url}
                              alt="Event preview"
                              className="w-full h-32 object-cover rounded-lg mx-auto"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewEvent({ ...newEvent, image_url: "" })
                                setEventImageFile(null)
                              }}
                            >
                              Remove Image
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 mx-auto text-brand-medium-brown" />
                            <p className="text-sm text-brand-medium-brown">
                              Drag and drop an image here, or{" "}
                              <label className="text-brand-caramel cursor-pointer hover:underline">
                                browse
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFileSelect(file, "event")
                                  }}
                                />
                              </label>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={saveEvent}
                        disabled={saving}
                        className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingEvent ? "Update" : "Add"} Event
                          </>
                        )}
                      </Button>
                      {editingEvent && (
                        <Button onClick={cancelEdit} variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Events List */}
                <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy">Current Events ({events.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {events.map((event) => (
                          <div
                            key={event.id}
                            className="border border-brand-caramel/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-brand-navy">{event.title}</h3>
                                <Badge 
                                  className={`${
                                    event.status === "published" 
                                      ? "bg-green-500" 
                                      : event.status === "draft" 
                                      ? "bg-yellow-500" 
                                      : "bg-red-500"
                                  } text-white`}
                                >
                                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => startEdit(event, "event")}> <Edit className="h-4 w-4" /> </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteItem("events", event.id, fetchEvents)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {event.image_url && (
                              <img
                                src={event.image_url}
                                alt={event.title}
                                className="w-full h-24 object-cover rounded-lg mb-2"
                              />
                            )}
                            <div className="text-sm text-brand-medium-brown mb-2 prose max-w-full line-clamp-3" style={{overflow: 'hidden'}}
                              dangerouslySetInnerHTML={{ __html: event.description ? event.description : 'No description' }}
                            />
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-brand-medium-brown">
                                {new Date(event.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/events/${event.id}`, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      System Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {settingsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
                      </div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-brand-navy mb-4">Café Information</h3>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-brand-navy font-medium">Café Name</Label>
                            <Input
                              value={settings.cafe_name}
                              onChange={e => setSettings(s => ({ ...s, cafe_name: e.target.value }))}
                              className="border-brand-caramel/30"
                            />
                          </div>
                          <div>
                            <Label className="text-brand-navy font-medium">Location</Label>
                            <Input
                              value={settings.location}
                              onChange={e => setSettings(s => ({ ...s, location: e.target.value }))}
                              className="border-brand-caramel/30"
                            />
                          </div>
                          <div>
                            <Label className="text-brand-navy font-medium">Phone Number</Label>
                            <Input
                              value={settings.phone_number}
                              onChange={e => setSettings(s => ({ ...s, phone_number: e.target.value }))}
                              className="border-brand-caramel/30"
                            />
                          </div>
                          <div>
                            <Label className="text-brand-navy font-medium">Operating Hours</Label>
                            <div className="flex space-x-2">
                              <Input
                                type="time"
                                value={settings.operating_hours.open}
                                onChange={e => setSettings(s => ({ ...s, operating_hours: { ...s.operating_hours, open: e.target.value } }))}
                                className="border-brand-caramel/30 w-32"
                              />
                              <span className="self-center">to</span>
                              <Input
                                type="time"
                                value={settings.operating_hours.close}
                                onChange={e => setSettings(s => ({ ...s, operating_hours: { ...s.operating_hours, close: e.target.value } }))}
                                className="border-brand-caramel/30 w-32"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-brand-navy mb-4">System Configuration</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 border border-brand-caramel/20 rounded">
                            <div>
                              <span className="text-brand-navy font-medium">Auto-print receipts</span>
                              <p className="text-sm text-brand-medium-brown">Automatically print receipts when orders are paid</p>
                            </div>
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={settings.system_config.auto_print}
                              onChange={e => setSettings(s => ({ ...s, system_config: { ...s.system_config, auto_print: e.target.checked } }))}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 border border-brand-caramel/20 rounded">
                            <div>
                              <span className="text-brand-navy font-medium">Enable notifications</span>
                              <p className="text-sm text-brand-medium-brown">Show real-time notifications for new orders</p>
                            </div>
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={settings.system_config.notifications}
                              onChange={e => setSettings(s => ({ ...s, system_config: { ...s.system_config, notifications: e.target.checked } }))}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 border border-brand-caramel/20 rounded">
                            <div>
                              <span className="text-brand-navy font-medium">Kitchen auto-refresh</span>
                              <p className="text-sm text-brand-medium-brown">Automatically refresh kitchen display every 30 seconds</p>
                            </div>
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={settings.system_config.kitchen_auto_refresh}
                              onChange={e => setSettings(s => ({ ...s, system_config: { ...s.system_config, kitchen_auto_refresh: e.target.checked } }))}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 border border-brand-caramel/20 rounded">
                            <div>
                              <span className="text-brand-navy font-medium">Order timeout alerts</span>
                              <p className="text-sm text-brand-medium-brown">Alert when orders take longer than 15 minutes</p>
                            </div>
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={settings.system_config.order_timeout_alerts}
                              onChange={e => setSettings(s => ({ ...s, system_config: { ...s.system_config, order_timeout_alerts: e.target.checked } }))}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-brand-caramel/20 rounded">
                        <div>
                          <span className="text-brand-navy font-medium">24/7 Operation</span>
                          <p className="text-sm text-brand-medium-brown">Website always accepts orders, no closing hours</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={settings.operating_hours.open === '00:00' && settings.operating_hours.close === '23:59'}
                          onChange={e => {
                            if (e.target.checked) {
                              setSettings(s => ({ ...s, operating_hours: { open: '00:00', close: '23:59' } }))
                            } else {
                              setSettings(s => ({ ...s, operating_hours: { open: '06:00', close: '22:00' } }))
                            }
                          }}
                        />
                      </div>
                    </div>
                    )}
                    <div className="pt-4 border-t border-brand-caramel/20">
                      <Button
                        onClick={saveSettings}
                        className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
                        disabled={saving || settingsLoading}
                      >
                        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Settings</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                 <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy flex items-center">
                      <Download className="h-5 w-5 mr-2" />
                      Data Export
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-brand-medium-brown mb-4">
                      Export your data as CSV files for reporting and backups.
                    </p>
                    <div className="flex space-x-2">
                      <Button onClick={exportData} className="bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white">
                         Export All Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "reservations" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                  <div className="flex items-center space-x-2 mb-2 md:mb-0">
                    <label className="text-brand-navy font-medium">Date</label>
                    <Input 
                      type="date" 
                      value={selectedReservationDate} 
                      onChange={e => setSelectedReservationDate(e.target.value)} 
                      className="w-36 border-brand-caramel/30" 
                    />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-medium-brown" />
                      <Input
                        placeholder="Search by customer name or phone..."
                        value={reservationsSearch}
                        onChange={(e) => setReservationsSearch(e.target.value)}
                        className="pl-10 border-brand-caramel/30 focus:border-brand-caramel"
                      />
                    </div>
                    <Button
                      className="ml-4 bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
                      onClick={() => fetchReservations()}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
                <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Reservations for {selectedReservationDate} ({reservations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reservationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reservations
                          .filter((reservation) =>
                            reservation.customer_name?.toLowerCase().includes(reservationsSearch.toLowerCase()) ||
                            reservation.customer_phone?.includes(reservationsSearch)
                          )
                          .map((reservation: any) => (
                            <div
                              key={reservation.reservation_id}
                              className="border border-brand-caramel/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Badge className="bg-brand-navy text-white">
                                    {reservation.reservation_time}
                                  </Badge>
                                  <Badge className="bg-brand-caramel text-white">
                                    {reservation.number_of_people} {reservation.number_of_people === 1 ? 'person' : 'people'}
                                  </Badge>
                                  <Badge className={`${
                                    reservation.status === 'confirmed' ? 'bg-green-500' :
                                    reservation.status === 'ready' ? 'bg-blue-500' :
                                    reservation.status === 'completed' ? 'bg-gray-500' :
                                    'bg-red-500'
                                  } text-white`}>
                                    {reservation.status}
                                  </Badge>
                                </div>
                                <div className="ml-2 text-xs text-brand-navy font-mono">
                                  Order #: {reservation.order_id?.slice(0, 8)}
                                </div>
                              </div>
                              
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-brand-navy">{reservation.customer_name}</h4>
                                  <span className="text-sm text-brand-medium-brown">
                                    Table {reservation.table_preference && reservation.table_preference !== 'any' ? reservation.table_preference : 'Any'}
                                  </span>
                                </div>
                                
                                {reservation.customer_phone && (
                                  <p className="text-sm text-brand-medium-brown">
                                    📞 {reservation.customer_phone}
                                  </p>
                                )}
                                
                                <div className="mt-2">
                                  <span className="text-sm font-medium text-brand-navy">Order Items:</span>
                                  <div className="mt-1 space-y-1">
                                    {(reservation.preorder_items || reservation.order_items || []).map((item: any, index: number) => (
                                      <div key={index} className="flex justify-between text-sm">
                                        <span className="text-brand-navy">
                                          {item.quantity}x {item.name} ({item.size})
                                          {item.notes && <span className="text-brand-caramel italic"> - {item.notes}</span>}
                                        </span>
                                        <span className="text-brand-navy">RM{(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {(reservation.payment_proof_url || reservation.order_payment_proof_url) && (
                                <div className="mt-2">
                                  <strong>Payment Proof:</strong>
                                  <div className="mt-1">
                                    <img
                                      src={reservation.payment_proof_url || reservation.order_payment_proof_url}
                                      alt="Payment Proof"
                                      className="w-32 h-32 object-contain border rounded"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        {reservations.length === 0 && (
                          <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-brand-medium-brown mx-auto mb-4" />
                            <p className="text-brand-medium-brown">No reservations found for this date</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "manage-checkins" && (
              <ManageCheckinsTab />
            )}

            {activeTab === "order-history" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                  <div className="flex items-center space-x-2 mb-2 md:mb-0">
                    <label className="text-brand-navy font-medium">From</label>
                    <Input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="w-36 border-brand-caramel/30" />
                    <label className="text-brand-navy font-medium">To</label>
                    <Input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="w-36 border-brand-caramel/30" />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-medium-brown" />
                      <Input
                        placeholder="Search by table number or item name..."
                        value={orderHistorySearch}
                        onChange={(e) => setOrderHistorySearch(e.target.value)}
                        className="pl-10 border-brand-caramel/30 focus:border-brand-caramel"
                      />
                    </div>
                    <Button
                      className="ml-4 bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
                      onClick={() => {
                        const filtered = orderHistory.filter(order => {
                          const orderDate = new Date(order.created_at).toISOString().slice(0, 10);
                          const afterStart = !exportStartDate || orderDate >= exportStartDate;
                          const beforeEnd = !exportEndDate || orderDate <= exportEndDate;
                          const matchesSearch = order.table_number?.toString().includes(orderHistorySearch) ||
                            order.items?.some((item) => item.name?.toLowerCase().includes(orderHistorySearch.toLowerCase()));
                          return afterStart && beforeEnd && matchesSearch;
                        });
                        exportOrderHistoryCSV(filtered);
                      }}
                    >
                      Export CSV
                    </Button>
                  </div>
                </div>
                <Card className="bg-white border-brand-caramel/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-brand-navy flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Order History ({orderHistory.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orderHistoryLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-medium-brown" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orderHistory
                          .filter((order) =>
                            order.table_number?.toString().includes(orderHistorySearch) ||
                            order.items?.some((item) => item.name?.toLowerCase().includes(orderHistorySearch.toLowerCase()))
                          )
                          .map((order) => (
                            <div
                              key={order.id}
                              className="border border-brand-caramel/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Badge className="bg-brand-navy text-white">Table {order.table_number}</Badge>
                                  <Badge className={`bg-brand-caramel text-white`}>{order.status}</Badge>
                                  <Badge className="bg-gray-500 text-white">{order.dining_type}</Badge>
                                </div>
                                <div className="ml-2 text-xs text-brand-navy font-mono">Order #: {order.id.slice(0, 8)}</div>
                                <span className="text-sm text-brand-navy">
                                  {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="mb-3">
                                {order.items?.map((item, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-brand-navy">
                                      {item.quantity}x {item.name} ({item.size})
                                      {item.notes && <span className="text-brand-caramel italic"> - {item.notes}</span>}
                                    </span>
                                    <span className="text-brand-navy">RM{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                                {order.order_notes && (
                                  <div className="mt-2 p-2 bg-brand-cream rounded text-sm">
                                    <strong>Order Notes:</strong> {order.order_notes}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-brand-navy">Total: RM{order.total.toFixed(2)}</span>
                                  {order.discount_amount > 0 && (
                                    <span className="text-sm text-green-600 ml-2">
                                      (Discount: RM{order.discount_amount.toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Payment Details */}
                              {(order.payment_method || order.payment_notes || order.payment_proof_url) && (
                                <div className="mt-2 p-2 bg-brand-cream rounded text-xs text-brand-navy">
                                  <div className="font-bold mb-1">Payment Details:</div>
                                  {order.payment_method && <div><strong>Method:</strong> {order.payment_method}</div>}
                                  {order.payment_notes && <div><strong>Notes:</strong> {order.payment_notes}</div>}
                                  {order.payment_proof_url && <div><strong>Proof:</strong> <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-brand-caramel underline">View Image</a></div>}
                                </div>
                              )}
                              {/* Split Payments */}
                              {Array.isArray(orderPayments[order.id]) && orderPayments[order.id].length > 0 && (
                                <div className="mt-2 p-2 bg-brand-cream rounded text-xs text-brand-navy">
                                  <div className="font-bold mb-1">Payments:</div>
                                  {orderPayments[order.id].map((p: any, idx: number) => (
                                    <div key={p.id || idx} className="mb-1 border-b border-brand-caramel/20 pb-1 last:border-b-0 last:pb-0">
                                      <div><strong>Amount:</strong> RM{Number(p.amount).toFixed(2)}</div>
                                      <div><strong>Method:</strong> {p.method}</div>
                                      {p.notes && <div><strong>Notes:</strong> {p.notes}</div>}
                                      {p.proof_url && <div><strong>Proof:</strong> <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-brand-caramel underline">View Image</a></div>}
                                      <div><strong>Date:</strong> {p.created_at ? new Date(p.created_at).toLocaleString() : ''}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        {orderHistory.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-brand-medium-brown">No order history found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            {/* Promo Management */}
            {activeTab === "promo-management" && (
              <PromoManagement />
            )}

            {/* Discount Management */}
            {activeTab === "discount-management" && (
              <DiscountManagement />
            )}
          </div>
        </div>
        
        {/* QR Code Modal */}
        <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-brand-navy">QR Code - Table {selectedTableNumber || ''}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-4">
              {qrCodeUrl && (
                <div className="text-center">
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR Code for Table ${selectedTableNumber}`}
                    className="border-2 border-brand-caramel/30 rounded-lg shadow-lg"
                  />
                  <p className="text-sm text-brand-medium-brown mt-3">Scan to view menu</p>
                  <p className="text-xs text-gray-400 mt-1">{menuUrl}</p>
                </div>
              )}
            </div>
            <DialogFooter className="sm:justify-center">
               <Button type="button" variant="outline" onClick={() => setQrModalOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={printQRCode}>
                <Printer className="mr-2 h-4 w-4" />
                Print QR Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

function ManageCheckinsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    user_id: "",
    date: "",
    check_in_time: "",
    check_out_time: "",
    notes: ""
  });
  const [addError, setAddError] = useState("");
  const [editLog, setEditLog] = useState<any>(null);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    fetchLogs();
    fetchStaff();
  }, [date, search]);

  const fetchStaff = async () => {
    const res = await fetch('/api/staff');
    const data = await res.json();
    setStaffList(Array.isArray(data) ? data : []);
  };

  const fetchLogs = async () => {
    setLoading(true);
    let url = "/api/checkins?";
    if (date) url += `date=${date}&`;
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data)) {
      setLogs(
        data.filter((log: any) =>
          search ? (log.users?.full_name || log.users?.email || "").toLowerCase().includes(search.toLowerCase()) : true
        )
      );
    } else {
      setLogs([]);
      if (data.error) {
        alert('Error fetching logs: ' + data.error);
      }
    }
    setLoading(false);
  };

  const handleExportCSV = async () => {
    let url = "/api/checkins/export?";
    if (date) url += `from=${date}&to=${date}`;
    if (search) url += `${date ? '&' : ''}name=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    const blob = await res.blob();
    const urlObj = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlObj;
    a.download = "checkins.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(urlObj);
  };

  const handleAddCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addForm.user_id || !addForm.date || !addForm.check_in_time) {
      setAddError("Staff, date, and check-in time are required.");
      return;
    }
    const body = {
      user_id: addForm.user_id,
      date: addForm.date,
      check_in_time: addForm.check_in_time ? new Date(`${addForm.date}T${addForm.check_in_time}`).toISOString() : null,
      check_out_time: addForm.check_out_time ? new Date(`${addForm.date}T${addForm.check_out_time}`).toISOString() : null,
      notes: addForm.notes
    };
    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await res.json();
    if (result.error) {
      setAddError(result.error);
    } else {
      setShowAdd(false);
      setAddForm({ user_id: "", date: "", check_in_time: "", check_out_time: "", notes: "" });
      fetchLogs();
    }
  };

  return (
    <div className="flex justify-center items-start w-full mt-8">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-navy">Manage Check-Ins</h2>
          <button className="bg-brand-navy hover:bg-brand-caramel text-white px-4 py-2 rounded font-semibold transition-colors duration-200 shadow-sm" onClick={handleExportCSV}>Export CSV</button>
        </div>
        <button className="mb-4 bg-brand-caramel text-white px-4 py-2 rounded font-semibold" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : 'Add Check-In'}
        </button>
        {showAdd && (
          <form className="mb-6 bg-brand-cream rounded-lg p-4" onSubmit={handleAddCheckin}>
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <select
                className="border rounded p-2 w-full md:w-48"
                value={addForm.user_id}
                onChange={e => setAddForm(f => ({ ...f, user_id: e.target.value }))}
                required
              >
                <option value="">Select Staff</option>
                {staffList.map(staff => (
                  <option key={staff.user_id} value={staff.user_id}>{staff.full_name || staff.email}</option>
                ))}
              </select>
              <input type="date" className="border rounded p-2 w-full md:w-40" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} required />
              <input type="time" className="border rounded p-2 w-full md:w-32" value={addForm.check_in_time} onChange={e => setAddForm(f => ({ ...f, check_in_time: e.target.value }))} required />
              <input type="time" className="border rounded p-2 w-full md:w-32" value={addForm.check_out_time} onChange={e => setAddForm(f => ({ ...f, check_out_time: e.target.value }))} />
              <input type="text" className="border rounded p-2 w-full md:w-48" placeholder="Notes" value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            {addError && <div className="text-red-600 mb-2">{addError}</div>}
            <button type="submit" className="bg-brand-navy text-white px-4 py-2 rounded font-semibold">Save</button>
          </form>
        )}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-2">
            <input type="date" className="border rounded p-2 mr-2 bg-white text-brand-navy" value={date} onChange={e => setDate(e.target.value)} />
            <input type="text" placeholder="Search by name" className="border rounded p-2 bg-white text-brand-navy" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="bg-brand-cream rounded-lg p-6">
          <table className="w-full border mt-0">
            <thead>
              <tr className="bg-brand-cream text-brand-navy">
                <th className="p-2 border font-semibold">Name</th>
                <th className="p-2 border font-semibold">Date</th>
                <th className="p-2 border font-semibold">Check-In</th>
                <th className="p-2 border font-semibold">Check-Out</th>
                <th className="p-2 border font-semibold">Breaks</th>
                <th className="p-2 border font-semibold">Total Hours</th>
                <th className="p-2 border font-semibold">Notes</th>
                <th className="p-2 border font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-4 text-brand-medium-brown">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-4 text-brand-medium-brown">No data</td></tr>
              ) : logs.map((log: any, i: number) => {
                const breaks = Array.isArray(log.breaks) ? log.breaks : [];
                const breakCount = breaks.length;
                const breakMinutes = breaks.reduce((sum: number, b: any) => {
                  if (b.start && b.end) {
                    return sum + (new Date(b.end).getTime() - new Date(b.start).getTime()) / 60000;
                  }
                  return sum;
                }, 0);
                return (
                  <tr key={i} className="text-center text-brand-navy bg-white hover:bg-brand-cream transition-colors">
                    <td className="border p-2">{log.users?.full_name || log.users?.email || '-'}</td>
                    <td className="border p-2">{log.date}</td>
                    <td className="border p-2">{log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="border p-2">{log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="border p-2">{breakCount}{breakMinutes > 0 ? ` (${Math.round(breakMinutes)} min)` : ''}</td>
                    <td className="border p-2">{log.check_in_time && log.check_out_time ? ((new Date(log.check_out_time).getTime() - new Date(log.check_in_time).getTime()) / 3600000).toFixed(2) : '-'}</td>
                    <td className="border p-2">{log.notes || '-'}</td>
                    <td className="border p-2"><button onClick={() => setEditLog(log)} className="text-blue-600 underline">Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {editLog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form
            className="bg-white p-6 rounded shadow-lg w-full max-w-md"
            onSubmit={async (e) => {
              e.preventDefault();
              setEditError("");
              const body = {
                id: editLog.id,
                user_id: editLog.user_id,
                date: editLog.date,
                check_in_time: editLog.check_in_time,
                check_out_time: editLog.check_out_time,
                notes: editLog.notes,
                breaks: editLog.breaks || [],
              };
              const res = await fetch('/api/checkins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              const result = await res.json();
              if (result.error) {
                setEditError(result.error);
              } else {
                setEditLog(null);
                fetchLogs();
              }
            }}
          >
            <h3 className="text-lg font-bold mb-4">Edit Check-In</h3>
            <div className="mb-2">
              <label>Date: {editLog.date}</label>
            </div>
            <div className="mb-2">
              <label>Check-In Time:</label>
              <input
                type="time"
                value={editLog.check_in_time ? new Date(editLog.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ""}
                onChange={e => setEditLog((l: any) => ({ ...l, check_in_time: l.date + "T" + e.target.value }))}
                className="border rounded p-2 w-full"
              />
            </div>
            <div className="mb-2">
              <label>Check-Out Time:</label>
              <input
                type="time"
                value={editLog.check_out_time ? new Date(editLog.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ""}
                onChange={e => setEditLog((l: any) => ({ ...l, check_out_time: l.date + "T" + e.target.value }))}
                className="border rounded p-2 w-full"
              />
            </div>
            <div className="mb-2">
              <label>Notes:</label>
              <input
                type="text"
                value={editLog.notes || ""}
                onChange={e => setEditLog((l: any) => ({ ...l, notes: e.target.value }))}
                className="border rounded p-2 w-full"
              />
            </div>
            {editError && <div className="text-red-600 mb-2">{editError}</div>}
            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-brand-navy text-white px-4 py-2 rounded">Save</button>
              <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => setEditLog(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

