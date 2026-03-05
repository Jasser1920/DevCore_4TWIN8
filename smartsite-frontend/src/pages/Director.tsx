import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, createStrategicVision, getStrategicVision, getAvailableProjectManagers, assignProjectManager } from '../lib/api'
import { clearTokens, getAccessToken, getRefreshToken, getRolesFromToken, getBusinessRoles } from '../lib/auth'
import { useResponsive } from '../hooks/useResponsive'
import { ActivityLogs } from '../components/ActivityLogs'
import DetailedMetricCard from '../components/shared/UI/DetailedMetricCard'
import logoIcon from '../assets/logo smartsite.svg'

interface StrategicVision {
  id: string
  projectBudget: number
  startDate: string
  endDate: string
  globalKPIs: Array<{ name: string; target: number; unit: string }>
  status: 'DRAFT' | 'PENDING_VALIDATION' | 'APPROVED' | 'REJECTED'
  validationNotes?: string
  validatedAt?: string
}

const Building2 = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const Activity = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

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

const LogOut = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

export default function Director() {
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()
  const roles = getBusinessRoles(getRolesFromToken(getAccessToken()))
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showVisionForm, setShowVisionForm] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')
  const [kpiInputs, setKpiInputs] = useState<Array<{ name: string; target: string; unit: string }>>([
    { name: '', target: '', unit: '' },
  ])
  const [durationError, setDurationError] = useState('')
  const [budgetError, setBudgetError] = useState('')
  const [showPmAssignment, setShowPmAssignment] = useState(false)
  const [selectedPmId, setSelectedPmId] = useState('')

  const { data: companyData, isLoading: companyLoading, error: companyError } = useQuery({
    queryKey: ['director-company'],
    queryFn: async () => {
      return apiFetch<{ data: any | null }>('/companies/my-company', { method: 'GET' })
    },
  })

  const company = companyData?.data || null

  // Strategic Vision Query
  const { data: visionData, isLoading: visionLoading, refetch: refetchVision } = useQuery<StrategicVision | null>({
    queryKey: ['director-strategic-vision', company?.id],
    queryFn: async (): Promise<StrategicVision | null> => {
      if (!company?.id) return null
      try {
        const result = await getStrategicVision(company.id)
        return result as StrategicVision | null
      } catch {
        return null
      }
    },
    enabled: !!company?.id,
  })

  const strategicVision = visionData

  // Strategic Vision Mutation
  const createVisionMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error('Company not found')
      const kpis = kpiInputs
        .filter((k) => k.name && k.target)
        .map((k) => ({
          name: k.name,
          target: parseFloat(k.target),
          unit: k.unit,
        }))
      
      if (kpis.length === 0) throw new Error('At least one KPI is required')

      return createStrategicVision(company.id, {
        projectBudget: parseFloat(budgetInput),
        startDate: startDateInput,
        endDate: endDateInput,
        globalKPIs: kpis,
      })
    },
    onSuccess: () => {
      setShowVisionForm(false)
      setBudgetInput('')
      setStartDateInput('')
      setEndDateInput('')
      setKpiInputs([{ name: '', target: '', unit: '' }])
      setDurationError('')
      setBudgetError('')
      refetchVision()
    },
    onError: (error: any) => {
      setBudgetError(error.message || 'Failed to create strategic vision')
    },
  })

  // Project Manager Query
  const { data: projectManagersData } = useQuery({
    queryKey: ['available-project-managers'],
    queryFn: async () => {
      return getAvailableProjectManagers()
    },
  })

  const projectManagers = projectManagersData?.data || []

  // Assign PM Mutation
  const assignPmMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id || !selectedPmId) throw new Error('Missing required data')
      return assignProjectManager(company.id, selectedPmId)
    },
    onSuccess: () => {
      setShowPmAssignment(false)
      setSelectedPmId('')
      // Refetch company to get updated projectManagerId
      window.location.reload()
    },
  })

  const handleAddKpi = () => {
    setKpiInputs([...kpiInputs, { name: '', target: '', unit: '' }])
  }

  const handleRemoveKpi = (index: number) => {
    setKpiInputs(kpiInputs.filter((_, i) => i !== index))
  }

  const handleKpiChange = (index: number, field: string, value: string) => {
    const newKpis = [...kpiInputs]
    newKpis[index] = { ...newKpis[index], [field]: value }
    setKpiInputs(newKpis)
  }

  const validateDates = () => {
    const start = new Date(startDateInput)
    const end = new Date(endDateInput)
    const now = new Date()

    if (start <= now) {
      setDurationError('Start date must be in the future')
      return false
    }

    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    if (monthsDiff < 1 || monthsDiff > 60) {
      setDurationError('Project duration must be between 1 and 60 months')
      return false
    }

    setDurationError('')
    return true
  }

  const validateBudget = () => {
    const budget = parseFloat(budgetInput)
    if (isNaN(budget) || budget <= 0) {
      setBudgetError('Budget must be a positive number')
      return false
    }

    const MAX_BUDGET = 10000000
    if (budget > MAX_BUDGET) {
      setBudgetError(`Budget cannot exceed $${MAX_BUDGET.toLocaleString()}`)
      return false
    }

    setBudgetError('')
    return true
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

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

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh',
      height: isMobile ? 'auto' : '100vh',
      backgroundColor: '#f9fafb'
    }}>
      {/* Sidebar */}
      <div style={{
        width: isMobile ? '100%' : '256px',
        backgroundColor: '#075B7A',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        <div style={{
          padding: isMobile ? '16px' : '24px',
          borderBottom: '1px solid #064d66'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={logoIcon}
              alt="SmartSite"
              style={{ height: isMobile ? '32px' : '40px', width: 'auto' }}
            />
            <span style={{
              fontSize: isMobile ? '18px' : '20px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600'
            }}>SMARTSITE</span>
          </div>
        </div>

        <nav style={{
          flex: 1,
          padding: isMobile ? '16px' : '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#148ABB' : 'transparent',
                  color: isActive ? 'white' : '#CAEDF1',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  fontWeight: '500',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = '#064d66')}
                onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Icon style={{ height: '20px', width: '20px' }} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div style={{
          padding: '16px',
          borderTop: '1px solid #064d66'
        }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#064d66'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{
                height: '40px',
                width: '40px',
                borderRadius: '50%',
                backgroundColor: '#148ABB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                flexShrink: 0
              }}>
                DI
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '14px', margin: 0, color: 'white' }}>Director</p>
                <p style={{ fontSize: '12px', color: '#CAEDF1', margin: 0 }}>
                  {roles.join(', ')}
                </p>
              </div>
            </div>
          </button>
          <button
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#CAEDF1',
              border: 'none',
              cursor: logoutMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: logoutMutation.isPending ? 0.75 : 1,
              fontSize: '14px',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#064d66'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#CAEDF1'
            }}
          >
            <LogOut style={{ height: '16px', width: '16px' }} />
            <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '16px' : isTablet ? '20px 24px' : '24px 32px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '24px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: 0,
              fontFamily: 'Poppins, sans-serif'
            }}>
              {navItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              {company ? `Managing ${company.name}` : 'Welcome back, Director'}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: isMobile ? '16px' : isTablet ? '24px' : '32px'
        }}>
        {currentPage === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Operations Metrics Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '24px'
            }}>
              <DetailedMetricCard
                icon="📊"
                iconBgColor="#CAEDF1"
                title="Projects Overview"
                stats={[
                  { label: 'Active Projects:', value: 5 },
                  { label: 'Completed:', value: 12 },
                  { label: 'In Progress:', value: 5 },
                  { label: 'Team Members:', value: 24 }
                ]}
              />

              <DetailedMetricCard
                icon="🛡️"
                iconBgColor="#dcfce7"
                title="Safety & QHSE"
                stats={[
                  { label: 'Days Without Incident:', value: 127, valueStyle: 'success' },
                  { label: 'Inspections (Month):', value: '18/20' },
                  { label: 'Open Safety Issues:', value: 3, valueStyle: 'warning' },
                  { label: 'Compliance Rate:', value: '96.5%' }
                ]}
              />

              <DetailedMetricCard
                icon="💰"
                iconBgColor="#fef3c7"
                title="Financial Overview"
                stats={[
                  { label: 'Total Budget:', value: '$2.45M' },
                  { label: 'Current Spend:', value: '$1.82M' },
                  { label: 'Budget Variance:', value: '-$12.3K', valueStyle: 'success' },
                  { label: 'Change Orders:', value: '$48.2K' }
                ]}
              />

              <DetailedMetricCard
                icon="📅"
                iconBgColor="#e0e7ff"
                title="Schedule Performance"
                stats={[
                  { label: 'Projects On Schedule:', value: '4/5 (80%)' },
                  { label: 'Behind Schedule:', value: 1, valueStyle: 'danger' },
                  { label: 'Upcoming Milestones:', value: 6 },
                  { label: 'SPI:', value: '0.97' }
                ]}
              />

              <DetailedMetricCard
                icon="👷"
                iconBgColor="#fed7aa"
                title="Resource Utilization"
                stats={[
                  { label: 'Equipment Utilization:', value: '87%' },
                  { label: 'Labor Hours (Week):', value: '1,248 hrs' },
                  { label: 'Available Crew:', value: '24/28' },
                  { label: 'Subcontractors Active:', value: 3 }
                ]}
              />

              <DetailedMetricCard
                icon="🤝"
                iconBgColor="#fce7f3"
                title="Client Relations"
                stats={[
                  { label: 'Change Requests:', value: 2 },
                  { label: 'Satisfaction Score:', value: '4.6/5.0', valueStyle: 'success' },
                  { label: 'Pending Approvals:', value: 4 },
                  { label: 'Outstanding RFIs:', value: 7 }
                ]}
              />

              <DetailedMetricCard
                icon="📋"
                iconBgColor="#ddd6fe"
                title="Documents & Compliance"
                stats={[
                  { label: 'Pending Review:', value: 8 },
                  { label: 'Active Permits:', value: '12/12', valueStyle: 'success' },
                  { label: 'Contract Milestones:', value: 3 },
                  { label: 'Daily Reports:', value: '100%' }
                ]}
              />

              <DetailedMetricCard
                icon="✅"
                iconBgColor="#ccfbf1"
                title="Quality Metrics"
                stats={[
                  { label: 'Inspections Passed:', value: '94%' },
                  { label: 'Deficiencies Open:', value: 11 },
                  { label: 'Rework Hours (Month):', value: '28 hrs' },
                  { label: 'Punch List Items:', value: 5 }
                ]}
              />

              <DetailedMetricCard
                icon="⚠️"
                iconBgColor="#fee2e2"
                title="Risk Management"
                stats={[
                  { label: 'Active Risks:', value: '4 (1H, 2M, 1L)' },
                  { label: 'Risks Mitigated:', value: 3 },
                  { label: 'Weather Delays:', value: '2 days' },
                  { label: 'Insurance Claims:', value: 0, valueStyle: 'success' }
                ]}
              />
            </div>
          </div>
        )}

        {currentPage === 'company' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {companyLoading && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                Loading company details...
              </div>
            )}

            {!companyLoading && companyError && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px' }}>
                  Failed to load assigned company.
                </div>
              </div>
            )}

            {!companyLoading && !companyError && !company && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ backgroundColor: '#f9fafb', color: '#6b7280', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  No company is assigned to your director account yet.
                </div>
              </div>
            )}

            {!companyLoading && !companyError && company && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '20px' }}>
                    <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Company Name</p>
                      <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '600' }}>{company.name}</p>
                    </div>
                    <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Status</p>
                      <p style={{ margin: 0, fontSize: '16px', color: company.status === 'ACTIVE' ? '#059669' : '#dc2626', fontWeight: '600' }}>
                        {company.status}
                      </p>
                    </div>
                    <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Contact Name</p>
                      <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a' }}>{company.contactName || 'Not set'}</p>
                    </div>
                    <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Contact Email</p>
                      <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a' }}>{company.contactEmail || 'Not set'}</p>
                    </div>
                    <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Storage Quota</p>
                      <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a' }}>
                        {(company.storageQuota / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </p>
                    </div>
                    <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Storage Used</p>
                      <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a' }}>
                        {(company.usedStorage / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </p>
                    </div>
                    <div style={{ gridColumn: isMobile ? '1' : isTablet ? 'span 2' : 'span 3', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Description</p>
                      <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', whiteSpace: 'pre-wrap' }}>
                        {company.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>Strategic Vision</h3>
                    {!showVisionForm && !strategicVision && (
                      <button
                        onClick={() => setShowVisionForm(true)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#075B7A',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Define Vision
                      </button>
                    )}
                  </div>

                  {showVisionForm && !strategicVision && (
                    <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 16px 0' }}>Create Strategic Vision</h4>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                          Project Budget (USD)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 500000"
                          value={budgetInput}
                          onChange={(e) => {
                            setBudgetInput(e.target.value)
                            if (e.target.value) validateBudget()
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '14px',
                            border: budgetError ? '2px solid #dc2626' : '1px solid #d1d5db',
                            borderRadius: '6px',
                            boxSizing: 'border-box'
                          }}
                        />
                        {budgetError && (
                          <p style={{ fontSize: '12px', color: '#dc2626', margin: '6px 0 0 0' }}>{budgetError}</p>
                        )}
                      </div>

                      <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={startDateInput}
                            onChange={(e) => setStartDateInput(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: '14px',
                              border: durationError ? '2px solid #dc2626' : '1px solid #d1d5db',
                              borderRadius: '6px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                            End Date
                          </label>
                          <input
                            type="date"
                            value={endDateInput}
                            onChange={(e) => setEndDateInput(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: '14px',
                              border: durationError ? '2px solid #dc2626' : '1px solid #d1d5db',
                              borderRadius: '6px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>
                      {durationError && (
                        <p style={{ fontSize: '12px', color: '#dc2626', margin: '0 0 16px 0' }}>{durationError}</p>
                      )}

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <label style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>
                            Global KPIs
                          </label>
                          <button
                            onClick={handleAddKpi}
                            style={{
                              padding: '4px 12px',
                              fontSize: '12px',
                              backgroundColor: '#e5e7eb',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#374151'
                            }}
                          >
                            + Add KPI
                          </button>
                        </div>

                        {kpiInputs.map((kpi, index) => (
                          <div key={index} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr) auto', gap: '12px', marginBottom: '12px', alignItems: 'flex-end' }}>
                            <input
                              type="text"
                              placeholder="KPI Name (e.g., Safety Score)"
                              value={kpi.name}
                              onChange={(e) => handleKpiChange(index, 'name', e.target.value)}
                              style={{
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px'
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Target Value"
                              value={kpi.target}
                              onChange={(e) => handleKpiChange(index, 'target', e.target.value)}
                              style={{
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px'
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Unit (e.g., %)"
                              value={kpi.unit}
                              onChange={(e) => handleKpiChange(index, 'unit', e.target.value)}
                              style={{
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px'
                              }}
                            />
                            {kpiInputs.length > 1 && (
                              <button
                                onClick={() => handleRemoveKpi(index)}
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => {
                            if (validateBudget() && validateDates()) {
                              createVisionMutation.mutate()
                            }
                          }}
                          disabled={createVisionMutation.isPending}
                          style={{
                            padding: '10px 16px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: createVisionMutation.isPending ? 0.6 : 1
                          }}
                        >
                          {createVisionMutation.isPending ? 'Creating...' : 'Create Vision'}
                        </button>
                        <button
                          onClick={() => {
                            setShowVisionForm(false)
                            setBudgetInput('')
                            setStartDateInput('')
                            setEndDateInput('')
                            setKpiInputs([{ name: '', target: '', unit: '' }])
                            setDurationError('')
                            setBudgetError('')
                          }}
                          style={{
                            padding: '10px 16px',
                            backgroundColor: '#e5e7eb',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!showVisionForm && strategicVision && (
                    <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #86efac' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                        <div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Project Budget</p>
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                            ${strategicVision.projectBudget.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Duration</p>
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                            {new Date(strategicVision.startDate).toLocaleDateString()} - {new Date(strategicVision.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Status</p>
                          <p style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: '600',
                            color: strategicVision.status === 'APPROVED' ? '#059669' : strategicVision.status === 'REJECTED' ? '#dc2626' : '#f59e0b',
                            display: 'inline-block',
                            padding: '4px 12px',
                            backgroundColor: strategicVision.status === 'APPROVED' ? '#dcfce7' : strategicVision.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                            borderRadius: '4px'
                          }}>
                            {strategicVision.status}
                          </p>
                        </div>
                      </div>

                      {strategicVision.globalKPIs && strategicVision.globalKPIs.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                          <p style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '12px' }}>Global KPIs</p>
                          <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                            {strategicVision.globalKPIs.map((kpi: any, idx: number) => (
                              <div key={idx} style={{
                                padding: '12px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db'
                              }}>
                                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>{kpi.name}</p>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
                                  {kpi.target} {kpi.unit}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {strategicVision.status === 'PENDING_VALIDATION' && (
                        <div style={{ padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', color: '#92400e', fontSize: '13px' }}>
                          ⏳ Awaiting validation from management
                        </div>
                      )}
                    </div>
                  )}

                  {!showVisionForm && !visionLoading && !strategicVision && (
                    <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', padding: '16px' }}>
                      No strategic vision defined yet. Create one to get started.
                    </div>
                  )}

                  {visionLoading && (
                    <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', padding: '16px' }}>
                      Loading strategic vision...
                    </div>
                  )}
                </div>

                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>Project Manager Assignment</h3>
                    {!showPmAssignment && (
                      <button
                        onClick={() => setShowPmAssignment(true)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#075B7A',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        {company.projectManagerId ? 'Change PM' : 'Assign PM'}
                      </button>
                    )}
                  </div>

                  {showPmAssignment && (
                    <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 16px 0' }}>
                        Select Project Manager
                      </h4>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                          Project Manager
                        </label>
                        <select
                          value={selectedPmId}
                          onChange={(e) => setSelectedPmId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            boxSizing: 'border-box',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">Select a Project Manager...</option>
                          {projectManagers.map((pm: any) => (
                            <option key={pm.id} value={pm.id}>
                              {pm.firstName} {pm.lastName} ({pm.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => assignPmMutation.mutate()}
                          disabled={!selectedPmId || assignPmMutation.isPending}
                          style={{
                            padding: '10px 16px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: selectedPmId && !assignPmMutation.isPending ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: '500',
                            opacity: selectedPmId && !assignPmMutation.isPending ? 1 : 0.6
                          }}
                        >
                          {assignPmMutation.isPending ? 'Assigning...' : 'Assign'}
                        </button>
                        <button
                          onClick={() => {
                            setShowPmAssignment(false)
                            setSelectedPmId('')
                          }}
                          style={{
                            padding: '10px 16px',
                            backgroundColor: '#e5e7eb',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!showPmAssignment && company.projectManagerId && (
                    <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #86efac' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                        Currently Assigned
                      </p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                        {projectManagers.find((pm: any) => pm.id === company.projectManagerId)
                          ? `${projectManagers.find((pm: any) => pm.id === company.projectManagerId).firstName} ${projectManagers.find((pm: any) => pm.id === company.projectManagerId).lastName}`
                          : 'Project Manager ID: ' + company.projectManagerId}
                      </p>
                    </div>
                  )}

                  {!showPmAssignment && !company.projectManagerId && (
                    <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', padding: '16px' }}>
                      No Project Manager assigned yet. Click "Assign PM" to assign one.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

            {currentPage === 'activity-logs' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 8px 0',
              fontFamily: 'Poppins, sans-serif'
            }}>
              My Activity Log
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>
              Only activities from your account are displayed.
            </p>
            <ActivityLogs isSuperAdmin={false} />
          </div>
        )}

        {currentPage === 'settings' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 8px 0',
              fontFamily: 'Poppins, sans-serif'
            }}>
              Settings
            </h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>
              Use your profile page to manage account information.
            </p>
            <button
              onClick={() => navigate('/profile')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#148ABB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#117a9d'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#148ABB'}
            >
              Go to Profile
            </button>
          </div>
        )}
        </main>
      </div>
    </div>
  )
}
