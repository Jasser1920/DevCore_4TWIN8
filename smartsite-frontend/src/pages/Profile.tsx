import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clearTokens, getRefreshToken } from '../lib/auth'
import { apiFetch } from '../lib/api'
import { useResponsive } from '../hooks/useResponsive'
import LoadingPage from '../components/LoadingPage'

// Custom hooks
import { useProfileData } from '../hooks/profile/useProfileData'
import { usePasswordChange } from '../hooks/profile/usePasswordChange'
import { useEmailVerification } from '../hooks/profile/useEmailVerification'
import { useAccountDeletion } from '../hooks/profile/useAccountDeletion'
import { useRoleBasedNavigation } from '../hooks/profile/useRoleBasedNavigation'

// Components
import Sidebar from '../components/shared/Sidebar'
import ProfileHeader from '../components/Profile/ProfileHeader'
import ProfileUpdateForm from '../components/Profile/ProfileUpdateForm'
import PasswordChangeForm from '../components/Profile/PasswordChangeForm'
import EmailVerificationCard from '../components/Profile/EmailVerificationCard'
import AccountDeletionCard from '../components/Profile/AccountDeletionCard'
import DeletionModal from '../components/Profile/DeletionModal'
import ProfileDeviceManagement from '../components/Profile/ProfileDeviceManagement'
import ProfileActivityLogs from '../components/Profile/ProfileActivityLogs'
import { useAccessibility } from '../contexts/AccessibilityContext'

export default function Profile() {
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()
  const [currentPage, setCurrentPage] = useState('profile')
  const [showDeletionModal, setShowDeletionModal] = useState(false)
  const { settings } = useAccessibility()

  // Use custom hooks for business logic
  const { profileData, isLoading, form, setForm, updateProfile, message, errorMessage } =
    useProfileData()
  const {
    changePassword,
    passwordMessage,
    passwordError,
  } = usePasswordChange()
  const {
    resendVerification,
    isResending,
    resendMessage,
    resendError,
  } = useEmailVerification()
  const {
    deletionStatus,
    requestDeletion,
    cancelDeletion,
    deletionMessage,
    deletionError,
  } = useAccountDeletion()
  const { navItems, handlePageChange: handleRoleNavigation, businessRoles, userRole } = useRoleBasedNavigation()

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

  // Handle page navigation
  const handlePageChange = (pageId: string) => {
    if (pageId === 'profile') {
      setCurrentPage('profile')
    } else {
      handleRoleNavigation(pageId, setCurrentPage)
    }
  }

  // Loading state
  if (isLoading) {
    return (
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
          userName="User"
          userRole="User"
          businessRoles={[]}
          onLogout={() => logoutMutation.mutate()}
          onProfileClick={() => setCurrentPage('profile')}
          isMobile={isMobile || isTablet}
          isLoggingOut={false}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const username = profileData?.user?.preferred_username || 'User'
  const email = profileData?.user?.email || ''
  const roles =
    profileData?.user?.realm_access?.roles
      ?.filter((role: string) =>
        [
          'SUPER_ADMIN',
          'DIRECTOR',
          'PROJECT_MANAGER',
          'QHSE_MANAGER',
          'CLIENT',
        ].includes(role)
      ) || []
  const isEmailVerified = profileData?.user?.email_verified || false

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
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        userName={username}
        userRole={userRole}
        businessRoles={businessRoles}
        onLogout={() => logoutMutation.mutate()}
        onProfileClick={() => setCurrentPage('profile')}
        isMobile={isMobile || isTablet}
        isLoggingOut={logoutMutation.isPending}
      />

      {/* Main Content */}
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
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Profile Header with Avatar */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: isMobile ? '20px' : '32px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                marginBottom: '24px',
              }}
            >
              <ProfileHeader
                username={username}
                email={email}
                roles={roles}
                isEmailVerified={isEmailVerified}
                isMobile={isMobile}
              />

              {/* Profile Update Form */}
              <ProfileUpdateForm
                initialData={form}
                onSubmit={(data) => {
                  setForm(data)
                  updateProfile(data)
                }}
                isLoading={false}
                message={message}
                error={errorMessage}
                isMobile={isMobile}
              />
            </div>

            {/* Email Verification Card - Only if email not verified */}
            {!isEmailVerified && (
              <EmailVerificationCard
                onResend={resendVerification}
                isResending={isResending}
                message={resendMessage}
                error={resendError}
                isMobile={isMobile}
              />
            )}

            {/* Password Change Form */}
            <PasswordChangeForm
              onSubmit={(data) => changePassword(data)}
              isLoading={false}
              message={passwordMessage}
              error={passwordError}
              isMobile={isMobile}
            />

            {/* Accessibility Preferences */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: isMobile ? '20px' : '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: '#1a1a1a' }}>Accessibility</h3>
              <p style={{ margin: '0 0 14px', color: '#6b7280' }}>
                These preferences are saved per user account and restored when you sign back in.
              </p>
              <p style={{ margin: '0 0 14px', color: '#374151', fontSize: '14px' }}>
                Guided tutorials are currently {settings.guidedTipsEnabled ? 'enabled' : 'disabled'} for this account.
              </p>
              <button
                type="button"
                onClick={() => navigate('/accessibility')}
                style={{
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: '#075B7A',
                  color: 'white',
                  padding: '12px 18px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Open Accessibility Page
              </button>
            </div>

            {/* Account Deletion Card */}
            <AccountDeletionCard
              deletionStatus={deletionStatus}
              onRequestDeletion={() => setShowDeletionModal(true)}
              onCancelDeletion={cancelDeletion}
              message={deletionMessage}
              error={deletionError}
              isMobile={isMobile}
            />

            {/* Device Management */}
            <ProfileDeviceManagement isMobile={isMobile} />

            {/* Activity Logs */}
            <ProfileActivityLogs isMobile={isMobile} />
          </div>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      <DeletionModal
        isOpen={showDeletionModal}
        onClose={() => setShowDeletionModal(false)}
        onConfirm={(reason) => {
          requestDeletion(reason)
          setShowDeletionModal(false)
        }}
        isLoading={false}
      />
      </div>
    </>
  )
}
