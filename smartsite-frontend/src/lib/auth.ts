type TokenPayload = {
  realm_access?: { roles?: string[] }
  exp?: number
  iat?: number
  preferred_username?: string
  sub?: string
}

const ACCESS_TOKEN_KEY = 'smartsite_access_token'
const REFRESH_TOKEN_KEY = 'smartsite_refresh_token'
const TOKEN_REFRESH_BUFFER = 60 * 1000 // Refresh 1 minute before expiration
const AUTH_STATE_EVENT = 'smartsite-auth-changed'

let refreshTimeout: ReturnType<typeof setTimeout> | null = null

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  window.dispatchEvent(new Event(AUTH_STATE_EVENT))
  scheduleTokenRefresh(accessToken)
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? ''
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? ''
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_STATE_EVENT))
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
}

export function onAuthStateChanged(handler: () => void) {
  window.addEventListener(AUTH_STATE_EVENT, handler)
  return () => window.removeEventListener(AUTH_STATE_EVENT, handler)
}

function decodeBase64Url(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  try {
    return atob(padded)
  } catch {
    return ''
  }
}

export function getTokenExpiration(token: string): number | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const decoded = decodeBase64Url(parts[1])
  if (!decoded) return null
  try {
    const payload = JSON.parse(decoded) as TokenPayload
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token)
  if (!expiration) return true
  return Date.now() >= expiration
}

export function isTokenExpiringSoon(token: string): boolean {
  const expiration = getTokenExpiration(token)
  if (!expiration) return true
  return Date.now() >= expiration - TOKEN_REFRESH_BUFFER
}

export function getRolesFromToken(token: string) {
  if (!token) return []
  const parts = token.split('.')
  if (parts.length !== 3) return []
  const decoded = decodeBase64Url(parts[1])
  if (!decoded) return []
  try {
    const payload = JSON.parse(decoded) as TokenPayload
    return payload.realm_access?.roles ?? []
  } catch {
    return []
  }
}

/**
 * Filter out Keycloak system roles and return only business roles
 * System roles to exclude: 'default-roles-smartsite-realm', 'offline_access', 'uma_authorization'
 * Normalizes roles to uppercase for consistent comparison
 * @param roles - Array of roles from token
 * @returns Filtered array containing only business roles in uppercase
 */
export function getBusinessRoles(roles: string[]): string[] {
  const systemRoles = ['default-roles-smartsite-realm', 'offline_access', 'uma_authorization']
  return roles
    .filter(role => !systemRoles.includes(role.toLowerCase()))
    .map(role => role.toUpperCase())
}

/**
 * Get username from access token
 */
export function getUsernameFromToken(token: string): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const decoded = decodeBase64Url(parts[1])
  if (!decoded) return null
  try {
    const payload = JSON.parse(decoded) as TokenPayload
    return payload.preferred_username || null
  } catch {
    return null
  }
}

/**
 * Get user subject (sub) from access token
 */
export function getSubjectFromToken(token: string): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const decoded = decodeBase64Url(parts[1])
  if (!decoded) return null
  try {
    const payload = JSON.parse(decoded) as TokenPayload
    return payload.sub || null
  } catch {
    return null
  }
}

/**
 * Schedule automatic token refresh before expiration
 */
export function scheduleTokenRefresh(accessToken: string) {
  // Clear existing timeout
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
  }

  const expiration = getTokenExpiration(accessToken)
  if (!expiration) return

  const timeUntilRefresh = expiration - Date.now() - TOKEN_REFRESH_BUFFER
  
  if (timeUntilRefresh > 0) {
    refreshTimeout = setTimeout(() => {
      refreshAccessToken().catch((error) => {
        console.error('Token refresh failed:', error)
      })
    }, timeUntilRefresh)
  }
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  
  if (!refreshToken) {
    console.warn('No refresh token available')
    return null
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      // If refresh fails, clear tokens and redirect to login
      clearTokens()
      window.location.href = '/login?session=expired'
      return null
    }

    const data = await response.json()
    
    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token || refreshToken)
      return data.access_token
    } else {
      clearTokens()
      window.location.href = '/login?session=expired'
      return null
    }
  } catch (error) {
    console.error('Failed to refresh token:', error)
    clearTokens()
    window.location.href = '/login?error=session'
    return null
  }
}

