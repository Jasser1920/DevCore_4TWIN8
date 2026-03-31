import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  apiFetch,
  getClientMilestoneValidationQueue,
  getClientProjects,
  type MilestoneItem,
  validateMilestoneByClient,
} from '../lib/api'
import { clearTokens, getAccessToken, getRefreshToken, getRolesFromToken, getBusinessRoles } from '../lib/auth'
import { useResponsive } from '../hooks/useResponsive'
import LoadingPage from '../components/LoadingPage'
import logoIcon from '../assets/logo smartsite.svg'

type DecisionState = {
  milestone: MilestoneItem
  decision: 'APPROVE' | 'REJECT'
}

const LogOut = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

export default function Client() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isMobile, isTablet } = useResponsive()
  const roles = getBusinessRoles(getRolesFromToken(getAccessToken()))
  const [decisionState, setDecisionState] = useState<DecisionState | null>(null)
  const [comment, setComment] = useState('')

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })
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
    },
  })

  const projects = projectsQuery.data || []
  const milestones = milestoneQueueQuery.data || []

  const metrics = useMemo(() => {
    const total = projects.length
    const active = projects.filter((project) => project.status === 'ACTIVE').length
    const approved = projects.filter((project) => project.status === 'APPROVED').length
    const submitted = projects.filter((project) => project.status === 'SUBMITTED_FOR_VALIDATION').length
    const totalBudget = projects.reduce((sum, project) => sum + Number(project.budgetPlanned || 0), 0)

    return { total, active, approved, submitted, totalBudget }
  }, [projects])

  const canConfirm =
    !!decisionState &&
    (decisionState.decision === 'APPROVE' || comment.trim().length > 0) &&
    !validationMutation.isPending

  return (
    <>
      <LoadingPage isVisible={logoutMutation.isPending} />
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          padding: isMobile ? '16px' : isTablet ? '24px' : '32px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              marginBottom: '32px',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '16px' : '0',
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
            <button
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: logoutMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: logoutMutation.isPending ? 0.75 : 1,
                fontSize: '14px',
                fontWeight: '500',
                width: isMobile ? '100%' : 'auto',
                justifyContent: isMobile ? 'center' : 'flex-start',
              }}
            >
              <LogOut style={{ height: '18px', width: '18px' }} />
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </button>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: isMobile ? '20px' : '32px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#075B7A',
                margin: '0 0 16px 0',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Read-Only Project Dashboard
            </h2>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 8px 0', lineHeight: '1.6' }}>
              Track project progress and validate submitted milestones. All project data remains read-only for client governance.
            </p>
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: '#CAEDF1',
                border: '1px solid #148ABB',
                borderRadius: '8px',
                color: '#075B7A',
              }}
            >
              <strong>Current Roles:</strong> {roles.join(', ')}
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
                  <div key={project.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <strong>{project.name}</strong>
                      <span style={{ fontSize: '12px', color: '#334155' }}>{project.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {project.code} | {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 14px 0' }}>
              Milestone Validation Queue
            </h3>

            {milestoneQueueQuery.isLoading && <p style={{ margin: 0, color: '#6b7280' }}>Loading milestones...</p>}
            {milestoneQueueQuery.isError && (
              <p style={{ margin: 0, color: '#b91c1c' }}>{(milestoneQueueQuery.error as Error).message}</p>
            )}
            {!milestoneQueueQuery.isLoading && !milestoneQueueQuery.isError && milestones.length === 0 && (
              <p style={{ margin: 0, color: '#6b7280' }}>No milestones waiting for your validation.</p>
            )}

            {milestones.length > 0 && (
              <div style={{ display: 'grid', gap: '10px' }}>
                {milestones.map((milestone) => (
                  <div key={milestone.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <strong>{milestone.name}</strong>
                      <span style={{ fontSize: '12px', color: '#334155' }}>{milestone.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Planned: {new Date(milestone.plannedDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '8px' }}>
                      Evidence: {milestone.evidenceSummary || 'No evidence summary provided'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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

function MetricCard({ title, value }: { title: string; value: number }) {
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
