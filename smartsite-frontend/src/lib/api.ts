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

export async function getMyAssignedCompany() {
  return apiFetch<{ data: { id: string; name: string } | null }>('/companies/my-assigned-company', {
    method: 'GET',
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

export async function unassignProjectManager(companyId: string, projectManagerId: string) {
  return apiFetch('/companies/' + companyId + '/unassign-project-manager/' + projectManagerId, {
    method: 'DELETE',
  })
}

export type ProjectStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_VALIDATION'
  | 'REJECTED'
  | 'APPROVED'
  | 'ACTIVE'

export type MilestoneStatus =
  | 'PLANNED'
  | 'SUBMITTED_FOR_CLIENT_VALIDATION'
  | 'APPROVED_BY_CLIENT'
  | 'REJECTED_BY_CLIENT'
  | 'RESUBMITTED_FOR_CLIENT_VALIDATION'

export type ProjectItem = {
  id: string
  companyId: string
  name: string
  code: string
  description?: string
  projectManagerId: string
  directorId?: string
  clientUserId?: string | null
  budgetPlanned: number
  budgetConsumed: number
  currency: string
  startDate: string
  endDate: string
  latestValidationComment?: string
  submittedAt?: string
  validatedAt?: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export type MilestoneItem = {
  id: string
  projectId: string
  companyId: string
  name: string
  description?: string
  plannedDate: string
  evidenceSummary?: string
  submittedAt?: string
  validatedAt?: string
  clientValidationComment?: string
  createdByPmId: string
  validatedByClientId?: string
  status: MilestoneStatus
  createdAt: string
  updatedAt: string
}

export async function createProject(data: {
  name: string
  code?: string
  description?: string
  budgetPlanned: number
  budgetConsumed?: number
  currency?: string
  startDate: string
  endDate: string
}) {
  return apiFetch<ProjectItem>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProject(projectId: string, data: {
  name?: string
  description?: string
  budgetPlanned?: number
  budgetConsumed?: number
  currency?: string
  startDate?: string
  endDate?: string
}) {
  return apiFetch<ProjectItem>('/projects/' + projectId, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function submitProject(projectId: string) {
  return apiFetch<ProjectItem>('/projects/' + projectId + '/submit', {
    method: 'POST',
  })
}

export async function resubmitProject(projectId: string) {
  return apiFetch<ProjectItem>('/projects/' + projectId + '/resubmit', {
    method: 'POST',
  })
}

export async function getMyProjects() {
  return apiFetch<ProjectItem[]>('/projects/my-projects', {
    method: 'GET',
  })
}

export async function getDirectorValidationQueue() {
  return apiFetch<ProjectItem[]>('/projects/director/validation-queue', {
    method: 'GET',
  })
}

export type DirectorProjectRisk = 'LOW' | 'MEDIUM' | 'HIGH'

export type DirectorProjectOverviewItem = {
  id: string
  name: string
  code: string
  status: 'APPROVED' | 'ACTIVE'
  projectManagerId: string
  projectManagerName: string
  projectManagerEmail: string
  clientUserId?: string | null
  clientName?: string | null
  clientEmail?: string | null
  budgetConsumptionPercent: number
  progressPercent: number
  risk: DirectorProjectRisk
  lastUpdatedAt: string
  budgetPlanned: number
  budgetConsumed: number
  currency: string
}

export async function getDirectorActiveProjectsOverview(params?: {
  page?: number
  pageSize?: number
  status?: 'APPROVED' | 'ACTIVE'
  risk?: DirectorProjectRisk
  search?: string
  sortBy?: 'lastUpdatedAt' | 'risk' | 'budgetConsumptionPercent'
  sortOrder?: 'asc' | 'desc'
}) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  if (params?.status) query.set('status', params.status)
  if (params?.risk) query.set('risk', params.risk)
  if (params?.search?.trim()) query.set('search', params.search.trim())
  if (params?.sortBy) query.set('sortBy', params.sortBy)
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder)

  const queryString = query.toString()
  return apiFetch<{
    data: DirectorProjectOverviewItem[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }>('/projects/director/active-overview' + (queryString ? `?${queryString}` : ''), {
    method: 'GET',
  })
}

export async function getDirectorProjectFinancialKpis(projectId: string) {
  return apiFetch<{
    projectId: string
    projectName: string
    currency: string
    plannedBudget: number
    consumedBudget: number
    burnRatePercent: number
    varianceAmount: number
    variancePercent: number
    status: string
    updatedAt: string
  }>('/projects/director/' + projectId + '/financial-kpis', {
    method: 'GET',
  })
}

export type DirectorClientItem = {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
}

export async function getDirectorAvailableClients() {
  return apiFetch<DirectorClientItem[]>('/projects/director/clients/available', {
    method: 'GET',
  })
}

export async function assignClientToProject(projectId: string, clientUserId: string) {
  return apiFetch<ProjectItem>('/projects/director/' + projectId + '/assign-client', {
    method: 'POST',
    body: JSON.stringify({ clientUserId }),
  })
}

export async function validateProject(projectId: string, data: { decision: 'APPROVE' | 'REJECT'; comment?: string }) {
  return apiFetch<ProjectItem>('/projects/director/' + projectId + '/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function startProject(projectId: string) {
  return apiFetch<ProjectItem>('/projects/director/' + projectId + '/start', {
    method: 'POST',
  })
}

export async function getProjectFeedback(projectId: string) {
  return apiFetch<{
    project: ProjectItem
    latestValidationComment?: string
    history: Array<{
      id: string
      action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RESUBMIT'
      actorUserId: string
      actorRole: string
      comment?: string
      createdAt: string
    }>
  }>('/projects/' + projectId + '/feedback', {
    method: 'GET',
  })
}

export async function createMilestone(projectId: string, data: {
  name: string
  description?: string
  plannedDate: string
}) {
  return apiFetch<MilestoneItem>('/projects/' + projectId + '/milestones', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getProjectMilestones(projectId: string) {
  return apiFetch<MilestoneItem[]>('/projects/' + projectId + '/milestones', {
    method: 'GET',
  })
}

export async function submitMilestone(milestoneId: string, data?: { evidenceSummary?: string }) {
  return apiFetch<MilestoneItem>('/projects/milestones/' + milestoneId + '/submit', {
    method: 'POST',
    body: JSON.stringify(data || {}),
  })
}

export async function resubmitMilestone(milestoneId: string, data?: { evidenceSummary?: string }) {
  return apiFetch<MilestoneItem>('/projects/milestones/' + milestoneId + '/resubmit', {
    method: 'POST',
    body: JSON.stringify(data || {}),
  })
}

export async function getClientProjects() {
  return apiFetch<ProjectItem[]>('/projects/client/projects', {
    method: 'GET',
  })
}

export async function getClientMilestoneValidationQueue() {
  return apiFetch<MilestoneItem[]>('/projects/client/milestones/validation-queue', {
    method: 'GET',
  })
}

export async function validateMilestoneByClient(
  milestoneId: string,
  data: { decision: 'APPROVE' | 'REJECT'; comment?: string },
) {
  return apiFetch<MilestoneItem>('/projects/client/milestones/' + milestoneId + '/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
