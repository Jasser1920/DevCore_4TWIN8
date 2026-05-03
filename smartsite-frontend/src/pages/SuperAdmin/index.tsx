import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  clearTokens,
  getAccessToken,
  getRolesFromToken,
  getRefreshToken,
  getBusinessRoles,
  getSubjectFromToken,
} from '../../lib/auth'
import { apiFetch } from '../../lib/api'
import { useResponsive } from '../../hooks/useResponsive'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import LoadingPage from '../../components/LoadingPage'
import Sidebar from '../../components/shared/Sidebar'
import GuidedTourOverlay from '../../components/shared/GuidedTourOverlay'
import FloatingTutorialButton from '../../components/shared/FloatingTutorialButton'
import Dashboard from './Dashboard'
import { CreateUserForm, UsersList} from './Users'
import { CompaniesList, CreateCompanyForm } from './Companies'
import ActivityLogsView from './ActivityLogs/ActivityLogsView'
import SettingsView from './Settings/SettingsView'
import NotificationsPanel from '../../components/NotificationsPanel'

// Icon Components
const Building2 = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const Users = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

const Bell = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

export default function SuperAdmin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile, isTablet } = useResponsive()
  const { settings } = useAccessibility()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showGuidedTour, setShowGuidedTour] = useState(false)
  
  const tokenRoles = getRolesFromToken(getAccessToken())
  const businessRoles = getBusinessRoles(tokenRoles)



  // Protect this page - only Super Admin can access
  useEffect(() => {
    if (!tokenRoles.includes('SUPER_ADMIN')) {
      navigate('/login', { replace: true })
    }
  }, [tokenRoles, navigate])

  // Logout mutation
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const guidedTourStepsByPage: Record<string, Array<{ selector: string; title: string; description: string }>> = {
    dashboard: [
      {
        selector: '[data-tour="sa-page-dashboard"]',
        title: 'Super Admin Dashboard',
        description: 'Monitor platform health, totals, and cross-tenant operations.',
      },
    ],
    notifications: [
      {
        selector: '[data-tour="sa-page-notifications"]',
        title: 'Notifications',
        description: 'Review admin events and jump directly to affected modules.',
      },
    ],
    users: [
      {
        selector: '[data-tour="sa-create-user-username"]',
        title: 'Enter Username',
        description: 'Start by entering a clear username for the new account.',
      },
      {
        selector: '[data-tour="sa-create-user-email"]',
        title: 'Enter Email',
        description: 'Use a valid email because verification and communication depend on it.',
      },
      {
        selector: '[data-tour="sa-create-user-role"]',
        title: 'Choose Role',
        description: 'Select the business role carefully to grant the correct permissions.',
      },
      {
        selector: '[data-tour="sa-create-user-submit"]',
        title: 'Create User',
        description: 'Submit to create the user and trigger account provisioning.',
      },
    ],
    companies: [
      {
        selector: '[data-tour="sa-create-company-name"]',
        title: 'Enter Company Name',
        description: 'Provide a clear company name for tenant creation.',
      },
      {
        selector: '[data-tour="sa-create-company-director"]',
        title: 'Assign Director',
        description: 'Assign a verified Director to manage this company.',
      },
      {
        selector: '[data-tour="sa-create-company-submit"]',
        title: 'Create Company',
        description: 'Submit to create the company record and assignment.',
      },
    ],
    'activity-logs': [
      {
        selector: '[data-tour="sa-page-activity-logs"]',
        title: 'Activity Logs',
        description: 'Audit platform actions for governance and troubleshooting.',
      },
    ],
    settings: [
      {
        selector: '[data-tour="sa-page-settings"]',
        title: 'Settings',
        description: 'Use accessibility preferences to manage guided tutorials per user.',
      },
    ],
  }

  const guidedTourSteps = guidedTourStepsByPage[currentPage] || []

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const view = params.get('view')
    if (!view) return

    const isValid = navItems.some((item) => item.id === view)
    if (isValid) {
      setCurrentPage(view)
    }
  }, [location.search])

  useEffect(() => {
    if (!settings.guidedTipsEnabled) return

    const token = getAccessToken()
    const subject = getSubjectFromToken(token) || 'anonymous'
    const markerKey = `guided-tour-shown:${subject}:SUPER_ADMIN:${currentPage}`

    if (guidedTourSteps.length > 0 && !sessionStorage.getItem(markerKey)) {
      setShowGuidedTour(true)
      sessionStorage.setItem(markerKey, 'true')
    }
  }, [settings.guidedTipsEnabled, currentPage, guidedTourSteps.length])

  // Responsive sizing
  const headerPadding = isMobile ? '16px' : isTablet ? '20px' : '32px'
  const contentPadding = isMobile ? '16px' : isTablet ? '24px' : '32px'

  return (
    <>
      <LoadingPage isVisible={logoutMutation.isPending} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          minHeight: '100vh',
          backgroundColor: '#f9fafb'
        }}
      >
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        userName="Super Admin"
        userRole="Super Admin"
        businessRoles={businessRoles}
        onLogout={() => logoutMutation.mutate()}
        onProfileClick={() => navigate('/profile')}
        isMobile={isMobile || isTablet}
        isLoggingOut={logoutMutation.isPending}
      />

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        minHeight: isMobile ? 'auto' : '100vh',
        paddingTop: isMobile || isTablet ? '64px' : 0
      }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
            padding: headerPadding,
            flexShrink: 0
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? '20px' : isTablet ? '22px' : '28px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: 0,
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            {navItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
          </h1>
        </div>

        {/* Page Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: contentPadding,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 'fit-content'
          }}
        >
          {currentPage === 'dashboard' && (
            <div data-tour="sa-page-dashboard">
              <Dashboard />
            </div>
          )}

          {currentPage === 'notifications' && <div data-tour="sa-page-notifications"><NotificationsPanel /></div>}

          {currentPage === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} data-tour="sa-page-users">
              <CreateUserForm />
              <UsersList />
            </div>
          )}

          {currentPage === 'companies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} data-tour="sa-page-companies">
              <CreateCompanyForm />
              <CompaniesList />
            </div>
          )}

          {currentPage === 'activity-logs' && <div data-tour="sa-page-activity-logs"><ActivityLogsView /></div>}

          {currentPage === 'settings' && <div data-tour="sa-page-settings"><SettingsView /></div>}

          <GuidedTourOverlay
            isOpen={showGuidedTour}
            steps={guidedTourSteps}
            onClose={() => setShowGuidedTour(false)}
          />
          <FloatingTutorialButton
            onClick={() => setShowGuidedTour(true)}
            disabled={guidedTourSteps.length === 0}
            title="Start Super Admin tutorial"
          />
        </div>
      </div>
      </div>
    </>
  )
}
