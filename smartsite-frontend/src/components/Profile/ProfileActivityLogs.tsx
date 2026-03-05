import { ActivityLogs } from '../ActivityLogs'

interface ProfileActivityLogsProps {
  isMobile: boolean
}

export default function ProfileActivityLogs({ isMobile }: ProfileActivityLogsProps) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: isMobile ? '20px' : '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1a1a1a',
          margin: '0 0 24px 0',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        Latest Activity
      </h2>
      <ActivityLogs isSuperAdmin={false} variant="compact" />
    </div>
  )
}
