"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// Removed unused imports
import { supabase } from "@/lib/supabase"
import { 
  Search, Star, Plus, ShoppingCart, ArrowLeft, CheckCircle, Loader2, 
  Coffee, Clock, Users, CreditCard, User, Phone, MapPin, Receipt
} from "lucide-react"
import dynamic from "next/dynamic"
const POSMenuOrder = dynamic(() => import("@/components/cashier/POSMenuOrder"), { ssr: false })



export default function PlaceOrderPage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayStats, setTodayStats] = useState({
    orders: 0,
    revenue: 0,
    avgOrderTime: 0,
    popularItem: 'Coffee'
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchTodayStats()
  }, [])



  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('orders')
        .select('total, created_at, items')
        .gte('created_at', today)
        .lt('created_at', today + 'T23:59:59')
      
      if (error) throw error
      
      const orders = data || []
      const revenue = orders.reduce((sum, order) => sum + order.total, 0)
      
      setTodayStats({
        orders: orders.length,
        revenue,
        avgOrderTime: 12, // Mock data
        popularItem: 'Coffee' // Mock data
      })
    } catch (error) {
      console.error('Failed to fetch today stats:', error)
    }
  }

  // Removed fetchCustomers, handleCalculatorClick, and filteredCustomers functions

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Cashier Terminal</h1>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Cashier Mode</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Card className="shadow-sm border border-gray-200 bg-white">
          <CardHeader className="border-b border-gray-100 px-6 py-4">
            <CardTitle className="flex items-center space-x-2 text-gray-900 text-lg font-medium">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              <span>Order Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <POSMenuOrder 
              selectedCustomer={null}
              onCustomerChange={() => {}}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
