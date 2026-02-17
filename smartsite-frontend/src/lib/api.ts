import { getAccessToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = getAccessToken()
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message
    throw new Error(message || 'Request failed')
  }

  return payload as T
}
