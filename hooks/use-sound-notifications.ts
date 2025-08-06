import { useRef, useCallback, useEffect } from 'react'

interface SoundNotificationOptions {
  enabled?: boolean
  volume?: number
  soundType?: 'new-order' | 'service-request' | 'urgent' | 'custom'
  customSoundUrl?: string
  fallbackToBrowser?: boolean
}

export function useSoundNotifications({
  enabled = true,
  volume = 0.5,
  soundType = 'new-order',
  customSoundUrl,
  fallbackToBrowser = true
}: SoundNotificationOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastOrderCountRef = useRef<number>(0)
  const lastServiceRequestCountRef = useRef<number>(0)
  const soundLoadedRef = useRef<boolean>(false)

  // Predefined sound URLs (using WAV files)
  const soundUrls = {
    'new-order': '/sounds/new-order.wav',
    'service-request': '/sounds/service-request.wav',
    'urgent': '/sounds/urgent.wav',
    'custom': customSoundUrl || '/sounds/new-order.wav'
  }

  // Initialize audio element
  useEffect(() => {
    if (!enabled) return

    const audio = new Audio(soundUrls[soundType])
    audio.volume = volume
    audio.preload = 'auto'
    
    // Check if sound file exists
    audio.addEventListener('error', () => {
      console.warn(`Sound file not found: ${soundUrls[soundType]}`)
      soundLoadedRef.current = false
    })
    
    audio.addEventListener('canplaythrough', () => {
      soundLoadedRef.current = true
    })
    
    audioRef.current = audio

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [enabled, soundType, volume, customSoundUrl])

  // Play sound function with fallback
  const playSound = useCallback(async (type: 'new-order' | 'service-request' | 'urgent' | 'custom' = soundType) => {
    if (!enabled) return

    try {
      // Try to play custom sound first
      if (audioRef.current && soundLoadedRef.current) {
        // Update audio source if different type
        if (type !== soundType) {
          audioRef.current.src = soundUrls[type]
        }

        // Reset audio to beginning and play
        audioRef.current.currentTime = 0
        audioRef.current.volume = volume
        
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          await playPromise
        }
        return
      }

      // Fallback to browser default sounds
      if (fallbackToBrowser) {
        console.log(`🔔 Playing fallback sound for: ${type}`)
        
        // Create a simple beep using Web Audio API
        if (typeof window !== 'undefined' && window.AudioContext) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          // Different frequencies for different sounds
          const frequencies = {
            'new-order': 800,
            'service-request': 600,
            'urgent': 400,
            'custom': 800
          }
          
          oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime)
          gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.1)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.5)
        } else {
          // Ultimate fallback: console notification
          console.log(`🔔 NOTIFICATION: ${type.toUpperCase().replace('-', ' ')}`)
        }
      }
    } catch (error) {
      console.error('Error playing sound:', error)
      
      // Final fallback: console notification
      console.log(`🔔 NOTIFICATION: ${type.toUpperCase().replace('-', ' ')}`)
    }
  }, [enabled, soundType, volume, fallbackToBrowser])

  // Check for new orders and play sound
  const checkNewOrders = useCallback((currentOrderCount: number) => {
    if (!enabled || currentOrderCount <= lastOrderCountRef.current) return

    const newOrdersCount = currentOrderCount - lastOrderCountRef.current
    if (newOrdersCount > 0) {
      playSound('new-order')
    }
    
    lastOrderCountRef.current = currentOrderCount
  }, [enabled, playSound])

  // Check for new service requests and play sound
  const checkNewServiceRequests = useCallback((currentRequestCount: number) => {
    if (!enabled || currentRequestCount <= lastServiceRequestCountRef.current) return

    const newRequestsCount = currentRequestCount - lastServiceRequestCountRef.current
    if (newRequestsCount > 0) {
      playSound('service-request')
    }
    
    lastServiceRequestCountRef.current = currentRequestCount
  }, [enabled, playSound])

  // Manual sound trigger
  const triggerSound = useCallback((type: 'new-order' | 'service-request' | 'urgent' | 'custom' = 'new-order') => {
    playSound(type)
  }, [playSound])

  // Test sound function
  const testSound = useCallback(() => {
    playSound(soundType)
  }, [playSound, soundType])

  return {
    playSound,
    checkNewOrders,
    checkNewServiceRequests,
    triggerSound,
    testSound,
    enabled,
    soundLoaded: soundLoadedRef.current
  }
} 