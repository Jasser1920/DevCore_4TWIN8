import { getAccessToken, refreshAccessToken, isTokenExpiringSoon, getRefreshToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function resolveApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

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

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
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
  qhseManagerId?: string | null
  budgetPlanned: number
  budgetConsumed: number
  currency: string
  startDate: string
  endDate: string
  latitude?: number | null
  longitude?: number | null
  siteAddress?: string | null
  latestValidationComment?: string
  submittedAt?: string
  validatedAt?: string
  siteImages?: Array<{
    url: string
    reportId: string
    reportStatus: QhseReportStatus
    submittedAt?: string | null
  }>
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
  evidenceAttachments?: string[]
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
  latitude: number
  longitude: number
  siteAddress?: string
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
  latitude?: number
  longitude?: number
  siteAddress?: string
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
  qhseManagerId?: string | null
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

export type DirectorConstructionSiteItem = {
  id: string
  name: string
  code: string
  status: ProjectStatus
  latitude: number
  longitude: number
  siteAddress: string
  projectManagerId: string
  projectManagerName: string
  projectManagerEmail: string
  updatedAt: string
}

export async function getDirectorConstructionSitesMap(projectManagerId?: string) {
  const query = new URLSearchParams()
  if (projectManagerId) query.set('projectManagerId', projectManagerId)

  const queryString = query.toString()
  return apiFetch<{
    filters: {
      selectedProjectManagerId: string | null
      projectManagers: Array<{ id: string; name: string; email: string }>
    }
    data: DirectorConstructionSiteItem[]
  }>('/projects/director/construction-sites-map' + (queryString ? `?${queryString}` : ''), {
    method: 'GET',
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
  evidenceAttachments?: string[]
  predecessorId?: string
}) {
  return apiFetch<MilestoneItem>(`/projects/${projectId}/milestones`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getProjectPlanningAnalysis(projectId: string) {
  return apiFetch<{
    projectId: string
    projectName: string
    tasks: Array<{
      id: string
      name: string
      plannedDate: string
      slackDays: number
      isCritical: boolean
      predecessorId?: string
    }>
    criticalPathIds: string[]
  }>(`/projects/${projectId}/planning-analysis`)
}

export async function getProjectPlanningAiAudit(projectId: string) {
  return apiFetch<{ recommendation: string }>(`/projects/${projectId}/planning-ai-audit`)
}

export async function uploadMilestoneAttachments(files: File[]) {
  if (!files.length) return [] as string[]

  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  return apiFetch<{ data: string[] }>('/projects/milestones/uploads', {
    method: 'POST',
    body: formData,
  }).then((response) => response.data)
}

export async function getProjectMilestones(projectId: string) {
  return apiFetch<MilestoneItem[]>('/projects/' + projectId + '/milestones', {
    method: 'GET',
  })
}

export async function submitMilestone(milestoneId: string, data?: { evidenceSummary?: string; evidenceAttachments?: string[] }) {
  return apiFetch<MilestoneItem>('/projects/milestones/' + milestoneId + '/submit', {
    method: 'POST',
    body: JSON.stringify(data || {}),
  })
}

export async function resubmitMilestone(milestoneId: string, data?: { evidenceSummary?: string; evidenceAttachments?: string[] }) {
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

export type QhseReportStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'ACCEPTED'
export type QhseCorrectiveActionPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type QhseCorrectiveActionStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'

export type DirectorQhseManagerItem = {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
}

export type QhseSiteReportItem = {
  id: string
  projectId: string
  companyId: string
  submittedByPmId: string
  assignedQhseManagerId: string
  summary: string
  attachments: string[]
  status: QhseReportStatus
  qhseComment?: string
  submittedAt?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  project?: ProjectItem
}

export type QhseCorrectiveActionItem = {
  id: string
  reportId: string
  projectId: string
  companyId: string
  assignedQhseManagerId: string
  findingId: string
  title: string
  owner: string
  dueDate: string
  priority: QhseCorrectiveActionPriority
  status: QhseCorrectiveActionStatus
  sourceSeverity: 'LOW' | 'MEDIUM' | 'HIGH'
  escalated: boolean
  escalationReason?: string
  escalatedAt?: string
  createdAt: string
  updatedAt: string
}

export async function getDirectorAvailableQhseManagers() {
  return apiFetch<DirectorQhseManagerItem[]>('/projects/director/qhse-managers/available', {
    method: 'GET',
  })
}

export async function assignQhseToProject(projectId: string, qhseManagerId: string) {
  return apiFetch<ProjectItem>('/projects/director/' + projectId + '/assign-qhse', {
    method: 'POST',
    body: JSON.stringify({ qhseManagerId }),
  })
}

export async function submitQhseSiteReport(projectId: string, data: { summary: string; attachments?: string[] }) {
  return apiFetch<QhseSiteReportItem>('/projects/pm/' + projectId + '/qhse-reports', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getQhseAssignedSites() {
  return apiFetch<ProjectItem[]>('/projects/qhse/assigned-sites', {
    method: 'GET',
  })
}

export async function analyzeQhseImage(attachmentUrl: string) {
  return apiFetch<{
    attachmentUrl: string
    reportId: string
    project: {
      id: string
      name: string
      code: string
    }
    analysis: {
      persons: number
      helmets: number
      vests: number
      no_helmet: number
      no_vest: number
      ppe_compliance_percent: number
    }
  }>('/projects/qhse/analyze-image', {
    method: 'POST',
    body: JSON.stringify({ attachmentUrl }),
  })
}

export async function analyzeQhseSiteAverage(projectId: string) {
  return apiFetch<{
    project: {
      id: string
      name: string
      code: string
    }
    imageCount: number
    analysis: {
      persons: number
      helmets: number
      vests: number
      no_helmet: number
      no_vest: number
      ppe_compliance_percent: number
    }
    analyzedImages: string[]
  }>('/projects/qhse/analyze-site-average', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  })
}

export async function sendQhseSiteSafetyReport(projectId: string) {
  return apiFetch<{
    success: boolean
    director: {
      id: string
      name: string
      email: string
    }
    project: {
      id: string
      name: string
      code: string
    }
    report: {
      complianceScore: number
      imageCount: number
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
      summary: string
      recommendations: string[]
    }
    message: string
  }>('/projects/qhse/send-safety-report', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  })
}

export async function previewQhseSiteSafetyReport(projectId: string) {
  return apiFetch<{
    director: {
      id: string
      name: string
      email: string
    }
    project: {
      id: string
      name: string
      code: string
    }
    report: {
      complianceScore: number
      imageCount: number
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
      summary: string
      recommendations: string[]
    }
  }>('/projects/qhse/preview-safety-report', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  })
}

export async function getQhseReportQueue() {
  return apiFetch<QhseSiteReportItem[]>('/projects/qhse/reports/queue', {
    method: 'GET',
  })
}

export async function reviewQhseReport(
  reportId: string,
  data: { decision: 'ACCEPT' | 'REQUEST_CORRECTION'; comment?: string },
) {
  return apiFetch<QhseSiteReportItem>('/projects/qhse/reports/' + reportId + '/review', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getQhseCorrectiveActions(reportId: string) {
  return apiFetch<QhseCorrectiveActionItem[]>('/projects/qhse/reports/' + reportId + '/actions', {
    method: 'GET',
  })
}

export async function createQhseCorrectiveActions(
  reportId: string,
  data: {
    actions: Array<{
      findingId: string
      title: string
      owner?: string
      dueDate: string
      priority: QhseCorrectiveActionPriority
      sourceSeverity: 'LOW' | 'MEDIUM' | 'HIGH'
    }>
  },
) {
  return apiFetch<QhseCorrectiveActionItem[]>('/projects/qhse/reports/' + reportId + '/actions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateQhseCorrectiveAction(
  actionId: string,
  data: {
    title?: string
    owner?: string
    dueDate?: string
    priority?: QhseCorrectiveActionPriority
    status?: QhseCorrectiveActionStatus
  },
) {
  return apiFetch<QhseCorrectiveActionItem>('/projects/qhse/actions/' + actionId, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function runQhseEscalationPolicy(reportId?: string) {
  return apiFetch<{
    totalCandidates: number
    escalatedCount: number
    reportId: string | null
    escalatedActionIds: string[]
  }>('/projects/qhse/actions/escalations/run', {
    method: 'POST',
    body: JSON.stringify({ reportId }),
  })
}

export type NotificationRole = 'SUPER_ADMIN' | 'DIRECTOR' | 'PROJECT_MANAGER' | 'CLIENT'

export type MilestoneDecisionHistoryItem = {
  _id: string
  action: 'MILESTONE_APPROVED_BY_CLIENT' | 'MILESTONE_REJECTED_BY_CLIENT'
  description?: string
  details?: {
    decision?: 'APPROVE' | 'REJECT'
    comment?: string
    milestoneId?: string
  }
  timestamp: string
  username?: string
}

export type NotificationItem = {
  id: string
  recipientRole: NotificationRole
  title: string
  message: string
  action: string
  metadata?: Record<string, any>
  isRead: boolean
  readAt?: string
  createdAt: string
  updatedAt: string
}

export async function getMyNotifications(params?: {
  page?: number
  limit?: number
  unreadOnly?: boolean
}) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (typeof params?.unreadOnly === 'boolean') query.set('unreadOnly', String(params.unreadOnly))

  const queryString = query.toString()
  return apiFetch<{
    items: NotificationItem[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>('/notifications/me' + (queryString ? `?${queryString}` : ''), {
    method: 'GET',
  })
}

export async function getMyUnreadNotificationCount() {
  return apiFetch<{ unread: number }>('/notifications/unread-count', {
    method: 'GET',
  })
}

export async function markNotificationAsRead(notificationId: string) {
  return apiFetch<{ message: string; item: NotificationItem }>('/notifications/' + notificationId + '/read', {
    method: 'PATCH',
  })
}

export async function markAllNotificationsAsRead() {
  return apiFetch<{ message: string }>('/notifications/read-all', {
    method: 'POST',
  })
}

export async function getClientMilestoneDecisionHistory(milestoneId: string, limit = 20) {
  return apiFetch<MilestoneDecisionHistoryItem[]>(
    '/projects/client/milestones/' + milestoneId + '/decision-history?limit=' + String(limit),
    {
      method: 'GET',
    },
  )
}
