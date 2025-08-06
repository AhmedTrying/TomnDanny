import { useEffect, useRef, useCallback } from 'react'

interface UseSmartRefreshOptions {
  interval: number // Refresh interval in milliseconds
  enabled?: boolean // Whether auto-refresh is enabled
  onRefresh: () => void | Promise<void> // Function to call on refresh
  userActivityThreshold?: number // Time in ms to wait after user activity before resuming refresh
}

export function useSmartRefresh({
  interval,
  enabled = true,
  onRefresh,
  userActivityThreshold = 5000 // 5 seconds after user activity
}: UseSmartRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isUserActiveRef = useRef<boolean>(false)

  // Track user activity
  const trackUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    isUserActiveRef.current = true
    
    // Clear the flag after threshold
    setTimeout(() => {
      isUserActiveRef.current = false
    }, userActivityThreshold)
  }, [userActivityThreshold])

  // Set up activity listeners
  useEffect(() => {
    if (!enabled) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      trackUserActivity()
    }

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [enabled, trackUserActivity])

  // Set up auto-refresh interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const refresh = async () => {
      // Only refresh if user is not active
      if (!isUserActiveRef.current) {
        try {
          await onRefresh()
        } catch (error) {
          console.error('Auto-refresh error:', error)
        }
      }
    }

    intervalRef.current = setInterval(refresh, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, onRefresh])

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    try {
      await onRefresh()
    } catch (error) {
      console.error('Manual refresh error:', error)
    }
  }, [onRefresh])

  // Force refresh (ignores user activity)
  const forceRefresh = useCallback(async () => {
    try {
      await onRefresh()
    } catch (error) {
      console.error('Force refresh error:', error)
    }
  }, [onRefresh])

  return {
    manualRefresh,
    forceRefresh,
    isUserActive: isUserActiveRef.current
  }
} 