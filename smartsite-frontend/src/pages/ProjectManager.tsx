import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  apiFetch,
  createMilestone,
  createProject,
  getMyAssignedCompany,
  getMyProjects,
  getProjectMilestones,
  getProjectFeedback,
  getStrategicVision,
  resubmitMilestone,
  resubmitProject,
  submitMilestone,
  submitProject,
  updateProject,
  type MilestoneItem,
  type ProjectItem,
} from '../lib/api'
import { clearTokens, getAccessToken, getRefreshToken, getRolesFromToken, getBusinessRoles } from '../lib/auth'
import { useResponsive } from '../hooks/useResponsive'
import LoadingPage from '../components/LoadingPage'
import Sidebar from '../components/shared/Sidebar'
import MetricCard from '../components/shared/UI/MetricCard'
import { ActivityLogs } from '../components/ActivityLogs'
import { Button } from '../components/shared/UI'
import PMStrategicVisionView from './ProjectManager/PMStrategicVisionView'

const MAX_PM_ONGOING_PROJECTS = 3

const LayoutDashboard = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
  </svg>
)

const FolderKanban = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h3m2 0h3m-8 3h5" />
  </svg>
)

const Activity = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const Settings = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const Target = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m0-12.14l2.83 2.83m4.48 4.48l2.83 2.83M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function ProjectManager() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const roles = getBusinessRoles(getRolesFromToken(getAccessToken()))
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    budgetPlanned: '',
    budgetConsumed: '0',
    currency: 'USD',
    startDate: '',
    endDate: '',
  })
  const [pageMessage, setPageMessage] = useState('')
  const [pageError, setPageError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [focusedField, setFocusedField] = useState('')
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    plannedDate: '',
    description: '',
    evidenceSummary: '',
  })

  const projectsQuery = useQuery({
    queryKey: ['pm-projects'],
    queryFn: getMyProjects,
  })

  const selectedProject = useMemo(
    () => (projectsQuery.data || []).find((project) => project.id === selectedProjectId),
    [projectsQuery.data, selectedProjectId],
  )

  const assignedCompanyQuery = useQuery({
    queryKey: ['pm-assigned-company-for-project-submit'],
    queryFn: getMyAssignedCompany,
  })

  const assignedCompany = assignedCompanyQuery.data?.data || null

  const strategicVisionQuery = useQuery({
    queryKey: ['pm-strategic-vision-for-project-submit', assignedCompany?.id],
    enabled: !!assignedCompany?.id,
    queryFn: async () => {
      if (!assignedCompany?.id) return null
      try {
        const response = await getStrategicVision(assignedCompany.id)
        const raw = response as unknown as { data?: { status?: string }; status?: string }
        return raw.data || raw || null
      } catch {
        return null
      }
    },
  })

  const feedbackQuery = useQuery({
    queryKey: ['project-feedback', selectedProjectId],
    queryFn: () => getProjectFeedback(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  const milestonesQuery = useQuery({
    queryKey: ['project-milestones', selectedProjectId],
    queryFn: () => getProjectMilestones(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  const resetForm = () => {
    setForm({
      name: '',
      code: '',
      description: '',
      budgetPlanned: '',
      budgetConsumed: '0',
      currency: 'USD',
      startDate: '',
      endDate: '',
    })
    setFieldErrors({})
    setTouchedFields({})
    setFocusedField('')
  }

  const validateForm = (currentForm = form): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!currentForm.name.trim()) {
      errors.name = 'Project name is required'
    }

    if (currentForm.code.trim().length > 40) {
      errors.code = 'Project code cannot exceed 40 characters'
    }

    if (currentForm.description.trim().length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters'
    }

    const budgetPlanned = Number(currentForm.budgetPlanned)
    const budgetConsumed = Number(currentForm.budgetConsumed || 0)

    if (!currentForm.budgetPlanned.trim()) {
      errors.budgetPlanned = 'Planned budget is required'
    } else if (Number.isNaN(budgetPlanned) || budgetPlanned < 0) {
      errors.budgetPlanned = 'Planned budget must be a non-negative number'
    }

    if (Number.isNaN(budgetConsumed) || budgetConsumed < 0) {
      errors.budgetConsumed = 'Consumed budget must be a non-negative number'
    }

    if (!errors.budgetPlanned && !errors.budgetConsumed && budgetConsumed > budgetPlanned) {
      errors.budgetConsumed = 'Consumed budget cannot exceed planned budget'
    }

    if (!currentForm.currency.trim()) {
      errors.currency = 'Currency is required'
    } else if (currentForm.currency.trim().length > 10) {
      errors.currency = 'Currency cannot exceed 10 characters'
    }

    if (!currentForm.startDate) {
      errors.startDate = 'Start date is required'
    }

    if (!currentForm.endDate) {
      errors.endDate = 'End date is required'
    }

    if (currentForm.startDate && currentForm.endDate) {
      const startDate = new Date(currentForm.startDate)
      const endDate = new Date(currentForm.endDate)
      if (endDate <= startDate) {
        errors.endDate = 'End date must be after start date'
      }
    }

    return errors
  }

  const applyFieldChange = (field: keyof typeof form, value: string) => {
    const nextForm = { ...form, [field]: value }
    setForm(nextForm)
    setFieldErrors(validateForm(nextForm))
    setPageError('')
  }

  const handleFieldBlur = (field: keyof typeof form) => {
    setTouchedFields((previous) => ({ ...previous, [field]: true }))
    setFieldErrors(validateForm(form))
  }

  const getFieldStyle = (field: keyof typeof form): React.CSSProperties => {
    const hasError = touchedFields[field] && !!fieldErrors[field]
    const isFocused = focusedField === field

    return {
      ...inputStyle,
      borderColor: hasError ? '#dc2626' : isFocused ? '#148ABB' : '#d1d5db',
      backgroundColor: hasError ? '#fef2f2' : '#f9fafb',
      outline: 'none',
      transition: 'border-color 0.2s ease, background-color 0.2s ease',
    }
  }

  const renderFieldError = (field: keyof typeof form) => {
    if (!touchedFields[field] || !fieldErrors[field]) return null
    return <p style={{ margin: '2px 0 0', color: '#b91c1c', fontSize: '12px' }}>{fieldErrors[field]}</p>
  }

  const validateBeforeAction = () => {
    const errors = validateForm(form)
    setFieldErrors(errors)
    setTouchedFields({
      name: true,
      code: true,
      description: true,
      budgetPlanned: true,
      budgetConsumed: true,
      currency: true,
      startDate: true,
      endDate: true,
    })

    if (Object.keys(errors).length > 0) {
      setPageError('Please fix the highlighted form fields before continuing.')
      setPageMessage('')
      return false
    }

    return true
  }

  const loadProjectToForm = (project: ProjectItem) => {
    setSelectedProjectId(project.id)
    setForm({
      name: project.name || '',
      code: project.code || '',
      description: project.description || '',
      budgetPlanned: String(project.budgetPlanned || ''),
      budgetConsumed: String(project.budgetConsumed || '0'),
      currency: project.currency || 'USD',
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : '',
    })
    setFieldErrors({})
    setTouchedFields({})
    setFocusedField('')
    setPageError('')
  }

  const createMutation = useMutation({
    mutationFn: async () =>
      createProject({
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        budgetPlanned: Number(form.budgetPlanned),
        budgetConsumed: Number(form.budgetConsumed || 0),
        currency: form.currency.trim() || 'USD',
        startDate: form.startDate,
        endDate: form.endDate,
      }),
    onSuccess: (project) => {
      setPageMessage(`Project ${project.name} created as draft.`)
      setPageError('')
      queryClient.invalidateQueries({ queryKey: ['pm-projects'] })
      setSelectedProjectId(project.id)
    },
    onError: (error: Error) => {
      setPageError(error.message || 'Failed to create project')
      setPageMessage('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) throw new Error('Select a project first')
      return updateProject(selectedProjectId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        budgetPlanned: Number(form.budgetPlanned),
        budgetConsumed: Number(form.budgetConsumed || 0),
        currency: form.currency.trim() || 'USD',
        startDate: form.startDate,
        endDate: form.endDate,
      })
    },
    onSuccess: (project) => {
      setPageMessage(`Project ${project.name} updated.`)
      setPageError('')
      queryClient.invalidateQueries({ queryKey: ['pm-projects'] })
      queryClient.invalidateQueries({ queryKey: ['project-feedback', selectedProjectId] })
    },
    onError: (error: Error) => {
      setPageError(error.message || 'Failed to update project')
      setPageMessage('')
    },
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) throw new Error('Select a project first')
      if (selectedProject?.status === 'REJECTED') {
        return resubmitProject(selectedProjectId)
      }
      return submitProject(selectedProjectId)
    },
    onSuccess: (project) => {
      setPageMessage(`Project ${project.name} submitted for validation.`)
      setPageError('')
      queryClient.invalidateQueries({ queryKey: ['pm-projects'] })
      queryClient.invalidateQueries({ queryKey: ['project-feedback', selectedProjectId] })
    },
    onError: (error: Error) => {
      setPageError(error.message || 'Failed to submit project')
      setPageMessage('')
    },
  })

  const createMilestoneMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) throw new Error('Select a project first')
      if (!milestoneForm.name.trim()) throw new Error('Milestone name is required')
      if (!milestoneForm.plannedDate) throw new Error('Milestone planned date is required')

      return createMilestone(selectedProjectId, {
        name: milestoneForm.name.trim(),
        plannedDate: milestoneForm.plannedDate,
        description: milestoneForm.description.trim() || undefined,
      })
    },
    onSuccess: () => {
      setPageMessage('Milestone created successfully.')
      setPageError('')
      queryClient.invalidateQueries({ queryKey: ['project-milestones', selectedProjectId] })
    },
    onError: (error: Error) => {
      setPageError(error.message || 'Failed to create milestone')
      setPageMessage('')
    },
  })

  const submitMilestoneMutation = useMutation({
    mutationFn: async (milestone: MilestoneItem) => {
      const evidenceSummary = milestoneForm.evidenceSummary.trim() || undefined
      if (milestone.status === 'REJECTED_BY_CLIENT') {
        return resubmitMilestone(milestone.id, { evidenceSummary })
      }
      return submitMilestone(milestone.id, { evidenceSummary })
    },
    onSuccess: () => {
      setPageMessage('Milestone sent to client validation queue.')
      setPageError('')
      queryClient.invalidateQueries({ queryKey: ['project-milestones', selectedProjectId] })
    },
    onError: (error: Error) => {
      setPageError(error.message || 'Failed to submit milestone')
      setPageMessage('')
    },
  })

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

  const allProjects = projectsQuery.data || []
  const totalProjects = allProjects.length
  const draftCount = allProjects.filter((project) => project.status === 'DRAFT').length
  const submittedCount = allProjects.filter((project) => project.status === 'SUBMITTED_FOR_VALIDATION').length
  const rejectedCount = allProjects.filter((project) => project.status === 'REJECTED').length
  const plannedBudgetValue = Number(form.budgetPlanned || 0)
  const consumedBudgetValue = Number(form.budgetConsumed || 0)
  const normalizedPlannedBudget = Number.isFinite(plannedBudgetValue) ? plannedBudgetValue : 0
  const normalizedConsumedBudget = Number.isFinite(consumedBudgetValue) ? consumedBudgetValue : 0
  const remainingBudget = normalizedPlannedBudget - normalizedConsumedBudget
  const budgetConsumptionPercent =
    normalizedPlannedBudget > 0
      ? Number(((normalizedConsumedBudget / normalizedPlannedBudget) * 100).toFixed(2))
      : 0
  const ongoingProjectsCount = allProjects.filter(
    (project) => project.status === 'SUBMITTED_FOR_VALIDATION' || project.status === 'ACTIVE',
  ).length
  const hasOngoingCapacity = ongoingProjectsCount < MAX_PM_ONGOING_PROJECTS
  const isStrategicVisionApproved = strategicVisionQuery.data?.status === 'APPROVED'
  const canSubmitProject = !!selectedProjectId && isStrategicVisionApproved && hasOngoingCapacity

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workspace', label: 'Projects Workspace', icon: FolderKanban },
    { id: 'strategic-vision', label: 'Strategic Vision', icon: Target },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const sectionCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '10px',
    backgroundColor: '#f9fafb',
    fontSize: '14px',
    color: '#111827',
  }

  const renderWorkspace = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          ...sectionCardStyle,
          padding: isMobile ? '20px' : isTablet ? '24px' : '32px',
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '600',
            color: '#075B7A',
            margin: '0 0 12px 0',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Project Delivery Workspace
        </h2>
        <p style={{ fontSize: '15px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
          Create project drafts, update required details, submit for Director validation, and resubmit rejected projects.
        </p>
      </div>

      {(pageMessage || pageError) && (
        <div
          style={{
            backgroundColor: pageError ? '#fef2f2' : '#ecfdf5',
            border: `1px solid ${pageError ? '#fecaca' : '#86efac'}`,
            color: pageError ? '#b91c1c' : '#166534',
            borderRadius: '10px',
            padding: '12px 16px',
          }}
        >
          {pageError || pageMessage}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
          gap: '24px',
        }}
      >
        <div
          style={{
            ...sectionCardStyle,
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 16px 0' }}>
            {selectedProjectId ? 'Edit Selected Project' : 'Create Project Draft'}
          </h3>

          <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
            <input
              placeholder="Project name"
              value={form.name}
              onChange={(event) => applyFieldChange('name', event.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => handleFieldBlur('name')}
              style={getFieldStyle('name')}
            />
            {renderFieldError('name')}
            <input
              placeholder="Project code (optional)"
              value={form.code}
              onChange={(event) => applyFieldChange('code', event.target.value)}
              onFocus={() => setFocusedField('code')}
              onBlur={() => handleFieldBlur('code')}
              style={getFieldStyle('code')}
            />
            {renderFieldError('code')}
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(event) => applyFieldChange('description', event.target.value)}
              onFocus={() => setFocusedField('description')}
              onBlur={() => handleFieldBlur('description')}
              style={{ ...getFieldStyle('description'), minHeight: '90px' }}
            />
            {renderFieldError('description')}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
              <input
                type="number"
                min="0"
                placeholder="Budget planned"
                value={form.budgetPlanned}
                onChange={(event) => applyFieldChange('budgetPlanned', event.target.value)}
                onFocus={() => setFocusedField('budgetPlanned')}
                onBlur={() => handleFieldBlur('budgetPlanned')}
                style={getFieldStyle('budgetPlanned')}
              />
              <input
                type="number"
                min="0"
                placeholder="Budget consumed"
                value={form.budgetConsumed}
                onChange={(event) => applyFieldChange('budgetConsumed', event.target.value)}
                onFocus={() => setFocusedField('budgetConsumed')}
                onBlur={() => handleFieldBlur('budgetConsumed')}
                style={getFieldStyle('budgetConsumed')}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
              {renderFieldError('budgetPlanned') || <div />}
              {renderFieldError('budgetConsumed') || <div />}
            </div>
            <div
              style={{
                marginTop: '-2px',
                backgroundColor: remainingBudget < 0 ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${remainingBudget < 0 ? '#fecaca' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '12px',
                color: remainingBudget < 0 ? '#b91c1c' : '#334155',
              }}
            >
              <span>
                Remaining budget: <strong>{remainingBudget.toFixed(2)}</strong>
              </span>
              <span>
                Consumed: <strong>{budgetConsumptionPercent.toFixed(2)}%</strong>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
              <input
                placeholder="Currency"
                value={form.currency}
                onChange={(event) => applyFieldChange('currency', event.target.value.toUpperCase())}
                onFocus={() => setFocusedField('currency')}
                onBlur={() => handleFieldBlur('currency')}
                style={getFieldStyle('currency')}
              />
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => applyFieldChange('startDate', event.target.value)}
                onFocus={() => setFocusedField('startDate')}
                onBlur={() => handleFieldBlur('startDate')}
                style={getFieldStyle('startDate')}
              />
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => applyFieldChange('endDate', event.target.value)}
                onFocus={() => setFocusedField('endDate')}
                onBlur={() => handleFieldBlur('endDate')}
                style={getFieldStyle('endDate')}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px' }}>
              {renderFieldError('currency') || <div />}
              {renderFieldError('startDate') || <div />}
              {renderFieldError('endDate') || <div />}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              disabled={createMutation.isPending}
              title="Create Draft stays available even when submission is locked"
              onClick={() => {
                if (!validateBeforeAction()) return
                createMutation.mutate()
              }}
              style={{ minWidth: '140px' }}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Draft'}
            </Button>
            <Button
              variant="secondary"
              disabled={updateMutation.isPending || !selectedProjectId}
              onClick={() => {
                if (!validateBeforeAction()) return
                updateMutation.mutate()
              }}
              style={{ minWidth: '140px' }}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="danger"
              disabled={submitMutation.isPending || !canSubmitProject}
              title={
                !isStrategicVisionApproved
                  ? 'Submit is locked until strategic vision is approved by Director'
                  : undefined
              }
              onClick={() => {
                if (!isStrategicVisionApproved) {
                  setPageError('Strategic vision must be approved before submitting projects for validation.')
                  setPageMessage('')
                  return
                }
                if (!hasOngoingCapacity) {
                  setPageError(
                    `You can have at most ${MAX_PM_ONGOING_PROJECTS} ongoing projects (SUBMITTED_FOR_VALIDATION or ACTIVE).`,
                  )
                  setPageMessage('')
                  return
                }
                if (!validateBeforeAction()) return
                submitMutation.mutate()
              }}
              style={{ minWidth: '180px' }}
            >
              {submitMutation.isPending
                ? 'Submitting...'
                : !isStrategicVisionApproved || !hasOngoingCapacity
                ? 'Submit Locked'
                : selectedProject?.status === 'REJECTED'
                ? 'Resubmit For Validation'
                : 'Submit For Validation'}
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setSelectedProjectId('')
                resetForm()
              }}
              style={{ minWidth: '120px' }}
            >
              Clear Form
            </Button>
          </div>

          {(!isStrategicVisionApproved || !hasOngoingCapacity) && (
            <div
              style={{
                marginTop: '10px',
                border: '1px solid #fde68a',
                backgroundColor: '#fffbeb',
                color: '#92400e',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '12px',
              }}
            >
              {!isStrategicVisionApproved
                ? 'Submit is disabled until Director approves Strategic Vision. You can still create and save project drafts.'
                : `Submit is disabled because you already have ${ongoingProjectsCount} ongoing projects. Maximum allowed is ${MAX_PM_ONGOING_PROJECTS}.`}
            </div>
          )}

          <p style={{ margin: '10px 0 0', fontSize: '12px', color: isStrategicVisionApproved ? '#15803d' : '#92400e' }}>
            Strategic vision status:{' '}
            <strong>
              {assignedCompanyQuery.isLoading || strategicVisionQuery.isLoading
                ? 'Checking...'
                : isStrategicVisionApproved
                ? 'Approved'
                : 'Not approved'}
            </strong>
            . Submit for validation is enabled only after strategic vision approval.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          <div
            style={{
              ...sectionCardStyle,
              padding: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#111827' }}>My Projects</h3>
            {projectsQuery.isLoading && <p style={{ margin: 0, color: '#6b7280' }}>Loading projects...</p>}
            {projectsQuery.isError && (
              <p style={{ margin: 0, color: '#b91c1c' }}>{(projectsQuery.error as Error).message}</p>
            )}
            {!projectsQuery.isLoading && !projectsQuery.isError && (projectsQuery.data || []).length === 0 && (
              <p style={{ margin: 0, color: '#6b7280' }}>No projects yet. Create your first draft.</p>
            )}
            {(projectsQuery.data || []).length > 0 && (
              <div style={{ display: 'grid', gap: '10px' }}>
                {(projectsQuery.data || []).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => loadProjectToForm(project)}
                    style={{
                      textAlign: 'left',
                      borderRadius: '8px',
                      border: selectedProjectId === project.id ? '1px solid #0ea5e9' : '1px solid #e5e7eb',
                      backgroundColor: selectedProjectId === project.id ? '#f0f9ff' : '#ffffff',
                      padding: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(event) => {
                      if (selectedProjectId !== project.id) {
                        event.currentTarget.style.borderColor = '#93c5fd'
                        event.currentTarget.style.backgroundColor = '#f8fafc'
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (selectedProjectId !== project.id) {
                        event.currentTarget.style.borderColor = '#e5e7eb'
                        event.currentTarget.style.backgroundColor = '#ffffff'
                      }
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#111827' }}>{project.name}</div>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                      {project.code} | {project.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              ...sectionCardStyle,
              padding: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#111827' }}>Validation Feedback</h3>
            {!selectedProjectId && (
              <p style={{ margin: 0, color: '#6b7280' }}>Select a project to view validation history.</p>
            )}
            {selectedProjectId && feedbackQuery.isLoading && (
              <p style={{ margin: 0, color: '#6b7280' }}>Loading feedback...</p>
            )}
            {selectedProjectId && feedbackQuery.isError && (
              <p style={{ margin: 0, color: '#b91c1c' }}>{(feedbackQuery.error as Error).message}</p>
            )}
            {selectedProjectId && feedbackQuery.data && (
              <div style={{ display: 'grid', gap: '8px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                  }}
                >
                  Latest comment: {feedbackQuery.data.latestValidationComment || 'No comment yet'}
                </div>
                {feedbackQuery.data.history.length === 0 ? (
                  <p style={{ margin: 0, color: '#6b7280' }}>No validation activity yet.</p>
                ) : (
                  feedbackQuery.data.history.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{entry.action}</div>
                      <div style={{ color: '#6b7280', marginTop: '4px' }}>
                        {new Date(entry.createdAt).toLocaleString()} | {entry.actorRole}
                      </div>
                      {entry.comment && <div style={{ marginTop: '6px' }}>{entry.comment}</div>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div
            style={{
              ...sectionCardStyle,
              padding: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#111827' }}>
              Milestones (Client Validation Loop)
            </h3>
            {!selectedProjectId && (
              <p style={{ margin: 0, color: '#6b7280' }}>Select a project to manage milestones.</p>
            )}

            {selectedProjectId && (
              <>
                <div style={{ display: 'grid', gap: '8px', marginBottom: '10px' }}>
                  <input
                    placeholder="Milestone name"
                    value={milestoneForm.name}
                    onChange={(event) => setMilestoneForm((prev) => ({ ...prev, name: event.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    type="date"
                    value={milestoneForm.plannedDate}
                    onChange={(event) => setMilestoneForm((prev) => ({ ...prev, plannedDate: event.target.value }))}
                    style={inputStyle}
                  />
                  <textarea
                    placeholder="Milestone description"
                    value={milestoneForm.description}
                    onChange={(event) => setMilestoneForm((prev) => ({ ...prev, description: event.target.value }))}
                    style={{ ...inputStyle, minHeight: '70px' }}
                  />
                  <textarea
                    placeholder="Evidence summary used during submit/resubmit"
                    value={milestoneForm.evidenceSummary}
                    onChange={(event) => setMilestoneForm((prev) => ({ ...prev, evidenceSummary: event.target.value }))}
                    style={{ ...inputStyle, minHeight: '70px' }}
                  />
                  <Button
                    variant="secondary"
                    disabled={createMilestoneMutation.isPending}
                    onClick={() => createMilestoneMutation.mutate()}
                  >
                    {createMilestoneMutation.isPending ? 'Creating...' : 'Create Milestone'}
                  </Button>
                </div>

                {milestonesQuery.isLoading && <p style={{ margin: 0, color: '#6b7280' }}>Loading milestones...</p>}
                {milestonesQuery.isError && (
                  <p style={{ margin: 0, color: '#b91c1c' }}>{(milestonesQuery.error as Error).message}</p>
                )}

                {(milestonesQuery.data || []).length === 0 && !milestonesQuery.isLoading && (
                  <p style={{ margin: 0, color: '#6b7280' }}>No milestones yet for this project.</p>
                )}

                {(milestonesQuery.data || []).length > 0 && (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {(milestonesQuery.data || []).map((milestone) => (
                      <div
                        key={milestone.id}
                        style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <strong>{milestone.name}</strong>
                          <span style={{ fontSize: '12px', color: '#334155' }}>{milestone.status}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          Planned: {new Date(milestone.plannedDate).toLocaleDateString()}
                        </div>
                        {!!milestone.clientValidationComment && (
                          <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>
                            Client note: {milestone.clientValidationComment}
                          </div>
                        )}
                        {['PLANNED', 'REJECTED_BY_CLIENT'].includes(milestone.status) && (
                          <Button
                            variant="primary"
                            disabled={submitMilestoneMutation.isPending}
                            onClick={() => submitMilestoneMutation.mutate(milestone)}
                            style={{ marginTop: '8px' }}
                          >
                            {submitMilestoneMutation.isPending
                              ? 'Sending...'
                              : milestone.status === 'REJECTED_BY_CLIENT'
                              ? 'Resubmit To Client'
                              : 'Submit To Client'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          ...sectionCardStyle,
          padding: isMobile ? '20px' : isTablet ? '24px' : '32px',
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '600',
            color: '#075B7A',
            margin: '0 0 8px 0',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Project Manager Dashboard
        </h2>
        <p style={{ margin: 0, color: '#6b7280', lineHeight: '1.6' }}>
          Track project pipeline and quickly move to the workspace to create, edit, submit, or resubmit projects.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        <MetricCard title="My Projects" value={totalProjects} color="#075B7A" subtitle="All assigned projects" />
        <MetricCard title="Draft" value={draftCount} color="#0f766e" subtitle="Not submitted yet" />
        <MetricCard title="Pending Validation" value={submittedCount} color="#9a3412" subtitle="Waiting Director decision" />
        <MetricCard title="Rejected" value={rejectedCount} color="#b91c1c" subtitle="Needs correction and resubmit" />
      </div>

      <div
        style={{
          ...sectionCardStyle,
          padding: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <Button
            variant="primary"
            onClick={() => setCurrentPage('workspace')}
            style={{ minWidth: '160px' }}
          >
            Open Workspace
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setCurrentPage('workspace')
              setSelectedProjectId('')
              resetForm()
            }}
            style={{ minWidth: '140px' }}
          >
            New Draft
          </Button>
        </div>
      </div>
    </div>
  )

  const renderActivityLogs = () => (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div
        style={{
          ...sectionCardStyle,
          padding: isMobile ? '20px' : isTablet ? '24px' : '32px',
          width: '100%',
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: '0 0 24px 0',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Activity Logs
        </h2>
        <ActivityLogs isSuperAdmin={false} />
      </div>
    </div>
  )

  const renderSettings = () => (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div
        style={{
          ...sectionCardStyle,
          padding: isMobile ? '20px' : isTablet ? '24px' : '32px',
          maxWidth: '600px',
          width: '100%',
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: '0 0 16px 0',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Settings
        </h2>
        <p style={{ color: '#6b7280', margin: 0, fontSize: isMobile ? '14px' : '15px', lineHeight: '1.6' }}>
          Project Manager settings and preferences will be displayed here.
        </p>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboard()
      case 'workspace':
        return renderWorkspace()
      case 'strategic-vision':
        return <PMStrategicVisionView />
      case 'activity-logs':
        return renderActivityLogs()
      case 'settings':
        return renderSettings()
      default:
        return renderDashboard()
    }
  }

  return (
    <>
      <LoadingPage isVisible={logoutMutation.isPending} />
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
          flexDirection: isDesktop ? 'row' : 'column',
        }}
      >
        <Sidebar
          navItems={navItems}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          userName="Project Manager"
          userRole="Project Manager"
          businessRoles={roles}
          onLogout={() => logoutMutation.mutate()}
          onProfileClick={() => navigate('/profile')}
          isMobile={isMobile || isTablet}
          isLoggingOut={logoutMutation.isPending}
        />

        <div
          style={{
            flex: 1,
            transition: 'margin-left 0.3s ease, padding 0.3s ease',
            overflow: 'auto',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8f9fa',
            paddingTop: isMobile || isTablet ? '64px' : 0,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: isMobile ? '16px' : isTablet ? '20px' : '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'stretch',
              minHeight: 'fit-content',
            }}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  )
}
