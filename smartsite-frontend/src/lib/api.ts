import { getAccessToken, refreshAccessToken, isTokenExpiringSoon, getRefreshToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  let token = getAccessToken()

  // Check if token is expiring soon and refresh if needed
  if (token && isTokenExpiringSoon(token)) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      token = newToken
    }
  }

  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  // If we get a 401, try to refresh the token and retry once
  if (response.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      })
    }
  }

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    let message = 'Request failed'
    
    if (typeof payload === 'string') {
      message = payload
    } else if (payload?.message) {
      message = payload.message
    } else if (payload?.error) {
      message = payload.error
    }
    
    throw new Error(message)
  }

  return payload as T
}

// Strategic Vision API calls
export async function createStrategicVision(companyId: string, data: {
  projectBudget: number
  startDate: string
  endDate: string
  globalKPIs: Array<{ name: string; target: number; unit: string }>
}) {
  return apiFetch('/strategic-vision/' + companyId, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getStrategicVision(companyId: string) {
  return apiFetch('/strategic-vision/' + companyId, {
    method: 'GET',
  })
}

export async function updateStrategicVision(visionId: string, data: {
  projectBudget?: number
  startDate?: string
  endDate?: string
  globalKPIs?: Array<{ name: string; target: number; unit: string }>
}) {
  return apiFetch('/strategic-vision/' + visionId, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function validateStrategicVision(visionId: string, data: {
  status: 'APPROVED' | 'REJECTED'
  validationNotes: string
}) {
  return apiFetch('/strategic-vision/' + visionId + '/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Project Manager API calls
export async function getAvailableProjectManagers() {
  return apiFetch<{ data: any[]; count: number }>('/companies/project-managers/available', {
    method: 'GET',
  })
}

export async function assignProjectManager(companyId: string, projectManagerId: string) {
  return apiFetch('/companies/' + companyId + '/assign-project-manager', {
    method: 'POST',
    body: JSON.stringify({ projectManagerId }),
  })
}
