import { useResponsive } from '../../../hooks/useResponsive'
import { ActivityLogs } from '../../../components/ActivityLogs'

export default function ActivityLogsView() {
  const { isMobile, isTablet } = useResponsive()
  
  const cardPadding = isMobile ? '20px' : isTablet ? '24px' : '32px'

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
        width: '100%'
      }}>
        <h2 style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: '600',
          color: '#1a1a1a',
          margin: '0 0 24px 0',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Activity Logs
        </h2>
        <ActivityLogs isSuperAdmin={true} />
      </div>
    </div>
  )
}
