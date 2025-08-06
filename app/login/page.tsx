"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useSettings } from '@/lib/settings-context'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, user } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const settings = useSettings()
  const cafeName = settings?.cafe_name || 'Café'

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Check user role and redirect accordingly
      const userRole = user.user_metadata?.role || 'cashier'
      if (userRole === 'admin') {
        router.push("/admin")
      } else if (userRole === 'kitchen') {
        router.push("/kitchen")
      } else {
        router.push("/cashier")
      }
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        throw new Error(error.message)
      }

      // The redirect will be handled by the useEffect above
    } catch (error: any) {
      setError(error.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-brand-caramel/20 shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-brand-navy rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-brand-cream">&</span>
          </div>
          <CardTitle className="text-2xl font-bold text-brand-navy">{cafeName}</CardTitle>
          <p className="text-brand-medium-brown">Staff Login Portal</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-brand-navy font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-brand-caramel/30 focus:border-brand-caramel"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-brand-navy font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-brand-caramel/30 focus:border-brand-caramel pr-10"
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-brand-cream"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-brand-cream rounded-lg">
            <p className="text-sm text-brand-medium-brown mb-2 font-medium">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-brand-medium-brown">
              <p>
                <strong>Admin:</strong> admin@tommdanny.com / admin123
              </p>
              <p>
                <strong>Cashier:</strong> cashier@tommdanny.com / cashier123
              </p>
              <p>
                <strong>Kitchen:</strong> kitchen@tommdanny.com / kitchen123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
