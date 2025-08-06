"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react"

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

interface TableStatusIndicatorProps {
  tableNumber: number
  showDetails?: boolean
  openOrdersForTable?: any[] // array of open orders for this table
}

export default function TableStatusIndicator({ tableNumber, showDetails = false, openOrdersForTable = [] }: TableStatusIndicatorProps) {
  const [tableStatus, setTableStatus] = useState<TableStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTableStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('table_dashboard')
        .select('*')
        .eq('table_number', tableNumber)
        .single()

      if (error) throw error
      setTableStatus(data)
    } catch (error) {
      console.error('Error fetching table status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTableStatus()
  }, [tableNumber])

  if (loading) {
    return <Badge className="bg-gray-400 text-white">Loading...</Badge>
  }

  if (!tableStatus) {
    return <Badge className="bg-gray-500 text-white">Unknown</Badge>
  }

  // Determine if there are open orders for this table
  const hasOpenOrder = openOrdersForTable && openOrdersForTable.length > 0
  // Override is_available if there are open orders
  const isActuallyAvailable = tableStatus.is_available && !hasOpenOrder

  // Debug log
  console.log(
    'Table:', tableNumber,
    'openOrdersForTable:', openOrdersForTable,
    'is_available:', tableStatus.is_available,
    'isActuallyAvailable:', isActuallyAvailable
  )

  const getStatusColor = () => {
    if (isActuallyAvailable) return 'bg-green-500'
    if (tableStatus.status === 'outstanding') return 'bg-red-500'
    return 'bg-yellow-500'
  }

  const getStatusIcon = () => {
    if (isActuallyAvailable) return <CheckCircle className="h-3 w-3" />
    if (tableStatus.status === 'outstanding') return <AlertTriangle className="h-3 w-3" />
    return <Clock className="h-3 w-3" />
  }

  const getStatusText = () => {
    if (isActuallyAvailable) return 'Available'
    if (tableStatus.status === 'outstanding') return 'Outstanding'
    return 'Occupied'
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge className={`${getStatusColor()} text-white`}>
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </Badge>
      
      {showDetails && !isActuallyAvailable && tableStatus.order_total && (
        <div className="text-xs text-gray-600">
          RM{tableStatus.order_total.toFixed(2)} - {tableStatus.order_status}
        </div>
      )}
    </div>
  )
} 