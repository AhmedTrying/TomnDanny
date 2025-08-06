"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, X, Hash, AlertCircle } from "lucide-react"

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onTableDetected: (tableNumber: string) => void
}

export default function QRScanner({ isOpen, onClose, onTableDetected }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualTableNumber, setManualTableNumber] = useState("")
  const [showManualInput, setShowManualInput] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen && !showManualInput) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, showManualInput])

  const startCamera = async () => {
    try {
      setError(null)
      setIsScanning(true)
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device")
      }
      
      // Request camera permissions with better error handling
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
      
      // Start scanning for QR codes
      scanForQRCode()
    } catch (err: any) {
      console.error("Error accessing camera:", err)
      
      let errorMessage = "Unable to access camera. Please allow camera permissions or enter table number manually."
      
      // Provide specific error messages based on the error type
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Camera access denied. Please click 'Allow' when prompted, or check your browser settings to enable camera access for this site."
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = "No camera found on this device. Please enter table number manually."
      } else if (err.name === 'NotSupportedError') {
        errorMessage = "Camera not supported on this browser. Please enter table number manually."
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = "Camera is being used by another application. Please close other apps using the camera and try again."
      }
      
      setError(errorMessage)
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        
        // Simple QR code detection simulation
        // In a real implementation, you would use a QR code library like jsQR
        // For now, we'll simulate detection after a few seconds
        setTimeout(() => {
          // Simulate QR code detection with table number
          const simulatedTableNumber = Math.floor(Math.random() * 20) + 1
          handleQRCodeDetected(simulatedTableNumber.toString())
        }, 3000)
      }
      
      if (isScanning) {
        requestAnimationFrame(scan)
      }
    }
    
    scan()
  }

  const handleQRCodeDetected = (tableNumber: string) => {
    setIsScanning(false)
    stopCamera()
    onTableDetected(tableNumber)
  }

  const handleManualSubmit = () => {
    if (manualTableNumber.trim()) {
      onTableDetected(manualTableNumber.trim())
    }
  }

  const handleClose = () => {
    stopCamera()
    setShowManualInput(false)
    setManualTableNumber("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-brand-navy">
            <Camera className="h-5 w-5 mr-2" />
            Scan Table QR Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!showManualInput ? (
            <>
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanning Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white rounded-lg w-48 h-48 relative">
                      <div className="absolute inset-0 border-2 border-brand-caramel animate-pulse rounded-lg"></div>
                      <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-white"></div>
                      <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-white"></div>
                      <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-white"></div>
                      <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-white"></div>
                    </div>
                  </div>
                )}
                
                {/* Loading State */}
                {!isScanning && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              <div className="text-center space-y-2">
                <div className="bg-brand-cream/20 border border-brand-caramel rounded-lg p-4 mb-4">
                  <p className="text-sm text-brand-dark-brown text-center mb-2">
                    📱 Position your camera over the QR code on your table
                  </p>
                  <p className="text-xs text-brand-medium-brown text-center">
                    💡 Your browser will ask for camera permission - please click "Allow" to scan the QR code
                  </p>
                  <p className="text-xs text-brand-medium-brown text-center mt-1">
                    📋 On mobile: Look for the camera icon in your address bar or browser settings
                  </p>
                </div>
                {isScanning && (
                  <p className="text-sm text-brand-caramel animate-pulse">
                    🔍 Scanning for QR code...
                  </p>
                )}
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <p className="mb-2">{error}</p>
                      {error.includes('denied') && (
                        <div className="text-xs space-y-1">
                          <p>📱 <strong>On Mobile:</strong></p>
                          <p>• Look for camera icon in address bar and tap "Allow"</p>
                          <p>• Or go to browser Settings → Site Settings → Camera → Allow</p>
                          <p>💻 <strong>On Desktop:</strong></p>
                          <p>• Click the camera icon next to the address bar</p>
                          <p>• Select "Always allow" for this site</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Manual Input Option */}
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                  className="border-brand-caramel text-brand-navy hover:bg-brand-cream"
                >
                  <Hash className="h-4 w-4 mr-2" />
                  Enter Table Number Manually
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Manual Input */}
              <div className="space-y-4">
                <div className="text-center">
                  <Hash className="h-12 w-12 mx-auto mb-2 text-brand-medium-brown" />
                  <h3 className="font-semibold text-brand-navy">Enter Table Number</h3>
                  <p className="text-sm text-brand-medium-brown">
                    Please enter your table number manually
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="tableNumber" className="text-brand-navy">
                    Table Number
                  </Label>
                  <Input
                    id="tableNumber"
                    type="number"
                    placeholder="e.g., 5"
                    value={manualTableNumber}
                    onChange={(e) => setManualTableNumber(e.target.value)}
                    className="border-brand-caramel focus:border-brand-caramel"
                    min="1"
                    max="50"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowManualInput(false)}
                    className="flex-1 border-brand-caramel text-brand-navy hover:bg-brand-cream"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Back to Scanner
                  </Button>
                  <Button
                    onClick={handleManualSubmit}
                    disabled={!manualTableNumber.trim()}
                    className="flex-1 bg-brand-dark-brown hover:bg-brand-dark-brown/90 text-white"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}