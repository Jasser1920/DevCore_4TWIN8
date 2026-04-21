import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getBusinessRoles,
  getRolesFromToken,
  getSubjectFromToken,
} from '../../lib/auth'
import { useResponsive } from '../../hooks/useResponsive'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import LoadingPage from '../../components/LoadingPage'
import Sidebar from '../../components/shared/Sidebar'
import GuidedTourOverlay from '../../components/shared/GuidedTourOverlay'
import FloatingTutorialButton from '../../components/shared/FloatingTutorialButton'
import NotificationsPanel from '../../components/NotificationsPanel'
import {
  LayoutDashboard,
  Settings,
} from '../../components/shared/icons/NavigationIcons'
import Dashboard from './Dashboard'
import AssignedSitesView from './AssignedSites/AssignedSitesView'
import ReportsQueueView from './ReportsQueue/ReportsQueueView'
import AiValidationView from './AiValidation/AiValidationView'
import CorrectiveActionsView from './CorrectiveActions/CorrectiveActionsView'
import EscalationsView from './Escalations/EscalationsView'
import SettingsView from './Settings/SettingsView'

const MapPin = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const ClipboardList = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

const BrainCircuit = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const Wrench = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  </svg>
)

const AlertTriangle = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const Bell = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

export default function QhseManager() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const { settings } = useAccessibility()
  const businessRoles = getBusinessRoles(getRolesFromToken(getAccessToken()))
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showGuidedTour, setShowGuidedTour] = useState(false)

  const guidedTourStepsByPage: Record<string, Array<{ selector: string; title: string; description: string }>> = {
    dashboard: [
      {
        selector: '[data-tour="sidebar-nav-reports-queue"]',
        title: 'Open Reports Queue',
        description: 'Reports Queue is one of your main workflows as QHSE Manager.',
      },
      {
        selector: '[data-tour="qhse-page-dashboard"]',
        title: 'Dashboard Overview',
        description: 'Use dashboard metrics to monitor site safety and compliance.',
      },
    ],
    notifications: [
      {
        selector: '[data-tour="qhse-page-notifications"]',
        title: 'Notifications',
        description: 'Review safety alerts and events, then jump to the linked pages.',
      },
    ],
    'assigned-sites': [
      {
        selector: '[data-tour="qhse-page-assigned-sites"]',
        title: 'Assigned Sites',
        description: 'View and manage all construction sites assigned to you.',
      },
    ],
    'reports-queue': [
      {
        selector: '[data-tour="qhse-page-reports-queue"]',
        title: 'Reports Queue',
        description: 'Review and process incoming QHSE reports from sites.',
      },
    ],
    'ai-validation': [
      {
        selector: '[data-tour="qhse-page-ai-validation"]',
        title: 'AI Validation',
        description: 'Use AI-assisted tools to validate QHSE compliance data.',
      },
    ],
    'corrective-actions': [
      {
        selector: '[data-tour="qhse-page-corrective-actions"]',
        title: 'Corrective Actions',
        description: 'Track and manage corrective actions for identified issues.',
      },
    ],
    escalations: [
      {
        selector: '[data-tour="qhse-page-escalations"]',
        title: 'Escalations',
        description: 'Handle escalated safety incidents requiring urgent attention.',
      },
    ],
    settings: [
      {
        selector: '[data-tour="qhse-page-settings"]',
        title: 'Settings',
        description: 'Use accessibility options to control guided tutorials per user.',
      },
    ],
  }

  const guidedTourSteps = guidedTourStepsByPage[currentPage] || []

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await Promise.race([
        apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({
            accessToken: getAccessToken(),
            refreshToken: getRefreshToken(),
          }),
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

  const handleLogout = () => logoutMutation.mutate()

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu)
    navigate('/profile')
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'assigned-sites', label: 'Assigned Sites', icon: MapPin },
    { id: 'reports-queue', label: 'Reports Queue', icon: ClipboardList },
    { id: 'ai-validation', label: 'AI Validation', icon: BrainCircuit },
    { id: 'corrective-actions', label: 'Corrective Actions', icon: Wrench },
    { id: 'escalations', label: 'Escalations', icon: AlertTriangle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const view = params.get('view')
    if (!view) return
    if (navItems.some((item) => item.id === view)) setCurrentPage(view)
  }, [location.search])

  useEffect(() => {
    if (!settings.guidedTipsEnabled) return
    const subject = getSubjectFromToken(getAccessToken()) || 'anonymous'
    const markerKey = `guided-tour-shown:${subject}:QHSE:${currentPage}`
    if (guidedTourSteps.length > 0 && !sessionStorage.getItem(markerKey)) {
      setShowGuidedTour(true)
      sessionStorage.setItem(markerKey, 'true')
    }
  }, [settings.guidedTipsEnabled, currentPage, guidedTourSteps.length])

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <div data-tour="qhse-page-dashboard"><Dashboard /></div>
      case 'notifications':
        return <div data-tour="qhse-page-notifications"><NotificationsPanel /></div>
      case 'assigned-sites':
        return <div data-tour="qhse-page-assigned-sites"><AssignedSitesView /></div>
      case 'reports-queue':
        return <div data-tour="qhse-page-reports-queue"><ReportsQueueView /></div>
      case 'ai-validation':
        return <div data-tour="qhse-page-ai-validation"><AiValidationView /></div>
      case 'corrective-actions':
        return <div data-tour="qhse-page-corrective-actions"><CorrectiveActionsView /></div>
      case 'escalations':
        return <div data-tour="qhse-page-escalations"><EscalationsView /></div>
      case 'settings':
        return <div data-tour="qhse-page-settings"><SettingsView /></div>
      default:
        return <div data-tour="qhse-page-dashboard"><Dashboard /></div>
    }
  }

  const contentPadding = isMobile ? '16px' : isTablet ? '20px' : '32px'

  return (
    <>
      <LoadingPage isVisible={logoutMutation.isPending} />
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        flexDirection: isDesktop ? 'row' : 'column',
      }}>
        <Sidebar
          navItems={navItems}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          userName="QHSE Manager"
          userRole="QHSE Manager"
          businessRoles={businessRoles}
          onLogout={handleLogout}
          onProfileClick={handleProfileClick}
          isMobile={isMobile || isTablet}
          isLoggingOut={logoutMutation.isPending}
        />
        <div style={{
          flex: 1,
          marginLeft: 0,
          transition: 'margin-left 0.3s ease, padding 0.3s ease',
          overflow: 'auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f8f9fa',
          paddingTop: isMobile || isTablet ? '64px' : 0,
        }}>
          <div style={{
            flex: 1,
            padding: contentPadding,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            minHeight: 'fit-content',
          }}>
            {renderContent()}
            <GuidedTourOverlay
              isOpen={showGuidedTour}
              steps={guidedTourSteps}
              onClose={() => setShowGuidedTour(false)}
            />
            <FloatingTutorialButton
              onClick={() => setShowGuidedTour(true)}
              disabled={guidedTourSteps.length === 0}
              title="Start QHSE Manager tutorial"
            />
          </div>
        </div>
      </div>
    </>
  )
}
