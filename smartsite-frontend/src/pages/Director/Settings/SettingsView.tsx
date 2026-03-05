// Placeholder for Settings View
import { useResponsive } from '../../../hooks/useResponsive'

export default function SettingsView() {
  const { isMobile, isTablet } = useResponsive()
  
  const cardPadding = isMobile ? '20px' : isTablet ? '24px' : '32px'
  const cardMaxWidth = '600px'

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: cardPadding,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        maxWidth: cardMaxWidth,
        width: '100%'
      }}>
        <h2 style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: '600',
          color: '#1a1a1a',
          margin: '0 0 16px 0',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Settings
        </h2>
        <p style={{ 
          color: '#6b7280',
          margin: 0,
          fontSize: isMobile ? '14px' : '15px',
          lineHeight: '1.6'
        }}>
          User settings and preferences will be displayed here.
        </p>
      </div>
    </div>
  )
}
