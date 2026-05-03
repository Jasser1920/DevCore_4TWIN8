import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  apiFetch,
  getClientMilestoneDecisionHistory,
  getClientMilestoneValidationQueue,
  getClientProjects,
  getProjectMilestones,
  type MilestoneDecisionHistoryItem,
  resolveApiUrl,
  type MilestoneItem,
  validateMilestoneByClient,
} from '../lib/api'
import { clearTokens, getAccessToken, getRefreshToken, getRolesFromToken, getBusinessRoles } from '../lib/auth'
import { getSubjectFromToken } from '../lib/auth'
import { useResponsive } from '../hooks/useResponsive'
import { useAccessibility } from '../contexts/AccessibilityContext'
import LoadingPage from '../components/LoadingPage'
import Sidebar from '../components/shared/Sidebar'
import AccessibilitySettingsPanel from '../components/shared/AccessibilitySettingsPanel'
import GuidedTourOverlay from '../components/shared/GuidedTourOverlay'
import FloatingTutorialButton from '../components/shared/FloatingTutorialButton'
import NotificationsPanel from '../components/NotificationsPanel'
import logoIcon from '../assets/logo smartsite.svg'

type DecisionState = {
  milestone: MilestoneItem
  decision: 'APPROVE' | 'REJECT'
}

const LayoutDashboard = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
  </svg>
)

const Settings = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const Bell = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const ClipboardCheck = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

export default function Client() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { isMobile, isTablet } = useResponsive()
  const { settings } = useAccessibility()
  const roles = getBusinessRoles(getRolesFromToken(getAccessToken()))
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [decisionState, setDecisionState] = useState<DecisionState | null>(null)
  const [comment, setComment] = useState('')
  const [showGuidedTour, setShowGuidedTour] = useState(false)
  const [requestSearch, setRequestSearch] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'RESUBMITTED'>('ALL')
  const [requestSortBy, setRequestSortBy] = useState<'SUBMITTED_ASC' | 'SUBMITTED_DESC' | 'PLANNED_ASC' | 'PLANNED_DESC'>('SUBMITTED_ASC')
  const [allMilestoneStatusFilter, setAllMilestoneStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PLANNED'>('ALL')
  const [openDecisionHistoryMilestoneIds, setOpenDecisionHistoryMilestoneIds] = useState<string[]>([])
  const [highlightedMilestoneId, setHighlightedMilestoneId] = useState<string | null>(null)
  const milestoneScrollTimerRef = useRef<number | null>(null)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'milestone-requests', label: 'Request', icon: ClipboardCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  const guidedTourSteps = [
    {
      selector: '[data-tour="client-header"]',
      title: 'Client Home',
      description: 'This page is your read-only overview with validation responsibilities.',
    },
    {
      selector: '[data-tour="client-projects"]',
      title: 'Linked Projects',
      description: 'Review all projects linked to your company and track their status.',
    },
    {
      selector: '[data-tour="client-milestones"]',
      title: 'Milestone Validation Queue',
      description: 'Validate milestones by approving or rejecting with clear comments.',
    },
    {
      selector: '[data-tour="client-milestone-approve"]',
      title: 'Approve Milestone',
      description: 'Use Approve when evidence is complete and acceptable.',
    },
  ]

  useEffect(() => {
    if (!settings.guidedTipsEnabled) return

    const token = getAccessToken()
    const subject = getSubjectFromToken(token) || 'anonymous'
    const markerKey = `guided-tour-shown:${subject}:CLIENT:main`

    if (!sessionStorage.getItem(markerKey)) {
      setShowGuidedTour(true)
      sessionStorage.setItem(markerKey, 'true')
    }
  }, [settings.guidedTipsEnabled])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const view = params.get('view')

    if (!view) return

    const isValid = navItems.some((item) => item.id === view)
    if (isValid) {
      setCurrentPage(view)
    }
  }, [location.search])

  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId)
  }

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return
      await Promise.race([
        apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }),
        new Promise((_, reject) =>
          window.setTimeout(() => reject(new Error('Logout request timed out')), 5000),
        ),
      ])
    },
    onSettled: () => {
      clearTokens()
      navigate('/login', { replace: true })
      window.setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.replace('/login')
        }
      }, 50)
    },
  })

  const projectsQuery = useQuery({
    queryKey: ['client-projects'],
    queryFn: getClientProjects,
  })

  const milestoneQueueQuery = useQuery({
    queryKey: ['client-milestone-validation-queue'],
    queryFn: getClientMilestoneValidationQueue,
  })

  const allMilestonesQuery = useQuery({
    queryKey: [
      'client-all-milestones',
      (projectsQuery.data || [])
        .map((project) => project.id)
        .sort()
        .join(','),
    ],
    enabled: (projectsQuery.data || []).length > 0,
    queryFn: async () => {
      const projects = projectsQuery.data || []
      const groupedMilestones = await Promise.all(
        projects.map(async (project) => {
          try {
            return await getProjectMilestones(project.id)
          } catch {
            return [] as MilestoneItem[]
          }
        }),
      )

      return groupedMilestones.flat()
    },
  })

  const milestoneStatsQuery = useQuery({
    queryKey: [
      'client-milestone-stats',
      (projectsQuery.data || [])
        .map((project) => project.id)
        .sort()
        .join(','),
    ],
    enabled: (projectsQuery.data || []).length > 0,
    queryFn: async () => {
      const projects = projectsQuery.data || []
      const groupedMilestones = await Promise.all(
        projects.map(async (project) => {
          try {
            return await getProjectMilestones(project.id)
          } catch {
            return [] as MilestoneItem[]
          }
        }),
      )

      const allMilestones = groupedMilestones.flat()
      const accepted = allMilestones.filter((milestone) => milestone.status === 'APPROVED_BY_CLIENT').length
      const rejected = allMilestones.filter((milestone) => milestone.status === 'REJECTED_BY_CLIENT').length

      return { accepted, rejected }
    },
  })

  const validationMutation = useMutation({
    mutationFn: async () => {
      if (!decisionState) return
      return validateMilestoneByClient(decisionState.milestone.id, {
        decision: decisionState.decision,
        comment: comment.trim() || undefined,
      })
    },
    onSuccess: () => {
      setDecisionState(null)
      setComment('')
      queryClient.invalidateQueries({ queryKey: ['client-milestone-validation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['client-projects'] })
      queryClient.invalidateQueries({ queryKey: ['client-milestone-stats'] })
      queryClient.invalidateQueries({ queryKey: ['client-all-milestones'] })
    },
  })

  const projects = projectsQuery.data || []
  const milestones = milestoneQueueQuery.data || []
  const milestoneStats = milestoneStatsQuery.data || { accepted: 0, rejected: 0 }

  const metrics = useMemo(() => {
    const total = projects.length
    const active = projects.filter((project) => project.status === 'ACTIVE').length
    const approved = projects.filter((project) => project.status === 'APPROVED').length
    const submitted = projects.filter((project) => project.status === 'SUBMITTED_FOR_VALIDATION').length
    const totalBudget = projects.reduce((sum, project) => sum + Number(project.budgetPlanned || 0), 0)

    return { total, active, approved, submitted, totalBudget }
  }, [projects])

  const projectNameById = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project.name]))
  }, [projects])

  const projectById = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project]))
  }, [projects])

  const filteredMilestones = useMemo(() => {
    const search = requestSearch.trim().toLowerCase()
    const filtered = milestones.filter((milestone) => {
      const statusMatch =
        requestStatusFilter === 'ALL' ||
        (requestStatusFilter === 'SUBMITTED' && milestone.status === 'SUBMITTED_FOR_CLIENT_VALIDATION') ||
        (requestStatusFilter === 'RESUBMITTED' && milestone.status === 'RESUBMITTED_FOR_CLIENT_VALIDATION')

      const projectName = projectNameById.get(milestone.projectId) || ''
      const searchMatch =
        search.length === 0 ||
        milestone.name.toLowerCase().includes(search) ||
        (milestone.evidenceSummary || '').toLowerCase().includes(search) ||
        projectName.toLowerCase().includes(search)

      return statusMatch && searchMatch
    })

    const toTime = (value?: string) => {
      if (!value) return 0
      const time = new Date(value).getTime()
      return Number.isFinite(time) ? time : 0
    }

    filtered.sort((a, b) => {
      if (requestSortBy === 'SUBMITTED_ASC') {
        return toTime(a.submittedAt || a.createdAt) - toTime(b.submittedAt || b.createdAt)
      }
      if (requestSortBy === 'SUBMITTED_DESC') {
        return toTime(b.submittedAt || b.createdAt) - toTime(a.submittedAt || a.createdAt)
      }
      if (requestSortBy === 'PLANNED_ASC') {
        return toTime(a.plannedDate) - toTime(b.plannedDate)
      }
      return toTime(b.plannedDate) - toTime(a.plannedDate)
    })

    return filtered
  }, [milestones, requestSearch, requestStatusFilter, requestSortBy, projectNameById])

  const milestoneRequestCounts = useMemo(() => {
    const submitted = milestones.filter((milestone) => milestone.status === 'SUBMITTED_FOR_CLIENT_VALIDATION').length
    const resubmitted = milestones.filter((milestone) => milestone.status === 'RESUBMITTED_FOR_CLIENT_VALIDATION').length
    return {
      all: milestones.length,
      submitted,
      resubmitted,
    }
  }, [milestones])

  const allMilestones = allMilestonesQuery.data || []

  const pendingRequestHighlights = useMemo(() => {
    return [...filteredMilestones]
      .sort((a, b) => {
        const aTime = new Date(a.submittedAt || a.createdAt).getTime()
        const bTime = new Date(b.submittedAt || b.createdAt).getTime()
        return bTime - aTime
      })
      .slice(0, 3)
  }, [filteredMilestones])

  const requestPanelBadgeCount = highlightedMilestoneId ? 1 : 0

  const focusMilestoneInList = (milestoneId: string) => {
    setCurrentPage('milestone-requests')
    setHighlightedMilestoneId(milestoneId)
  }

  const clearMilestoneFocus = () => {
    setHighlightedMilestoneId(null)
    window.requestAnimationFrame(() => {
      const requestPanel = document.querySelector('[data-tour="client-milestones"]') as HTMLElement | null
      requestPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    if (!highlightedMilestoneId) return

    if (milestoneScrollTimerRef.current) {
      window.clearTimeout(milestoneScrollTimerRef.current)
    }

    milestoneScrollTimerRef.current = window.setTimeout(() => {
      const element = document.getElementById(`milestone-card-${highlightedMilestoneId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 50)

    const resetTimer = window.setTimeout(() => {
      setHighlightedMilestoneId(null)
    }, 2500)

    return () => {
      window.clearTimeout(milestoneScrollTimerRef.current || undefined)
      window.clearTimeout(resetTimer)
    }
  }, [highlightedMilestoneId])

  const filteredAllMilestones = useMemo(() => {
    const search = requestSearch.trim().toLowerCase()
    const filterMatches = (milestone: MilestoneItem) => {
      if (allMilestoneStatusFilter === 'ALL') return true
      if (allMilestoneStatusFilter === 'PENDING') {
        return (
          milestone.status === 'SUBMITTED_FOR_CLIENT_VALIDATION' ||
          milestone.status === 'RESUBMITTED_FOR_CLIENT_VALIDATION'
        )
      }
      if (allMilestoneStatusFilter === 'APPROVED') return milestone.status === 'APPROVED_BY_CLIENT'
      if (allMilestoneStatusFilter === 'REJECTED') return milestone.status === 'REJECTED_BY_CLIENT'
      return milestone.status === 'PLANNED'
    }

    const list = allMilestones.filter((milestone) => {
      if (!filterMatches(milestone)) return false
      const projectName = projectNameById.get(milestone.projectId) || ''
      if (!search.length) return true
      return (
        milestone.name.toLowerCase().includes(search) ||
        (milestone.evidenceSummary || '').toLowerCase().includes(search) ||
        projectName.toLowerCase().includes(search)
      )
    })

    const toTime = (value?: string) => {
      if (!value) return 0
      const time = new Date(value).getTime()
      return Number.isFinite(time) ? time : 0
    }

    list.sort((a, b) => {
      if (requestSortBy === 'SUBMITTED_ASC') {
        return toTime(a.submittedAt || a.createdAt) - toTime(b.submittedAt || b.createdAt)
      }
      if (requestSortBy === 'SUBMITTED_DESC') {
        return toTime(b.submittedAt || b.createdAt) - toTime(a.submittedAt || a.createdAt)
      }
      if (requestSortBy === 'PLANNED_ASC') {
        return toTime(a.plannedDate) - toTime(b.plannedDate)
      }
      return toTime(b.plannedDate) - toTime(a.plannedDate)
    })

    return list
  }, [allMilestones, allMilestoneStatusFilter, projectNameById, requestSearch, requestSortBy])

  const canConfirm =
    !!decisionState &&
    (decisionState.decision === 'APPROVE' || comment.trim().length > 0) &&
    !validationMutation.isPending

  return (
    <>
      <LoadingPage isVisible={logoutMutation.isPending} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
        }}
      >
        <Sidebar
          navItems={navItems}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          userName="Client"
          userRole="Client"
          businessRoles={roles}
          onLogout={() => logoutMutation.mutate()}
          onProfileClick={() => navigate('/profile')}
          isMobile={isMobile || isTablet}
          isLoggingOut={logoutMutation.isPending}
        />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: isMobile ? 'auto' : '100vh',
            paddingTop: isMobile || isTablet ? '64px' : 0,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '16px' : isTablet ? '24px' : '32px',
            }}
          >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              {currentPage === 'dashboard' && (
                <>
          <div
            data-tour="client-header"
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src={logoIcon} alt="SmartSite" style={{ height: isMobile ? '40px' : '48px', width: 'auto' }} />
              <h1
                style={{
                  fontSize: isMobile ? '24px' : '28px',
                  fontWeight: '600',
                  color: '#075B7A',
                  margin: 0,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Client Portal
              </h1>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <MetricCard title="Total Projects" value={metrics.total} />
            <MetricCard title="Active" value={metrics.active} />
            <MetricCard title="Approved" value={metrics.approved} />
            <MetricCard title="Submitted" value={metrics.submitted} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <MetricCard
              title="Milestones Accepted"
              value={milestoneStats.accepted}
              subtitle={milestoneStatsQuery.isLoading ? 'Loading milestone stats...' : 'Accepted by client'}
            />
            <MetricCard
              title="Milestones Rejected"
              value={milestoneStats.rejected}
              subtitle={milestoneStatsQuery.isLoading ? 'Loading milestone stats...' : 'Rejected by client'}
            />
            <MetricCard title="Pending Requests" value={milestones.length} subtitle="Awaiting your validation" />
          </div>

          <div
            data-tour="client-milestones"
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 10px 0' }}>
              Linked Company Projects
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280' }}>
              Total planned budget: <strong>${metrics.totalBudget.toLocaleString()}</strong>
            </p>

            {projectsQuery.isLoading && <p style={{ margin: 0, color: '#6b7280' }}>Loading projects...</p>}
            {projectsQuery.isError && (
              <p style={{ margin: 0, color: '#b91c1c' }}>{(projectsQuery.error as Error).message}</p>
            )}
            {!projectsQuery.isLoading && !projectsQuery.isError && projects.length === 0 && (
              <p style={{ margin: 0, color: '#6b7280' }}>No projects linked to your client company yet.</p>
            )}

            {projects.length > 0 && (
              <div style={{ display: 'grid', gap: '10px' }}>
                {projects.map((project) => (
                  <div key={project.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <strong>{project.name}</strong>
                      <StatusBadge status={project.status} audience="client" />
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {project.code} | {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </div>

                    {project.description ? (
                      <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '8px', lineHeight: '1.4' }}>
                        {project.description}
                      </div>
                    ) : null}

                    <div
                      style={{
                        marginTop: '10px',
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                        gap: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ backgroundColor: '#f8fafc', borderRadius: '6px', padding: '8px' }}>
                        <div style={{ color: '#64748b' }}>Planned Budget</div>
                        <div style={{ color: '#0f172a', fontWeight: 600 }}>
                          {(project.currency || 'USD')} {Number(project.budgetPlanned || 0).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', borderRadius: '6px', padding: '8px' }}>
                        <div style={{ color: '#64748b' }}>Consumed Budget</div>
                        <div style={{ color: '#0f172a', fontWeight: 600 }}>
                          {(project.currency || 'USD')} {Number(project.budgetConsumed || 0).toLocaleString()}
                        </div>
                        <div style={{ color: '#64748b' }}>
                          {Number(project.budgetPlanned || 0) > 0
                            ? `${((Number(project.budgetConsumed || 0) / Number(project.budgetPlanned || 1)) * 100).toFixed(1)}% consumed`
                            : 'No planned budget set'}
                        </div>
                      </div>
                    </div>

                    {project.siteAddress ? (
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>
                        Site: {project.siteAddress}
                      </div>
                    ) : null}

                    {project.latestValidationComment ? (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '8px',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          fontSize: '12px',
                          color: '#334155',
                        }}
                      >
                        Latest validation note: {project.latestValidationComment}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

                </>
              )}

              {currentPage === 'milestone-requests' && (
                <div
                  data-tour="client-milestones"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <h2
                    style={{
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#075B7A',
                      margin: '0 0 8px 0',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    Request
                  </h2>
                  <p style={{ margin: '0 0 14px 0', color: '#6b7280' }}>
                    Review request milestones and track all milestone decisions in one place.
                  </p>

                  <div
                    style={{
                      border: '1px solid #bae6fd',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0c4a6e' }}>
                        Milestone Request Panel
                      </div>
                      {requestPanelBadgeCount > 0 ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '20px',
                            height: '20px',
                            padding: '0 6px',
                            borderRadius: '999px',
                            backgroundColor: '#0e7490',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 700,
                            lineHeight: 1,
                          }}
                          title="A milestone is currently highlighted"
                        >
                          {requestPanelBadgeCount}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: '12px', color: '#0f172a', marginBottom: '8px' }}>
                      You have <strong>{milestoneRequestCounts.all}</strong> pending milestone request(s).
                    </div>
                    {pendingRequestHighlights.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#475569' }}>No pending requests right now.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {pendingRequestHighlights.map((milestone) => (
                          <div
                            key={milestone.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => focusMilestoneInList(milestone.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                focusMilestoneInList(milestone.id)
                              }
                            }}
                            style={{
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              backgroundColor: 'white',
                              padding: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '8px',
                              flexWrap: 'wrap',
                              cursor: 'pointer',
                            }}
                            title="Jump to this milestone"
                          >
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{milestone.name}</div>
                              <div style={{ fontSize: '11px', color: '#475569' }}>
                                {projectNameById.get(milestone.projectId) || 'Unknown project'} |{' '}
                                {milestone.submittedAt ? new Date(milestone.submittedAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                            <StatusBadge status={milestone.status} audience="client" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {[
                      { key: 'ALL', label: 'All', count: milestoneRequestCounts.all },
                      { key: 'SUBMITTED', label: 'Submitted', count: milestoneRequestCounts.submitted },
                      { key: 'RESUBMITTED', label: 'Resubmitted', count: milestoneRequestCounts.resubmitted },
                    ].map((item) => {
                      const isActive = requestStatusFilter === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => setRequestStatusFilter(item.key as 'ALL' | 'SUBMITTED' | 'RESUBMITTED')}
                          style={{
                            border: isActive ? '1px solid #0e7490' : '1px solid #cbd5e1',
                            backgroundColor: isActive ? '#ecfeff' : 'white',
                            color: isActive ? '#0e7490' : '#334155',
                            borderRadius: '999px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {item.label} ({item.count})
                        </button>
                      )
                    })}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      flexWrap: 'wrap',
                      marginBottom: '14px',
                    }}
                  >
                    <input
                      type="text"
                      value={requestSearch}
                      onChange={(event) => setRequestSearch(event.target.value)}
                      placeholder="Search by milestone, project, or evidence"
                      style={{
                        flex: isMobile ? '1 1 100%' : '1 1 320px',
                        minWidth: isMobile ? '100%' : '260px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '9px 11px',
                        fontSize: '13px',
                      }}
                    />
                    <select
                      value={requestStatusFilter}
                      onChange={(event) => setRequestStatusFilter(event.target.value as 'ALL' | 'SUBMITTED' | 'RESUBMITTED')}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '9px 11px',
                        fontSize: '13px',
                        backgroundColor: 'white',
                        minWidth: isMobile ? '100%' : '220px',
                      }}
                    >
                      <option value="ALL">All pending requests</option>
                      <option value="SUBMITTED">First submissions</option>
                      <option value="RESUBMITTED">Resubmissions</option>
                    </select>
                    <select
                      value={requestSortBy}
                      onChange={(event) =>
                        setRequestSortBy(
                          event.target.value as 'SUBMITTED_ASC' | 'SUBMITTED_DESC' | 'PLANNED_ASC' | 'PLANNED_DESC',
                        )
                      }
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '9px 11px',
                        fontSize: '13px',
                        backgroundColor: 'white',
                        minWidth: isMobile ? '100%' : '220px',
                      }}
                    >
                      <option value="SUBMITTED_ASC">Sort: Oldest submitted</option>
                      <option value="SUBMITTED_DESC">Sort: Newest submitted</option>
                      <option value="PLANNED_ASC">Sort: Earliest planned date</option>
                      <option value="PLANNED_DESC">Sort: Latest planned date</option>
                    </select>
                  </div>

                  {milestoneQueueQuery.isLoading && <p style={{ margin: 0, color: '#6b7280' }}>Loading milestones...</p>}
                  {milestoneQueueQuery.isError && (
                    <p style={{ margin: 0, color: '#b91c1c' }}>{(milestoneQueueQuery.error as Error).message}</p>
                  )}
                  {!milestoneQueueQuery.isLoading && !milestoneQueueQuery.isError && filteredMilestones.length === 0 && (
                    <p style={{ margin: 0, color: '#6b7280' }}>No milestones waiting for your validation.</p>
                  )}

                  {filteredMilestones.length > 0 && (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {filteredMilestones.map((milestone, index) => (
                        <div key={milestone.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <strong>{milestone.name}</strong>
                            <StatusBadge status={milestone.status} audience="client" />
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Project: {projectNameById.get(milestone.projectId) || 'Unknown project'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Submitted: {milestone.submittedAt ? new Date(milestone.submittedAt).toLocaleDateString() : 'N/A'}
                          </div>
                          {(() => {
                            const pendingDays = getPendingDays(milestone.submittedAt || milestone.createdAt)
                            if (pendingDays < 0) return null
                            const isUrgent = pendingDays >= 7
                            return (
                              <div
                                style={{
                                  marginTop: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  borderRadius: '999px',
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  backgroundColor: isUrgent ? '#fee2e2' : '#fef3c7',
                                  color: isUrgent ? '#991b1b' : '#92400e',
                                }}
                              >
                                {isUrgent ? `Overdue: ${pendingDays} days pending` : `Pending: ${pendingDays} days`}
                              </div>
                            )
                          })()}
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Planned: {new Date(milestone.plannedDate).toLocaleDateString()}
                          </div>
                          {projectById.get(milestone.projectId) ? (
                            <div
                              style={{
                                marginTop: '8px',
                                padding: '8px',
                                borderRadius: '6px',
                                backgroundColor: '#f8fafc',
                                fontSize: '12px',
                                color: '#334155',
                                display: 'grid',
                                gap: '4px',
                              }}
                            >
                              <div>
                                Project status: <strong>{projectById.get(milestone.projectId)?.status}</strong>
                              </div>
                              <div>
                                Budget: {(projectById.get(milestone.projectId)?.currency || 'USD')} {Number(projectById.get(milestone.projectId)?.budgetConsumed || 0).toLocaleString()} / {Number(projectById.get(milestone.projectId)?.budgetPlanned || 0).toLocaleString()}
                              </div>
                              {projectById.get(milestone.projectId)?.latestValidationComment ? (
                                <div>
                                  Latest project note: {projectById.get(milestone.projectId)?.latestValidationComment}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                          <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '8px' }}>
                            Evidence: {milestone.evidenceSummary || 'No evidence summary provided'}
                          </div>
                          <AttachmentPreview attachments={milestone.evidenceAttachments || []} />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                setOpenDecisionHistoryMilestoneIds((prev) =>
                                  prev.includes(milestone.id)
                                    ? prev.filter((id) => id !== milestone.id)
                                    : [...prev, milestone.id],
                                )
                              }}
                              style={{
                                ...actionButtonStyle('#0e7490'),
                                backgroundColor: '#ecfeff',
                                color: '#0e7490',
                                border: '1px solid #67e8f9',
                              }}
                            >
                              {openDecisionHistoryMilestoneIds.includes(milestone.id)
                                ? 'Hide Decision History'
                                : 'View Decision History'}
                            </button>
                            <button
                              data-tour={index === 0 ? 'client-milestone-approve' : undefined}
                              onClick={() => {
                                setDecisionState({ milestone, decision: 'APPROVE' })
                                setComment('')
                              }}
                              style={actionButtonStyle('#065f46')}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setDecisionState({ milestone, decision: 'REJECT' })
                                setComment('')
                              }}
                              style={actionButtonStyle('#b91c1c')}
                            >
                              Reject
                            </button>
                          </div>

                          {openDecisionHistoryMilestoneIds.includes(milestone.id) ? (
                            <MilestoneDecisionHistoryTimeline milestoneId={milestone.id} />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>All Milestones</h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {highlightedMilestoneId ? (
                          <button
                            type="button"
                            onClick={clearMilestoneFocus}
                            style={{
                              border: '1px solid #0e7490',
                              backgroundColor: '#ecfeff',
                              color: '#0e7490',
                              borderRadius: '8px',
                              padding: '7px 10px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Back to Request Panel
                          </button>
                        ) : null}
                        <select
                          value={allMilestoneStatusFilter}
                          onChange={(event) =>
                            setAllMilestoneStatusFilter(
                              event.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PLANNED',
                            )
                          }
                          style={{
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '7px 10px',
                            fontSize: '12px',
                            backgroundColor: 'white',
                          }}
                        >
                          <option value="ALL">All statuses</option>
                          <option value="PENDING">Pending validation</option>
                          <option value="APPROVED">Approved by client</option>
                          <option value="REJECTED">Rejected by client</option>
                          <option value="PLANNED">Planned</option>
                        </select>
                      </div>
                    </div>

                    <p style={{ margin: '8px 0 10px 0', fontSize: '12px', color: '#64748b' }}>
                      Showing {filteredAllMilestones.length} of {allMilestones.length} milestone(s).
                    </p>

                    {allMilestonesQuery.isLoading ? (
                      <p style={{ margin: 0, color: '#6b7280' }}>Loading all milestones...</p>
                    ) : null}
                    {allMilestonesQuery.isError ? (
                      <p style={{ margin: 0, color: '#b91c1c' }}>{(allMilestonesQuery.error as Error).message}</p>
                    ) : null}

                    {!allMilestonesQuery.isLoading && !allMilestonesQuery.isError && filteredAllMilestones.length === 0 ? (
                      <p style={{ margin: 0, color: '#6b7280' }}>No milestones found for the selected filter.</p>
                    ) : null}

                    {filteredAllMilestones.length > 0 ? (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {filteredAllMilestones.map((milestone) => {
                          const isPendingForClient =
                            milestone.status === 'SUBMITTED_FOR_CLIENT_VALIDATION' ||
                            milestone.status === 'RESUBMITTED_FOR_CLIENT_VALIDATION'

                          return (
                            <div
                              key={`all-${milestone.id}`}
                              id={`milestone-card-${milestone.id}`}
                              style={{
                                border: highlightedMilestoneId === milestone.id ? '2px solid #0e7490' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '10px',
                                backgroundColor: highlightedMilestoneId === milestone.id ? '#ecfeff' : 'white',
                                boxShadow: highlightedMilestoneId === milestone.id ? '0 0 0 4px rgba(14, 116, 144, 0.12)' : 'none',
                                transition: 'all 180ms ease',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <strong>{milestone.name}</strong>
                                <StatusBadge status={milestone.status} audience="client" />
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                Project: {projectNameById.get(milestone.projectId) || 'Unknown project'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                Planned: {new Date(milestone.plannedDate).toLocaleDateString()}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                Submitted: {milestone.submittedAt ? new Date(milestone.submittedAt).toLocaleDateString() : 'N/A'}
                              </div>

                              <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '8px' }}>
                                Evidence: {milestone.evidenceSummary || 'No evidence summary provided'}
                              </div>

                              <AttachmentPreview attachments={milestone.evidenceAttachments || []} />

                              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => {
                                    setOpenDecisionHistoryMilestoneIds((prev) =>
                                      prev.includes(milestone.id)
                                        ? prev.filter((id) => id !== milestone.id)
                                        : [...prev, milestone.id],
                                    )
                                  }}
                                  style={{
                                    ...actionButtonStyle('#0e7490'),
                                    backgroundColor: '#ecfeff',
                                    color: '#0e7490',
                                    border: '1px solid #67e8f9',
                                  }}
                                >
                                  {openDecisionHistoryMilestoneIds.includes(milestone.id)
                                    ? 'Hide Decision History'
                                    : 'View Decision History'}
                                </button>

                                {isPendingForClient ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setDecisionState({ milestone, decision: 'APPROVE' })
                                        setComment('')
                                      }}
                                      style={actionButtonStyle('#065f46')}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDecisionState({ milestone, decision: 'REJECT' })
                                        setComment('')
                                      }}
                                      style={actionButtonStyle('#b91c1c')}
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : null}
                              </div>

                              {openDecisionHistoryMilestoneIds.includes(milestone.id) ? (
                                <MilestoneDecisionHistoryTimeline milestoneId={milestone.id} />
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {currentPage === 'notifications' && (
                <div
                  data-tour="client-page-notifications"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: isMobile ? '20px' : '32px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <NotificationsPanel />
                </div>
              )}

              {currentPage === 'settings' && (
                <div data-tour="client-page-settings">
                  <AccessibilitySettingsPanel />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <GuidedTourOverlay
        isOpen={showGuidedTour}
        steps={guidedTourSteps}
        onClose={() => setShowGuidedTour(false)}
      />

      <FloatingTutorialButton
        onClick={() => setShowGuidedTour(true)}
        title="Start Client tutorial"
      />

      {decisionState && (
        <div style={overlayStyle} onClick={() => setDecisionState(null)}>
          <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '8px' }}>
              {decisionState.decision === 'APPROVE' ? 'Approve' : 'Reject'} {decisionState.milestone.name}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: 0 }}>
              {decisionState.decision === 'REJECT'
                ? 'Rejection comment is required.'
                : 'Optional comment for approval.'}
            </p>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={decisionState.decision === 'REJECT' ? 'Write rejection reason' : 'Optional approval note'}
              style={{
                width: '100%',
                minHeight: '110px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '10px',
                resize: 'vertical',
              }}
            />

            {decisionState.decision === 'REJECT' ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {[
                  'Evidence is incomplete',
                  'Quality does not meet expected standards',
                  'Timeline evidence is inconsistent',
                  'Attachment files are not readable',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setComment(preset)}
                    style={{
                      border: '1px solid #fecaca',
                      backgroundColor: '#fff1f2',
                      color: '#9f1239',
                      borderRadius: '999px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            ) : null}

            {validationMutation.isError && (
              <p style={{ color: '#b91c1c', marginTop: '8px', marginBottom: 0 }}>
                {(validationMutation.error as Error).message || 'Failed to save decision'}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setDecisionState(null)} style={cancelButtonStyle}>
                Cancel
              </button>
              <button
                onClick={() => validationMutation.mutate()}
                disabled={!canConfirm}
                style={{
                  ...confirmButtonStyle,
                  opacity: canConfirm ? 1 : 0.6,
                  cursor: canConfirm ? 'pointer' : 'not-allowed',
                }}
              >
                {validationMutation.isPending ? 'Saving...' : 'Confirm decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MetricCard({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '14px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ fontSize: '12px', color: '#64748b' }}>{title}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{value}</div>
      {subtitle ? <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{subtitle}</div> : null}
    </div>
  )
}

function getStatusLabel(status: string, audience: 'client' | 'director' = 'client') {
  const labelsForClient: Record<string, string> = {
    DRAFT: 'Draft',
    SUBMITTED_FOR_VALIDATION: 'Waiting for director approval',
    REJECTED: 'Rejected by director',
    APPROVED: 'Approved by director',
    ACTIVE: 'Active',
    PLANNED: 'Planned',
    SUBMITTED_FOR_CLIENT_VALIDATION: 'Waiting for your approval',
    RESUBMITTED_FOR_CLIENT_VALIDATION: 'Resubmitted: waiting for your approval',
    APPROVED_BY_CLIENT: 'Approved by you',
    REJECTED_BY_CLIENT: 'Rejected by you',
  }

  const labelsForDirector: Record<string, string> = {
    ...labelsForClient,
    SUBMITTED_FOR_CLIENT_VALIDATION: 'Waiting for client approval',
    RESUBMITTED_FOR_CLIENT_VALIDATION: 'Resubmitted: waiting for client approval',
    APPROVED_BY_CLIENT: 'Approved by client',
    REJECTED_BY_CLIENT: 'Rejected by client',
  }

  const labels = audience === 'director' ? labelsForDirector : labelsForClient
  return labels[status] || status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  const styleMap: Record<string, React.CSSProperties> = {
    DRAFT: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' },
    SUBMITTED_FOR_VALIDATION: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    REJECTED: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
    APPROVED: { backgroundColor: '#dbeafe', color: '#1e3a8a', border: '1px solid #bfdbfe' },
    ACTIVE: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    PLANNED: { backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' },
    SUBMITTED_FOR_CLIENT_VALIDATION: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    RESUBMITTED_FOR_CLIENT_VALIDATION: { backgroundColor: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' },
    APPROVED_BY_CLIENT: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    REJECTED_BY_CLIENT: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  }

  return styleMap[status] || { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }
}

function StatusBadge({ status, audience = 'client' }: { status: string; audience?: 'client' | 'director' }) {
  return (
    <span
      style={{
        ...getStatusBadgeStyle(status),
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '999px',
        padding: '3px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {getStatusLabel(status, audience)}
    </span>
  )
}

function getPendingDays(dateValue?: string) {
  if (!dateValue) return -1
  const start = new Date(dateValue).getTime()
  if (!Number.isFinite(start)) return -1
  const diffMs = Date.now() - start
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function MilestoneDecisionHistoryTimeline({ milestoneId }: { milestoneId: string }) {
  const historyQuery = useQuery({
    queryKey: ['client-milestone-decision-history', milestoneId],
    queryFn: () => getClientMilestoneDecisionHistory(milestoneId),
    staleTime: 30_000,
  })

  const items = historyQuery.data || []

  return (
    <div
      style={{
        marginTop: '10px',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '10px',
        display: 'grid',
        gap: '8px',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Decision History</div>

      {historyQuery.isLoading ? <div style={{ fontSize: '12px', color: '#6b7280' }}>Loading history...</div> : null}
      {historyQuery.isError ? (
        <div style={{ fontSize: '12px', color: '#b91c1c' }}>
          {(historyQuery.error as Error).message || 'Failed to load decision history'}
        </div>
      ) : null}

      {!historyQuery.isLoading && !historyQuery.isError && items.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>No previous client decisions recorded yet.</div>
      ) : null}

      {items.map((entry: MilestoneDecisionHistoryItem) => {
        const isReject = entry.action === 'MILESTONE_REJECTED_BY_CLIENT'
        const comment = entry.details?.comment?.trim() || ''
        return (
          <div
            key={entry._id || `${entry.action}-${entry.timestamp}`}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px',
              backgroundColor: isReject ? '#fff1f2' : '#f0fdf4',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '12px', color: isReject ? '#9f1239' : '#166534' }}>
                {isReject ? 'Rejected by client' : 'Approved by client'}
              </strong>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown date'}
              </span>
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#334155' }}>
              By: {entry.username || 'Client'}
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#334155' }}>
              Comment: {comment || 'No comment provided'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AttachmentPreview({ attachments }: { attachments: string[] }) {
  const [selectedAttachment, setSelectedAttachment] = useState(attachments[0] || '')
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setSelectedAttachment(attachments[0] || '')
  }, [attachments])

  useEffect(() => {
    let isActive = true
    let objectUrl = ''

    const loadPreview = async () => {
      if (!selectedAttachment) {
        setPreviewUrl('')
        setPreviewError('')
        setIsPreviewLoading(false)
        return
      }

      setIsPreviewLoading(true)
      setPreviewError('')

      try {
        const token = getAccessToken()
        const response = await fetch(resolveApiUrl(selectedAttachment), {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

        if (!response.ok) {
          throw new Error('Unable to load attachment preview')
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)

        if (!isActive) {
          URL.revokeObjectURL(objectUrl)
          return
        }

        setPreviewUrl(objectUrl)
      } catch (error) {
        if (!isActive) return
        setPreviewUrl('')
        setPreviewError(error instanceof Error ? error.message : 'Unable to load attachment preview')
      } finally {
        if (isActive) {
          setIsPreviewLoading(false)
        }
      }
    }

    loadPreview()

    return () => {
      isActive = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [selectedAttachment])

  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  if (attachments.length === 0) return null

  const selectedUrl = selectedAttachment || attachments[0]
  const fileName = selectedUrl.split('/').filter(Boolean).pop() || selectedUrl
  const lowerName = fileName.toLowerCase()
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(lowerName)
  const isPdf = lowerName.endsWith('.pdf')

  return (
    <div style={{ marginTop: '8px', display: 'grid', gap: '8px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Attachments</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {attachments.map((attachmentUrl) => {
          const attachmentName = attachmentUrl.split('/').filter(Boolean).pop() || attachmentUrl
          const isActive = attachmentUrl === selectedUrl
          return (
            <button
              key={attachmentUrl}
              type="button"
              onClick={() => setSelectedAttachment(attachmentUrl)}
              style={{
                border: isActive ? '1px solid #0e7490' : '1px solid #cbd5e1',
                backgroundColor: isActive ? '#ecfeff' : 'white',
                color: isActive ? '#0e7490' : '#334155',
                borderRadius: '999px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Preview attachment on this page"
            >
              {attachmentName}
            </button>
          )
        })}
      </div>

      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          backgroundColor: '#f8fafc',
          padding: '10px',
          display: 'grid',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#475569', wordBreak: 'break-all' }}>{selectedUrl}</div>
        {isPreviewLoading ? (
          <div style={{ fontSize: '12px', color: '#64748b' }}>Loading preview...</div>
        ) : previewError ? (
          <div style={{ fontSize: '12px', color: '#b91c1c' }}>
            {previewError}
            <a
              href={resolveApiUrl(selectedUrl)}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: '6px', color: '#0e7490', fontWeight: 600 }}
            >
              Open file
            </a>
          </div>
        ) : isImage ? (
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                border: '1px solid #0e7490',
                backgroundColor: '#ecfeff',
                color: '#0e7490',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                justifySelf: 'start',
              }}
            >
              Open larger view
            </button>
            <img
              src={previewUrl || resolveApiUrl(selectedUrl)}
              alt={fileName}
              style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '8px', backgroundColor: 'white', cursor: 'zoom-in' }}
              onClick={() => setIsModalOpen(true)}
            />
          </>
        ) : isPdf ? (
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                border: '1px solid #0e7490',
                backgroundColor: '#ecfeff',
                color: '#0e7490',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                justifySelf: 'start',
              }}
            >
              Open larger view
            </button>
            <iframe
              src={previewUrl || resolveApiUrl(selectedUrl)}
              title={fileName}
              style={{ width: '100%', height: '320px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'zoom-in' }}
              onClick={() => setIsModalOpen(true)}
            />
          </>
        ) : (
          <div style={{ fontSize: '12px', color: '#475569' }}>
            Preview is not available for this file type.
            <a
              href={resolveApiUrl(selectedUrl)}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: '6px', color: '#0e7490', fontWeight: 600 }}
            >
              Open file
            </a>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            backgroundColor: 'rgba(15, 23, 42, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(1100px, 100%)',
              maxHeight: '90vh',
              backgroundColor: 'white',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
              display: 'grid',
              gridTemplateRows: 'auto 1fr',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>{fileName}</div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  color: '#334155',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '12px', overflow: 'auto' }}>
              {isImage ? (
                <img
                  src={previewUrl || resolveApiUrl(selectedUrl)}
                  alt={fileName}
                  style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                />
              ) : isPdf ? (
                <iframe
                  src={previewUrl || resolveApiUrl(selectedUrl)}
                  title={fileName}
                  style={{ width: '100%', height: '80vh', border: 'none', backgroundColor: 'white' }}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function actionButtonStyle(color: string): React.CSSProperties {
  return {
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    backgroundColor: color,
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '12px',
  }
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1200,
  padding: '12px',
}

const modalStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '560px',
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '18px',
}

const cancelButtonStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  backgroundColor: 'white',
  padding: '9px 14px',
  cursor: 'pointer',
}

const confirmButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#075B7A',
  color: 'white',
  padding: '9px 14px',
  fontWeight: 600,
}
