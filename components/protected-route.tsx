"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "cashier" | "kitchen"
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = "/login" 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallbackPath)
        return
      }

      if (requiredRole) {
        const userRole = user.user_metadata?.role || 'cashier'
        if (userRole !== requiredRole) {
          // Redirect to appropriate page based on user role
          if (userRole === 'admin') {
            router.push('/admin')
          } else if (userRole === 'kitchen') {
            router.push('/kitchen')
          } else {
            router.push('/cashier')
          }
          return
        }
      }
    }
  }, [user, loading, requiredRole, router, fallbackPath])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-cream to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-navy mx-auto mb-4" />
          <p className="text-brand-medium-brown">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (requiredRole) {
    const userRole = user.user_metadata?.role || 'cashier'
    if (userRole !== requiredRole) {
      return null // Will redirect to appropriate page
    }
  }

  return <>{children}</>
} 