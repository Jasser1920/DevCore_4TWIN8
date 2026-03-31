import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { clearTokens, getAccessToken, getRefreshToken, getBusinessRoles, getRolesFromToken } from '../../lib/auth'
import { useResponsive } from '../../hooks/useResponsive'
import LoadingPage from '../../components/LoadingPage'
import Sidebar from '../../components/shared/Sidebar'
import Dashboard from './Dashboard'
import CompanyView from './Company/CompanyView'
import ActivityLogsView from './ActivityLogs/ActivityLogsView'
import SettingsView from './Settings/SettingsView'
import ValidationQueueView from './Validation/ValidationQueueView'
import ProjectOverviewView from './Projects/ProjectOverviewView'
import StrategicVisionValidationView from './StrategicVision/StrategicVisionValidationView'

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

const ClipboardCheck = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const FolderKanban = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h3m2 0h3m-8 3h5" />
  </svg>
)

const Target = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m0-12.14l2.83 2.83m4.48 4.48l2.83 2.83M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

export default function Director() {
  const navigate = useNavigate()
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const businessRoles = getBusinessRoles(getRolesFromToken(getAccessToken()))
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          accessToken: getAccessToken(),
          refreshToken: getRefreshToken()
        })
      })
    },
    onSuccess: () => {
      clearTokens()
      navigate('/login', { replace: true })
    },
    onError: () => {
      clearTokens()
      navigate('/login', { replace: true })
    }
  })

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu)
    navigate('/profile')
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'project-overview', label: 'Project Overview', icon: FolderKanban },
    { id: 'strategic-vision', label: 'Strategic Vision', icon: Target },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'validation', label: 'Validation Queue', icon: ClipboardCheck },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'project-overview':
        return <ProjectOverviewView />
      case 'strategic-vision':
        return <StrategicVisionValidationView />
      case 'company':
        return <CompanyView />
      case 'activity-logs':
        return <ActivityLogsView />
      case 'validation':
        return <ValidationQueueView />
      case 'settings':
        return <SettingsView />
      default:
        return <Dashboard />
    }
  }

  // Responsive sizing
  const contentPadding = isMobile ? '16px' : isTablet ? '20px' : '32px'
  const sidebarMargin = isDesktop ? 0 : 0

  return (
    <>
      <LoadingPage isVisible={logoutMutation.isPending} />
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        flexDirection: isDesktop ? 'row' : 'column'
      }}>
      <Sidebar
        navItems={navItems}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        userName="Director"
        userRole="Director"
        businessRoles={businessRoles}
        onLogout={handleLogout}
        onProfileClick={handleProfileClick}
        isMobile={isMobile || isTablet}
        isLoggingOut={logoutMutation.isPending}
      />

      <div style={{
        flex: 1,
        marginLeft: sidebarMargin,
        transition: 'margin-left 0.3s ease, padding 0.3s ease',
        overflow: 'auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa',
        paddingTop: isMobile || isTablet ? '64px' : 0
      }}>
        <div style={{
          flex: 1,
          padding: contentPadding,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          minHeight: 'fit-content'
        }}>
          {renderContent()}
        </div>
      </div>
      </div>
    </>
  )
}
