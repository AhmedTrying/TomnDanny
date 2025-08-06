"use client"

import { useEffect, useState } from "react"
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
  Package,
  Plus,
  Minus,
  Edit,
  Save,
  X,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  History,
  RefreshCw,
  Pencil,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock_quantity: number
  low_stock_threshold: number
  track_stock: boolean
  active: boolean
  is_supply?: boolean // add is_supply field
}

interface StockHistory {
  id: string
  product_id: string
  change_type: 'initial' | 'restock' | 'sale' | 'adjustment' | 'waste' | 'return'
  quantity_change: number
  previous_quantity: number
  new_quantity: number
  reason: string
  notes: string
  staff_id: string
  created_at: string
  product_name?: string
}

export default function StockManagementPage() {
  const { user } = useAuth()
  const userRole = user?.user_metadata?.role || 'cashier'
  const isAdmin = userRole === 'admin'
  const isCashier = userRole === 'cashier'

  // Both admin and cashier have full access
  const hasFullAccess = isAdmin || isCashier

  if (!hasFullAccess) {
    return <div className="p-8 text-center text-red-600 font-bold">You do not have access to view this page.</div>
  }

  const [products, setProducts] = useState<Product[]>([])
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStock, setFilterStock] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [tab, setTab] = useState<'products' | 'supplies'>('products');
  const [newSupply, setNewSupply] = useState({ name: '', description: '', stock_quantity: 0, low_stock_threshold: 10, track_stock: true, category: 'Supplies', price: 0 });
  
  // Stock adjustment modal state
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<'restock' | 'adjustment' | 'waste' | 'return'>('restock')
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0)
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [adjustmentNotes, setAdjustmentNotes] = useState("")
  
  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedProductHistory, setSelectedProductHistory] = useState<Product | null>(null)

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editFields, setEditFields] = useState({ name: '', description: '', category: '', price: 0, low_stock_threshold: 10, track_stock: true });

  // Add state for set stock modal
  const [setStockModalOpen, setSetStockModalOpen] = useState(false);
  const [setStockProduct, setSetStockProduct] = useState<Product | null>(null);
  const [setStockValue, setSetStockValue] = useState(0);
  const [setStockNotes, setSetStockNotes] = useState("");

  const { toast } = useToast()

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error

      setProducts(data || [])
      
      // Extract unique categories (for non-supplies only)
      const uniqueCategories = [...new Set((data?.filter((p: Product) => !p.is_supply).map(p => p.category)) || [])]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({ title: "Error", description: "Failed to fetch products", variant: "destructive", })
    } finally {
      setLoading(false)
    }
  }

  const fetchStockHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_history')
        .select(`
          *,
          products(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const historyWithProductNames = data?.map(item => ({
        ...item,
        product_name: item.products?.name
      })) || []

      setStockHistory(historyWithProductNames)
    } catch (error) {
      console.error('Error fetching stock history:', error)
    }
  }

  const updateStock = async () => {
    if (!selectedProduct || adjustmentQuantity === 0) return

    setSaving(true)
    try {
      const newQuantity = selectedProduct.stock_quantity + adjustmentQuantity
      
      if (newQuantity < 0) {
        toast({
          title: "Error",
          description: "Stock quantity cannot be negative",
          variant: "destructive",
        })
        return
      }

      // Update product stock quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', selectedProduct.id)

      if (updateError) throw updateError

      // Add to stock history
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          product_id: selectedProduct.id,
          change_type: adjustmentType,
          quantity_change: adjustmentQuantity,
          previous_quantity: selectedProduct.stock_quantity,
          new_quantity: newQuantity,
          reason: adjustmentReason,
          notes: adjustmentNotes,
          staff_id: user?.id
        })

      if (historyError) throw historyError

      // Refresh data
      await fetchProducts()
      await fetchStockHistory()

      // Reset modal state
      setAdjustmentModalOpen(false)
      setSelectedProduct(null)
      setAdjustmentQuantity(0)
      setAdjustmentReason("")
      setAdjustmentNotes("")

      toast({
        title: "Success",
        description: `Stock updated successfully. New quantity: ${newQuantity}`,
      })
    } catch (error) {
      console.error('Error updating stock:', error)
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleStockTracking = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ track_stock: !product.track_stock })
        .eq('id', product.id)

      if (error) throw error

      await fetchProducts()
      
      toast({
        title: "Success",
        description: `Stock tracking ${!product.track_stock ? 'enabled' : 'disabled'} for ${product.name}`,
      })
    } catch (error) {
      console.error('Error toggling stock tracking:', error)
      toast({
        title: "Error",
        description: "Failed to update stock tracking",
        variant: "destructive",
      })
    }
  }

  const openAdjustmentModal = (product: Product, type: 'restock' | 'adjustment' | 'waste' | 'return') => {
    setSelectedProduct(product)
    setAdjustmentType(type)
    setAdjustmentQuantity(0)
    setAdjustmentReason("")
    setAdjustmentNotes("")
    setAdjustmentModalOpen(true)
  }

  const openHistoryModal = (product: Product) => {
    setSelectedProductHistory(product)
    setHistoryModalOpen(true)
  }

  const openSetStockModal = (product: Product) => {
    setSetStockProduct(product);
    setSetStockValue(product.stock_quantity);
    setSetStockNotes("");
    setSetStockModalOpen(true);
  };

  const handleSetStock = async () => {
    if (!setStockProduct) return;
    setSaving(true);
    try {
      const previous_quantity = setStockProduct.stock_quantity;
      const new_quantity = setStockValue;
      const quantity_change = new_quantity - previous_quantity;
      if (quantity_change === 0) {
        setSetStockModalOpen(false);
        setSaving(false);
        return;
      }
      // Update product stock quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: new_quantity })
        .eq('id', setStockProduct.id);
      if (updateError) throw updateError;
      // Add to stock history
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          product_id: setStockProduct.id,
          change_type: 'adjustment',
          quantity_change,
          previous_quantity,
          new_quantity,
          reason: 'Set Stock',
          notes: setStockNotes,
          staff_id: user?.id
        });
      if (historyError) throw historyError;
      await fetchProducts();
      await fetchStockHistory();
      setSetStockModalOpen(false);
      toast({ title: 'Success', description: 'Stock set successfully.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to set stock.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (product: Product) => {
    if (!product.track_stock) return { status: 'not-tracked', color: 'bg-gray-100 text-gray-600' }
    if (product.stock_quantity <= 0) return { status: 'out-of-stock', color: 'bg-red-100 text-red-600' }
    if (product.stock_quantity <= product.low_stock_threshold) return { status: 'low-stock', color: 'bg-yellow-100 text-yellow-600' }
    return { status: 'in-stock', color: 'bg-green-100 text-green-600' }
  }

  const getChangeTypeLabel = (type: string) => {
    const labels = {
      'initial': 'Initial',
      'restock': 'Restock',
      'sale': 'Sale',
      'adjustment': 'Adjustment',
      'waste': 'Waste',
      'return': 'Return'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getChangeTypeColor = (type: string) => {
    const colors = {
      'initial': 'bg-blue-100 text-blue-600',
      'restock': 'bg-green-100 text-green-600',
      'sale': 'bg-red-100 text-red-600',
      'adjustment': 'bg-purple-100 text-purple-600',
      'waste': 'bg-orange-100 text-orange-600',
      'return': 'bg-cyan-100 text-cyan-600'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-600'
  }

  const filteredProducts = products.filter(product => !product.is_supply && (
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) && (filterCategory === "all" || product.category === filterCategory) && (filterStock === "all" || (filterStock === "low" && product.track_stock && product.stock_quantity <= product.low_stock_threshold) || (filterStock === "out" && product.track_stock && product.stock_quantity <= 0) || (filterStock === "not-tracked" && !product.track_stock)));
  const filteredSupplies = products.filter(product => product.is_supply);

  const getProductHistory = (productId: string) => {
    return stockHistory.filter(item => item.product_id === productId)
  }

  const totalProducts = products.length
  const lowStockProducts = products.filter(p => p.track_stock && p.stock_quantity <= p.low_stock_threshold).length
  const outOfStockProducts = products.filter(p => p.track_stock && p.stock_quantity <= 0).length
  const notTrackedProducts = products.filter(p => !p.track_stock).length

  useEffect(() => {
    fetchProducts()
    fetchStockHistory()
  }, [])

  useEffect(() => {
    setEditModalOpen(false);
    setAdjustmentModalOpen(false);
    setHistoryModalOpen(false);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <p className="text-muted-foreground">Manage product inventory and track stock levels</p>
        </div>
        <Button onClick={fetchProducts} disabled={loading || !hasFullAccess}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <div className="mb-4">
        <Button variant={tab === 'products' ? 'default' : 'outline'} onClick={() => setTab('products')} className="mr-2">Products</Button>
        <Button variant={tab === 'supplies' ? 'default' : 'outline'} onClick={() => setTab('supplies')}>Supplies</Button>
      </div>
      {tab === 'products' && (
        <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold">{lowStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold">{outOfStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Not Tracked</p>
                  <p className="text-2xl font-bold">{notTrackedProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.filter(category => category && category !== "").map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="stock-filter">Stock Status</Label>
                <Select value={filterStock} onValueChange={setFilterStock}>
                  <SelectTrigger>
                    <SelectValue placeholder="All stock levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stock levels</SelectItem>
                    <SelectItem value="low">Low stock</SelectItem>
                    <SelectItem value="out">Out of stock</SelectItem>
                    <SelectItem value="not-tracked">Not tracked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Low Stock Threshold</TableHead>
                      <TableHead>Track Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product)
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">{product.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                            <div className="font-medium">{product.stock_quantity}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={stockStatus.color}>
                              {stockStatus.status.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{product.low_stock_threshold}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => hasFullAccess && toggleStockTracking(product)}
                              disabled={!hasFullAccess}
                            >
                              {product.track_stock ? 'Yes' : 'No'}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => hasFullAccess && openAdjustmentModal(product, 'restock')}
                                disabled={!hasFullAccess}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (hasFullAccess) {
                                    setEditProduct(product);
                                    setEditFields({
                                      name: product.name,
                                      description: product.description,
                                      category: product.category,
                                      price: product.price ?? 0,
                                      low_stock_threshold: product.low_stock_threshold,
                                      track_stock: product.track_stock,
                                    });
                                    setEditModalOpen(true);
                                  }
                                }}
                                disabled={!hasFullAccess}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openHistoryModal(product)}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openSetStockModal(product)}
                                disabled={!hasFullAccess}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No products found matching your criteria.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </>
      )}
      {tab === 'supplies' && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Supply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={newSupply.name} onChange={e => setNewSupply({ ...newSupply, name: e.target.value })} required />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={newSupply.description} onChange={e => setNewSupply({ ...newSupply, description: e.target.value })} />
                </div>
                <div>
                  <Label>Stock Quantity</Label>
                  <Input type="number" value={newSupply.stock_quantity} onChange={e => setNewSupply({ ...newSupply, stock_quantity: parseInt(e.target.value) || 0 })} required />
                </div>
                <div>
                  <Label>Low Stock Threshold</Label>
                  <Input type="number" value={newSupply.low_stock_threshold} onChange={e => setNewSupply({ ...newSupply, low_stock_threshold: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={newSupply.category} onChange={e => setNewSupply({ ...newSupply, category: e.target.value })} required />
                </div>
                <div>
                  <Label>Price (optional)</Label>
                  <Input type="number" value={newSupply.price} onChange={e => setNewSupply({ ...newSupply, price: e.target.value === '' ? 0 : parseFloat(e.target.value) })} min="0" step="0.01" />
                </div>
                <div>
                  <Label>Track Stock</Label>
                  <Select value={newSupply.track_stock ? 'yes' : 'no'} onValueChange={v => setNewSupply({ ...newSupply, track_stock: v === 'yes' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mt-4" onClick={async () => {
                if (!hasFullAccess) return;
                setSaving(true);
                try {
                  const supplyToInsert = {
                    ...newSupply,
                    is_supply: true,
                    price: newSupply.price || 0,
                    category: newSupply.category || 'Supplies',
                  };
                  const insertResult = await supabase.from('products').insert([supplyToInsert]);
                  if (insertResult.error) throw insertResult.error;
                  setNewSupply({ name: '', description: '', stock_quantity: 0, low_stock_threshold: 10, track_stock: true, category: 'Supplies', price: 0 });
                  await fetchProducts();
                  toast({ title: 'Success', description: 'Supply added successfully.' });
                } catch (err) {
                  toast({ title: 'Error', description: 'Failed to add supply.', variant: 'destructive' });
                } finally {
                  setSaving(false);
                }
              }} disabled={!hasFullAccess}>Add Supply</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Supplies Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supply</TableHead>
                      <TableHead>Stock Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Low Stock Threshold</TableHead>
                      <TableHead>Track Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSupplies.map((supply) => {
                      const stockStatus = getStockStatus(supply)
                      return (
                        <TableRow key={supply.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{supply.name}</div>
                              <div className="text-sm text-muted-foreground">{supply.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{supply.stock_quantity}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={stockStatus.color}>{stockStatus.status.replace('-', ' ')}</Badge>
                          </TableCell>
                          <TableCell>{supply.low_stock_threshold}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => hasFullAccess && toggleStockTracking(supply)} disabled={!hasFullAccess}>{supply.track_stock ? 'Yes' : 'No'}</Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={() => hasFullAccess && openAdjustmentModal(supply, 'restock')} disabled={!hasFullAccess}><Plus className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                if (hasFullAccess) {
                                  setEditProduct(supply);
                                  setEditFields({
                                    name: supply.name,
                                    description: supply.description,
                                    category: supply.category,
                                    price: supply.price ?? 0,
                                    low_stock_threshold: supply.low_stock_threshold,
                                    track_stock: supply.track_stock,
                                  });
                                  setEditModalOpen(true);
                                }
                              }} disabled={!hasFullAccess}><Edit className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => openHistoryModal(supply)}><History className="h-4 w-4" /></Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openSetStockModal(supply)}
                                disabled={!hasFullAccess}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {filteredSupplies.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No supplies found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Stock Adjustment Modal */}
      <Dialog open={adjustmentModalOpen} onOpenChange={setAdjustmentModalOpen}>
        <DialogContent aria-describedby="stock-adjustment-desc" className="sm:max-w-md">
          <div id="stock-adjustment-desc" className="sr-only">
            This dialog allows you to adjust the stock for the selected product or supply.
          </div>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'restock' && 'Restock Product'}
              {adjustmentType === 'adjustment' && 'Adjust Stock'}
              {adjustmentType === 'waste' && 'Record Waste'}
              {adjustmentType === 'return' && 'Record Return'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <Label>Product</Label>
                <div className="text-sm font-medium">{selectedProduct.name}</div>
                <div className="text-sm text-muted-foreground">Current stock: {selectedProduct.stock_quantity}</div>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity Change</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                  placeholder={adjustmentType === 'restock' ? 'Enter quantity to add' : 'Enter quantity'}
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Enter reason for adjustment"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateStock} disabled={saving || adjustmentQuantity === 0 || !hasFullAccess}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent aria-describedby="edit-product-desc" className="sm:max-w-md">
          <div id="edit-product-desc" className="sr-only">
            This dialog allows you to edit the details of the selected product or supply.
          </div>
          <DialogHeader>
            <DialogTitle>Edit Product/Supply Details</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editFields.name} onChange={e => setEditFields({ ...editFields, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={editFields.description} onChange={e => setEditFields({ ...editFields, description: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={editFields.category} onChange={e => setEditFields({ ...editFields, category: e.target.value })} />
              </div>
              <div>
                <Label>Price</Label>
                <Input type="number" value={editFields.price} onChange={e => setEditFields({ ...editFields, price: parseFloat(e.target.value) || 0 })} min="0" step="0.01" />
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input type="number" value={editFields.low_stock_threshold} onChange={e => setEditFields({ ...editFields, low_stock_threshold: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Track Stock</Label>
                <Select value={editFields.track_stock ? 'yes' : 'no'} onValueChange={v => setEditFields({ ...editFields, track_stock: v === 'yes' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!editProduct || !hasFullAccess) return;
              setSaving(true);
              try {
                const { error } = await supabase.from('products').update({
                  name: editFields.name,
                  description: editFields.description,
                  category: editFields.category,
                  price: editFields.price,
                  low_stock_threshold: editFields.low_stock_threshold,
                  track_stock: editFields.track_stock,
                }).eq('id', editProduct.id);
                if (error) throw error;
                setEditModalOpen(false);
                setEditProduct(null);
                await fetchProducts();
                toast({ title: 'Success', description: 'Product/Supply updated successfully.' });
              } catch (err) {
                toast({ title: 'Error', description: 'Failed to update product/supply.', variant: 'destructive' });
              } finally {
                setSaving(false);
              }
            }} disabled={!hasFullAccess}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent aria-describedby="stock-history-desc" className="sm:max-w-4xl">
          <div id="stock-history-desc" className="sr-only">
            This dialog shows the stock history for the selected product or supply.
          </div>
          <DialogHeader>
            <DialogTitle>Stock History - {selectedProductHistory ? selectedProductHistory.name : ''}</DialogTitle>
          </DialogHeader>
          
          {selectedProductHistory && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Previous</TableHead>
                      <TableHead>New</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProductHistory && Array.isArray(getProductHistory(selectedProductHistory.id)) && getProductHistory(selectedProductHistory.id).map((history: any) => (
                      <TableRow key={history.id}>
                        <TableCell>
                          {new Date(history.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getChangeTypeColor(history.change_type)}>
                            {getChangeTypeLabel(history.change_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={history.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}>
                            {history.quantity_change > 0 ? '+' : ''}{history.quantity_change}
                          </span>
                        </TableCell>
                        <TableCell>{history.previous_quantity}</TableCell>
                        <TableCell>{history.new_quantity}</TableCell>
                        <TableCell>{history.reason}</TableCell>
                        <TableCell>{history.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {selectedProductHistory && getProductHistory(selectedProductHistory.id).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No stock history found for this product.
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Stock Modal */}
      <Dialog open={setStockModalOpen} onOpenChange={setSetStockModalOpen}>
        <DialogContent aria-describedby="set-stock-desc" className="sm:max-w-md">
          <div id="set-stock-desc" className="sr-only">
            This dialog allows you to set the stock for the selected product or supply directly.
          </div>
          <DialogHeader>
            <DialogTitle>Set Stock - {setStockProduct?.name}</DialogTitle>
          </DialogHeader>
          {setStockProduct && (
            <div className="space-y-4">
              <div>
                <Label>Current Stock</Label>
                <div className="text-sm font-medium">{setStockProduct.stock_quantity}</div>
              </div>
              <div>
                <Label htmlFor="set-stock-value">New Stock Value</Label>
                <Input
                  id="set-stock-value"
                  type="number"
                  value={setStockValue}
                  onChange={e => setSetStockValue(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="set-stock-notes">Notes (Optional)</Label>
                <Textarea
                  id="set-stock-notes"
                  value={setStockNotes}
                  onChange={e => setSetStockNotes(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetStockModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetStock} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Set Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 