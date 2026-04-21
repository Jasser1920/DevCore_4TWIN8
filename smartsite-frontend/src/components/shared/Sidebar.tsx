import { useState } from 'react'
import type { ComponentType } from 'react'
import logoIcon from '../../assets/logo smartsite.svg'
import { Menu, X, LogOut } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: ComponentType<{ style?: React.CSSProperties }>
}

interface SidebarProps {
  navItems: NavItem[]
  currentPage: string
  onPageChange: (pageId: string) => void
  userName: string
  userRole: string
  businessRoles?: string[]
  onLogout: () => void
  onProfileClick?: () => void
  isMobile: boolean
  isLoggingOut?: boolean
}

export default function Sidebar({
  navItems,
  currentPage,
  onPageChange,
  userName,
  userRole,
  businessRoles = [],
  onLogout,
  onProfileClick,
  isMobile,
  isLoggingOut = false
}: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Get initials from user role (e.g., "Super Admin" -> "SA")
  const getInitials = (role: string): string => {
    return role
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleNavClick = (pageId: string) => {
    onPageChange(pageId)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const sidebarStyle: React.CSSProperties = isMobile ? {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '280px',
    maxWidth: '85vw',
    height: '100vh',
    backgroundColor: '#075B7A',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    zIndex: 1000,
    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease',
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.2)'
  } : {
    width: '256px',
    height: '100vh',
    position: 'sticky',
    top: 0,
    backgroundColor: '#075B7A',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0
  }

  const overlayStyle: React.CSSProperties = sidebarOpen && isMobile ? {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100%',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    cursor: 'pointer'
  } : {
    display: 'none'
  }

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          backgroundColor: '#075B7A',
          color: 'white',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 998,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <button
            onClick={() => {
              onPageChange('dashboard')
              setSidebarOpen(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              padding: 0
            }}
            title="Go to Dashboard"
          >
            <img 
              src={logoIcon} 
              alt="SmartSite" 
              style={{ height: '32px', width: 'auto' }}
            />
            <span style={{ 
              fontSize: '16px', 
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600'
            }}>SMARTSITE</span>
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              padding: '8px'
            }}
          >
            {sidebarOpen ? <X style={{ height: '24px', width: '24px' }} /> : <Menu style={{ height: '24px', width: '24px' }} />}
          </button>
        </div>
      )}

      {/* Overlay for mobile */}
      <div 
        style={overlayStyle}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div style={sidebarStyle}>
        {/* Mobile Close Button */}
        {isMobile && sidebarOpen && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '16px',
            borderBottom: '1px solid #064d66'
          }}>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'white',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Close sidebar"
            >
              <X style={{ height: '24px', width: '24px' }} />
            </button>
          </div>
        )}

        {/* Logo (Desktop only) */}
        {!isMobile && (
          <div style={{ 
            padding: '24px', 
            borderBottom: '1px solid #064d66'
          }}>
            <button
              onClick={() => onPageChange('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'white',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#064d66'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Go to Dashboard"
            >
              <img 
                src={logoIcon} 
                alt="SmartSite" 
                style={{ height: '40px', width: 'auto' }}
              />
              <span style={{ 
                fontSize: '20px', 
                fontFamily: 'Poppins, sans-serif',
                fontWeight: '600'
              }}>SMARTSITE</span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          padding: isMobile ? '16px' : '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                data-tour={`sidebar-nav-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isMobile ? '16px' : '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#148ABB' : 'transparent',
                  color: isActive ? 'white' : '#CAEDF1',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: isMobile ? '16px' : '14px',
                  fontWeight: '500',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => !isActive && !isMobile && (e.currentTarget.style.backgroundColor = '#064d66')}
                onMouseLeave={(e) => !isActive && !isMobile && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Icon style={{ height: '20px', width: '20px', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid #064d66'
        }}>
          {onProfileClick && (
            <button
              onClick={onProfileClick}
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
                transition: 'background 0.2s',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => !isMobile && (e.currentTarget.style.backgroundColor = '#064d66')}
              onMouseLeave={(e) => !isMobile && (e.currentTarget.style.backgroundColor = 'transparent')}
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
                  {getInitials(userRole)}
                </div>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <p style={{ fontSize: '14px', margin: 0, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</p>
                  {businessRoles.length > 0 && (
                    <p style={{ fontSize: '12px', color: '#CAEDF1', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {businessRoles.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )}
          <button
            disabled={isLoggingOut}
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: isMobile ? '16px' : '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#CAEDF1',
              border: 'none',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              opacity: isLoggingOut ? 0.75 : 1,
              fontSize: isMobile ? '16px' : '14px',
              width: '100%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoggingOut && !isMobile) {
                e.currentTarget.style.backgroundColor = '#064d66'
                e.currentTarget.style.color = 'white'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoggingOut && !isMobile) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#CAEDF1'
              }
            }}
          >
            <LogOut style={{ height: '16px', width: '16px', flexShrink: 0 }} />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </>
  )
}
