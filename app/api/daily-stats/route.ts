import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get today's orders
    const { data: todayOrders, error: ordersError } = await supabase
      .from('orders')
      .select('total, created_at, status')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())

    if (ordersError) {
      console.error('Error fetching today orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Calculate statistics
    const completedOrders = todayOrders?.filter(order => order.status === 'completed') || []
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const totalOrders = completedOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get hourly sales data for the chart
    const hourlySales = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(startOfDay)
      hourStart.setHours(hour)
      const hourEnd = new Date(startOfDay)
      hourEnd.setHours(hour + 1)

      const hourOrders = completedOrders.filter(order => {
        const orderTime = new Date(order.created_at)
        return orderTime >= hourStart && orderTime < hourEnd
      })

      const hourRevenue = hourOrders.reduce((sum, order) => sum + (order.total || 0), 0)

      return {
        hour: hour.toString().padStart(2, '0') + ':00',
        revenue: hourRevenue,
        orders: hourOrders.length
      }
    })

    // Get top products for today
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        products!inner(name, price)
      `)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
    }

    // Calculate top products
    const productStats = new Map()
    orderItems?.forEach(item => {
      const productName = item.products.name
      const existing = productStats.get(productName) || { name: productName, quantity: 0, revenue: 0 }
      existing.quantity += item.quantity
      existing.revenue += item.quantity * item.products.price
      productStats.set(productName, existing)
    })

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      hourlySales,
      topProducts
    })
  } catch (error) {
    console.error('Error in daily-stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}