import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { clearTokens, getAccessToken, getRefreshToken, getRolesFromToken, getBusinessRoles } from '../lib/auth'
import { useResponsive } from '../hooks/useResponsive'
import LoadingPage from '../components/LoadingPage'
import logoIcon from '../assets/logo smartsite.svg'

const LogOut = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

export default function ProjectManager() {
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()
  const roles = getBusinessRoles(getRolesFromToken(getAccessToken()))

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
    <>
      <LoadingPage isVisible={logoutMutation.isPending} />
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: isMobile ? '16px' : isTablet ? '24px' : '32px'
      }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center',
          marginBottom: '32px',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '16px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img 
              src={logoIcon} 
              alt="SmartSite" 
              style={{ height: isMobile ? '40px' : '48px', width: 'auto' }}
            />
            <h1 style={{
              fontSize: isMobile ? '24px' : '28px',
              fontWeight: '600',
              color: '#075B7A',
              margin: 0,
              fontFamily: 'Poppins, sans-serif'
            }}>
              Project Manager Dashboard
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
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          >
            <LogOut style={{ height: '18px', width: '18px' }} />
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>

        {/* Welcome Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#075B7A',
            margin: '0 0 16px 0',
            fontFamily: 'Poppins, sans-serif'
          }}>
            Welcome, Project Manager
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0 0 8px 0',
            lineHeight: '1.6'
          }}>
            You have successfully authenticated. This is the Project Manager dashboard where you can track tasks, manage teams, and update project progress.
          </p>
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#CAEDF1',
            border: '1px solid #148ABB',
            borderRadius: '8px',
            color: '#075B7A'
          }}>
            <strong>Current Roles:</strong> {roles.join(', ')}
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* My Projects */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 16px 0'
            }}>
              My Projects
            </h3>
            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>📋 <strong>Assigned Projects:</strong> 3</p>
              <p style={{ margin: '0 0 8px 0' }}>⏳ <strong>In Progress:</strong> 2</p>
              <p style={{ margin: '0 0 8px 0' }}>✅ <strong>Completed:</strong> 8</p>
              <p style={{ margin: 0 }}>🎯 <strong>On Track:</strong> 100%</p>
            </div>
          </div>

          {/* Tasks & Activities */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 16px 0'
            }}>
              Tasks & Activities
            </h3>
            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>📝 <strong>Total Tasks:</strong> 24</p>
              <p style={{ margin: '0 0 8px 0' }}>✅ <strong>Completed:</strong> 16</p>
              <p style={{ margin: '0 0 8px 0' }}>⏳ <strong>Pending:</strong> 5</p>
              <p style={{ margin: 0 }}>🔴 <strong>Overdue:</strong> 3</p>
            </div>
          </div>

          {/* Team Members */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 16px 0'
            }}>
              Team Members
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button style={{
                padding: '10px 16px',
                backgroundColor: '#075B7A',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'left'
              }}>
                👥 View Team (8 members)
              </button>
              <button style={{
                padding: '10px 16px',
                backgroundColor: '#148ABB',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'left'
              }} onClick={() => navigate('/profile')}>
                👤 View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
