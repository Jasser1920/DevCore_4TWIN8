import { MailIcon } from '../shared/icons/NavigationIcons'
import AlertMessage from '../shared/AlertMessage'

interface EmailVerificationCardProps {
  onResend: () => void
  isResending: boolean
  message?: string
  error?: string
  isMobile: boolean
}

export default function EmailVerificationCard({
  onResend,
  isResending,
  message,
  error,
  isMobile,
}: EmailVerificationCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: isMobile ? '20px' : '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px',
        borderLeft: '4px solid #fbbf24',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}
      >
        <MailIcon
          style={{
            height: '24px',
            width: '24px',
            color: '#f59e0b',
            minWidth: '24px',
            flexShrink: 0,
          }}
        />
        <div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#92400e',
              margin: '0 0 8px 0',
            }}
          >
            Email Verification Required
          </h3>
          <p
            style={{
              fontSize: '14px',
              color: '#78350f',
              margin: '0 0 12px 0',
            }}
          >
            Your email hasn't been verified yet. Verify your email to unlock all features.
          </p>
        </div>
      </div>

      {message && <AlertMessage type="success" message={message} />}
      {error && <AlertMessage type="error" message={error} />}

      <button
        onClick={onResend}
        disabled={isResending}
        style={{
          padding: '10px 20px',
          backgroundColor: isResending ? '#94a3b8' : '#f59e0b',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          border: 'none',
          borderRadius: '8px',
          cursor: isResending ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) =>
          !isResending && (e.currentTarget.style.backgroundColor = '#d97706')
        }
        onMouseLeave={(e) =>
          !isResending && (e.currentTarget.style.backgroundColor = '#f59e0b')
        }
      >
        {isResending ? 'Sending...' : 'Resend Verification Email'}
      </button>
    </div>
  )
}
