type TokenPayload = {
  realm_access?: { roles?: string[] }
}

const ACCESS_TOKEN_KEY = 'smartsite_access_token'
const REFRESH_TOKEN_KEY = 'smartsite_refresh_token'

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
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
