import { TrashIcon } from '../shared/icons/NavigationIcons'
import AlertMessage from '../shared/AlertMessage'

interface AccountDeletionCardProps {
  deletionStatus?: {
    hasPendingDeletion: boolean
    scheduledDate?: string
  }
  onRequestDeletion: () => void
  onCancelDeletion: () => void
  message?: string
  error?: string
  isMobile: boolean
}

export default function AccountDeletionCard({
  deletionStatus,
  onRequestDeletion,
  onCancelDeletion,
  message,
  error,
  isMobile,
}: AccountDeletionCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: isMobile ? '20px' : '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px',
        borderLeft: deletionStatus?.hasPendingDeletion
          ? '4px solid #ef4444'
          : '4px solid #e5e7eb',
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
        <TrashIcon
          style={{
            height: '24px',
            width: '24px',
            color: '#ef4444',
            minWidth: '24px',
            flexShrink: 0,
          }}
        />
        <div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#991b1b',
              margin: '0 0 8px 0',
            }}
          >
            {deletionStatus?.hasPendingDeletion
              ? 'Account Deletion Pending'
              : 'Delete Account'}
          </h3>
          <p
            style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 12px 0',
              lineHeight: 1.6,
            }}
          >
            {deletionStatus?.hasPendingDeletion
              ? `Your account is scheduled for deletion. You have a 30-day grace period to cancel this request.`
              : 'Permanently delete your account and all associated data. This action cannot be undone.'}
          </p>
        </div>
      </div>

      {message && <AlertMessage type="success" message={message} />}
      {error && <AlertMessage type="error" message={error} />}

      {deletionStatus?.hasPendingDeletion ? (
        <button
          onClick={onCancelDeletion}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = '#059669')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = '#10b981')
          }
        >
          Cancel Deletion Request
        </button>
      ) : (
        <button
          onClick={onRequestDeletion}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = '#dc2626')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = '#ef4444')
          }
        >
          Request Account Deletion
        </button>
      )}
    </div>
  )
}
