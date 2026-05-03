import { useEffect } from 'react'
import { getAccessToken, scheduleTokenRefresh, clearTokens, isTokenExpired } from '../lib/auth'

/**
 * Hook to initialize and manage token refresh on app load
 * Should be called once at the root level of your app
 */
export function useTokenRefresh() {
  useEffect(() => {
    const token = getAccessToken()
    
    if (token) {
      // Check if token is already expired
      if (isTokenExpired(token)) {
        console.warn('Token is expired, clearing tokens')
        clearTokens()
        window.location.href = '/login?session=expired'
      } else {
        // Schedule token refresh
        scheduleTokenRefresh(token)
      }
    }
  }, [])
}
