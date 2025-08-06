"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Clock, ChefHat, CheckCircle, Coffee, Timer, LogOut, RefreshCw, Volume2, VolumeX } from "lucide-react"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { useSmartRefresh } from "@/hooks/use-smart-refresh"
import { useSoundNotifications } from "@/hooks/use-sound-notifications"

interface Order {
  id: string
  table_number: number
  items: any[]
  total: number
  status: string
  created_at: string
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { signOut } = useAuth()

  // Smart auto-refresh every 30 seconds when user is not active
  const { manualRefresh, forceRefresh, isUserActive } = useSmartRefresh({
    interval: 30000, // 30 seconds
    enabled: true,
    onRefresh: async () => {
      await fetchOrders()
      setLastRefresh(new Date())
    },
    userActivityThreshold: 5000 // 5 seconds after user activity
  })

  // Sound notifications for new orders
  const { checkNewOrders, testSound } = useSoundNotifications({
    enabled: soundEnabled,
    volume: 0.5,
    soundType: 'new-order'
  })

  useEffect(() => {
    fetchOrders()

    // Set up real-time subscription
    const subscription = supabase
      .channel("kitchen_orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders()
        setLastRefresh(new Date())
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["pending", "preparing", "reservation_confirmed"])
        .in("dining_type", ["dine_in", "takeaway", "reservation"])
        .order("created_at", { ascending: true })

      if (ordersError) throw ordersError

      // Get products that should show in kitchen
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, show_in_kitchen")
        .eq("show_in_kitchen", true)

      if (productsError) throw productsError

      const kitchenProductIds = new Set(productsData?.map((p) => p.id) || [])

      // Filter orders to only show items that belong to kitchen
      const filteredOrders =
        ordersData
          ?.map((order) => ({
            ...order,
            items: order.items.filter((item: any) => kitchenProductIds.has(item.id)),
          }))
          .filter((order) => order.items.length > 0) || []

      setOrders(filteredOrders)
      
      // Check for new orders and play sound
      checkNewOrders(filteredOrders.length)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

      if (error) throw error
      fetchOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const getTimeSinceOrder = (dateString: string) => {
    const orderTime = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    return diffMinutes
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleLogout = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-brand-medium-brown animate-bounce mx-auto mb-4" />
          <p className="text-brand-medium-brown">Loading kitchen orders...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="kitchen">
      <div className="min-h-screen bg-brand-cream">
        {/* Header */}
        <header className="bg-white border-b border-brand-caramel/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ChefHat className="h-8 w-8 text-brand-medium-brown" />
              <div>
                <h1 className="text-2xl font-bold text-brand-navy">Kitchen Display System</h1>
                <p className="text-brand-medium-brown">Manage order preparation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-brand-caramel text-white">{orders.length} Active Orders</Badge>
              <Badge className="bg-brand-navy text-white">{new Date().toLocaleTimeString()}</Badge>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={manualRefresh}
                  variant="outline"
                  size="sm"
                  className="text-brand-navy hover:text-brand-caramel"
                  title="Manual refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={testSound}
                  variant="outline"
                  size="sm"
                  className="text-brand-navy hover:text-brand-caramel"
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
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-6">
          {/* Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((order) => {
              const timeSinceOrder = getTimeSinceOrder(order.created_at)
              const isUrgent = timeSinceOrder > 15

              return (
                <Card
                  key={order.id}
                  className={`bg-white border-2 ${
                    isUrgent
                      ? "border-red-400 shadow-red-100"
                      : order.status === "preparing"
                        ? "border-blue-400 shadow-blue-100"
                        : "border-brand-caramel/20"
                  } ${isUrgent ? "animate-pulse" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-brand-navy">Table {order.table_number}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${order.status === "pending" ? "bg-yellow-500" : "bg-blue-500"} text-white`}>
                          {order.status}
                        </Badge>
                        {isUrgent && <Badge className="bg-red-500 text-white animate-pulse">URGENT</Badge>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-brand-medium-brown">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(order.created_at)}</span>
                      <Timer className="h-4 w-4 ml-2" />
                      <span className={timeSinceOrder > 15 ? "text-red-600 font-bold" : ""}>{timeSinceOrder}m ago</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-brand-cream rounded">
                          <div className="flex items-center space-x-2">
                            <Coffee className="h-4 w-4 text-brand-medium-brown" />
                            <div>
                              <span className="font-medium text-brand-navy">
                                {item.quantity}x {item.name}
                              </span>
                              <div className="text-xs text-brand-medium-brown">
                                Size: {item.size}
                                {item.notes && <div className="text-xs text-red-600 font-medium">Note: {item.notes}</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      {order.status === "pending" && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, "preparing")}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                          size="sm"
                        >
                          <ChefHat className="h-4 w-4 mr-1" />
                          Start Preparing
                        </Button>
                      )}

                      {order.status === "preparing" && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, "ready")}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Ready
                        </Button>
                      )}
                    </div>

                    {/* Order Total */}
                    <div className="pt-2 border-t border-brand-caramel/20">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-brand-medium-brown">Total:</span>
                        <span className="font-bold text-brand-navy">RM{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Empty State */}
          {orders.length === 0 && (
            <div className="text-center py-16">
              <ChefHat className="h-16 w-16 text-brand-medium-brown mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-brand-navy mb-2">No Active Orders</h3>
              <p className="text-brand-medium-brown">All caught up! New orders will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
