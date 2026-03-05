import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { clearTokens, getAccessToken, getRolesFromToken, getRefreshToken, getBusinessRoles } from '../../lib/auth'
import { apiFetch } from '../../lib/api'
import { useResponsive } from '../../hooks/useResponsive'
import LoadingPage from '../../components/LoadingPage'
import Sidebar from '../../components/shared/Sidebar'
import Dashboard from './Dashboard'
import { CreateUserForm, UsersList, useUsers } from './Users'
import { CompaniesList, CreateCompanyForm } from './Companies'
import ActivityLogsView from './ActivityLogs/ActivityLogsView'
import SettingsView from './Settings/SettingsView'
import { useCompanies } from './Companies/useCompanies'

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

export default function SuperAdmin() {
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()
  const [currentPage, setCurrentPage] = useState('dashboard')
  
  const tokenRoles = getRolesFromToken(getAccessToken())
  const businessRoles = getBusinessRoles(tokenRoles)

  // Fetch data for dashboard
  const { users } = useUsers()
  const { companies } = useCompanies()

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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

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
            <Dashboard usersCount={users.length} companiesCount={companies.length} users={users} />
          )}

          {currentPage === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <CreateUserForm />
              <UsersList />
            </div>
          )}

          {currentPage === 'companies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <CreateCompanyForm />
              <CompaniesList />
            </div>
          )}

          {currentPage === 'activity-logs' && <ActivityLogsView />}

          {currentPage === 'settings' && <SettingsView />}
        </div>
      </div>
      </div>
    </>
  )
}
