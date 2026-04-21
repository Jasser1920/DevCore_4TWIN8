import { useNavigate } from 'react-router-dom'
import { useResponsive } from '../hooks/useResponsive'
import AccessibilitySettingsPanel from '../components/shared/AccessibilitySettingsPanel'
import { Button } from '../components/shared/UI'

export default function Accessibility() {
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()

  const headerPadding = isMobile ? '20px' : isTablet ? '24px' : '32px'

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: isMobile ? '16px' : '24px',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: headerPadding,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              color: '#148ABB',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Personal Settings
          </p>
          <h1
            style={{
              margin: '0 0 8px',
              fontSize: isMobile ? '24px' : '30px',
              color: '#1a1a1a',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Accessibility
          </h1>
          <p
            style={{
              margin: 0,
              color: '#6b7280',
              lineHeight: 1.6,
              maxWidth: '760px',
            }}
          >
            This page stores accessibility preferences only for your signed-in user account. Change them here without affecting other users on the same browser.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => navigate('/profile')} ariaLabel="Back to profile">
              Back to Profile
            </Button>
          </div>
        </div>

        <AccessibilitySettingsPanel />
      </div>
    </div>
  )
}
