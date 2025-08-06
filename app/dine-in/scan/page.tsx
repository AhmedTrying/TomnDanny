"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import QRScanner from "@/components/shared/QRScanner"
import { ArrowLeft, QrCode, Users, Coffee, CheckCircle, Edit3, Home, Phone, CreditCard } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"

export default function DineInScanPage() {
  const [showScanner, setShowScanner] = useState(false)
  const [detectedTable, setDetectedTable] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [editableTable, setEditableTable] = useState<string>('')
  const router = useRouter()

  const handleTableDetected = (tableNumber: string) => {
    setDetectedTable(tableNumber)
    setEditableTable(tableNumber)
    setShowScanner(false)
    setIsConfirming(true)
  }

  const handleEditTable = () => {
    setIsEditingTable(true)
    setEditableTable(detectedTable || '')
  }

  const handleSaveTable = () => {
    if (editableTable.trim()) {
      setDetectedTable(editableTable.trim())
      setIsEditingTable(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingTable(false)
    setEditableTable(detectedTable || '')
  }

  const handleConfirmTable = () => {
    if (detectedTable) {
      router.push(`/menu?table=${detectedTable}`)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream to-white relative overflow-hidden">
      {/* Coffee Pattern Background */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23654321' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Cpath d='M20 20h4v4h-4zM36 36h4v4h-4z'/%3E%3Cpath d='M15 15c2-2 6-2 8 0s2 6 0 8-6 2-8 0-2-6 0-8zM45 45c2-2 6-2 8 0s2 6 0 8-6 2-8 0-2-6 0-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Floating Coffee Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-brand-caramel/20 text-4xl animate-pulse">☕</div>
        <div className="absolute top-40 right-20 text-brand-medium-brown/20 text-3xl animate-bounce" style={{animationDelay: '1s'}}>🫘</div>
        <div className="absolute bottom-40 left-20 text-brand-caramel/20 text-5xl animate-pulse" style={{animationDelay: '2s'}}>☕</div>
        <div className="absolute bottom-20 right-10 text-brand-medium-brown/20 text-3xl animate-bounce" style={{animationDelay: '0.5s'}}>🫘</div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/90 backdrop-blur-md border-b border-brand-caramel/20 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-brand-cream/50 rounded-full">
                  <ArrowLeft className="h-5 w-5 text-brand-navy" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-brand-navy">Dine In Experience</h1>
                <p className="text-sm text-brand-medium-brown">Scan your table QR code to get started</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-brand-caramel to-brand-medium-brown rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        {!isConfirming ? (
          <div className="max-w-md mx-auto">
            {/* Welcome Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-brand-caramel/20 shadow-xl mb-8">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-dark-brown to-brand-medium-brown rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-brand-navy mb-2">
                  Welcome to Our Café!
                </CardTitle>
                <p className="text-brand-medium-brown">
                  To provide you with the best dining experience, please scan the QR code on your table.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowScanner(true)}
                  className="w-full bg-gradient-to-r from-brand-dark-brown to-brand-medium-brown hover:from-brand-dark-brown/90 hover:to-brand-medium-brown/90 text-white py-3 rounded-xl shadow-lg"
                  size="lg"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  Scan Table QR Code
                </Button>
                

              </CardContent>
            </Card>
            
            {/* Instructions */}
            <div className="bg-gradient-to-r from-brand-cream to-brand-caramel/20 rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-brand-navy mb-3 flex items-center">
                <span className="mr-2">💡</span>
                How it works:
              </h3>
              <ul className="space-y-2 text-sm text-brand-medium-brown">
                <li className="flex items-start">
                  <span className="mr-2 text-brand-caramel">1.</span>
                  Find the QR code on your table
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-brand-caramel">2.</span>
                  Tap "Scan Table QR Code" and point your camera at it
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-brand-caramel">3.</span>
                  Confirm your table number and start ordering
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-brand-caramel">4.</span>
                  Enjoy your personalized dining experience!
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* Table Confirmation */
          <div className="max-w-md mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border-brand-caramel/20 shadow-xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-brand-navy mb-2">
                  Table Detected!
                </CardTitle>
                <p className="text-brand-medium-brown">
                  We've detected your table number. Please confirm to continue.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-brand-dark-brown to-brand-medium-brown text-white rounded-2xl p-6 shadow-lg">
                    <p className="text-sm opacity-90 mb-1">Your Table Number</p>
                    {isEditingTable ? (
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <Input
                          value={editableTable}
                          onChange={(e) => setEditableTable(e.target.value)}
                          className="text-2xl font-bold text-center bg-white/20 border-white/30 text-white placeholder-white/70 w-24"
                          placeholder="Table"
                        />
                        <Button
                          onClick={handleSaveTable}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          ✓
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/20"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <p className="text-4xl font-bold">{detectedTable}</p>
                        <Button
                          onClick={handleEditTable}
                          size="sm"
                          variant="ghost"
                          className="text-white/80 hover:text-white hover:bg-white/20"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleConfirmTable}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl shadow-lg"
                    size="lg"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Continue to Menu
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Link href={`/dine-in?table=${detectedTable}`}>
                      <Button
                        variant="outline"
                        className="w-full border-brand-caramel text-brand-navy hover:bg-brand-cream py-3 rounded-xl"
                        size="lg"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Home
                      </Button>
                    </Link>
                    
                    <Button
                      onClick={() => {
                        setDetectedTable(null)
                        setIsConfirming(false)
                        setShowScanner(true)
                      }}
                      variant="outline"
                      className="w-full border-brand-caramel text-brand-navy hover:bg-brand-cream py-3 rounded-xl"
                      size="lg"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Scan Again
                    </Button>
                  </div>
                  
                  <div className="pt-2 border-t border-brand-caramel/20">
                    <p className="text-sm text-brand-medium-brown text-center mb-3">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => {
                          // Handle call for service
                          alert('Service request sent!')
                        }}
                        variant="outline"
                        className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 py-2 rounded-xl"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Service
                      </Button>
                      
                      <Button
                        onClick={() => {
                          // Handle request for payment
                          alert('Payment request sent!')
                        }}
                        variant="outline"
                        className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 py-2 rounded-xl"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Request Payment
                      </Button>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onTableDetected={handleTableDetected}
      />
    </div>
  )
}