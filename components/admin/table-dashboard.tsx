"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Clock, Users, DollarSign, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface TableStatus {
  table_number: number
  status: string
  is_available: boolean
  current_order_id: string | null
  order_total: number | null
  order_status: string | null
  time_occupied: string | null
  zone: string
  capacity: number
}

export default function TableDashboard() {
  const [tables, setTables] = useState<TableStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchTableStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('table_dashboard')
        .select('*')
        .order('table_number')

      if (error) throw error
      setTables(data || [])
    } catch (error) {
      console.error('Error fetching table status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTableStatus()
    const interval = setInterval(fetchTableStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'occupied':
        return 'bg-yellow-500'
      case 'outstanding':
        return 'bg-red-500'
      case 'maintenance':
        return 'bg-gray-500'
      case 'reserved':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'occupied':
        return <Clock className="h-4 w-4" />
      case 'outstanding':
        return <AlertTriangle className="h-4 w-4" />
      case 'maintenance':
        return <XCircle className="h-4 w-4" />
      case 'reserved':
        return <Users className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatTimeOccupied = (timeString: string | null) => {
    if (!timeString) return null
    
    // Parse PostgreSQL interval format
    const hours = timeString.match(/(\d+) hours?/)
    const minutes = timeString.match(/(\d+) minutes?/)
    
    if (hours && minutes) {
      return `${hours[1]}h ${minutes[1]}m`
    } else if (hours) {
      return `${hours[1]}h`
    } else if (minutes) {
      return `${minutes[1]}m`
    }
    
    return timeString
  }

  const availableTables = tables.filter(t => t.is_available)
  const occupiedTables = tables.filter(t => !t.is_available && t.status === 'occupied')
  const outstandingTables = tables.filter(t => !t.is_available && t.status === 'outstanding')

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Available</p>
                <p className="text-2xl font-bold text-green-700">{availableTables.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Occupied</p>
                <p className="text-2xl font-bold text-yellow-700">{occupiedTables.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-700">{outstandingTables.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Tables</p>
                <p className="text-2xl font-bold text-blue-700">{tables.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Table Status Dashboard</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setLastRefresh(new Date())
                  fetchTableStatus()
                }}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tables.map((table) => (
                <Card 
                  key={table.table_number}
                  className={`border-2 transition-all duration-200 hover:shadow-lg ${
                    table.is_available 
                      ? 'border-green-200 bg-green-50' 
                      : table.status === 'outstanding'
                      ? 'border-red-200 bg-red-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        Table {table.table_number}
                      </h3>
                      <Badge className={`${getStatusColor(table.status)} text-white`}>
                        {getStatusIcon(table.status)}
                        <span className="ml-1">{table.status}</span>
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Zone:</span>
                        <span className="font-medium">{table.zone}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="font-medium">{table.capacity} people</span>
                      </div>

                      {!table.is_available && table.order_total && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Order Total:</span>
                            <span className="font-medium text-green-600">
                              RM{table.order_total.toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Order Status:</span>
                            <Badge variant="outline" className="text-xs">
                              {table.order_status}
                            </Badge>
                          </div>

                          {table.time_occupied && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Time:</span>
                              <span className="font-medium text-orange-600">
                                {formatTimeOccupied(table.time_occupied)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {!table.is_available && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            // Navigate to order details or payment processing
                            console.log(`View order for table ${table.table_number}`)
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          View Order
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 