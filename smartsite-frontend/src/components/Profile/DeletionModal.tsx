import { useState } from 'react'

interface DeletionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
}

export default function DeletionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: DeletionModalProps) {
  const [deletionReason, setDeletionReason] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(deletionReason)
    setDeletionReason('')
  }

  const handleClose = () => {
    setDeletionReason('')
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#991b1b',
            margin: '0 0 12px 0',
          }}
        >
          Request Account Deletion
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 16px 0',
            lineHeight: 1.6,
          }}
        >
          This will permanently delete your account and all associated data after a
          30-day grace period. During this time, you can cancel the deletion request
          anytime.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px',
            }}
          >
            Reason for deletion (optional)
          </label>
          <textarea
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            placeholder="Please let us know why you're deleting your account..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              outline: 'none',
              minHeight: '100px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#ef4444')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) =>
              !isLoading && (e.currentTarget.style.backgroundColor = '#d1d5db')
            }
            onMouseLeave={(e) =>
              !isLoading && (e.currentTarget.style.backgroundColor = '#e5e7eb')
            }
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: isLoading ? '#94a3b8' : '#ef4444',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) =>
              !isLoading && (e.currentTarget.style.backgroundColor = '#dc2626')
            }
            onMouseLeave={(e) =>
              !isLoading && (e.currentTarget.style.backgroundColor = '#ef4444')
            }
          >
            {isLoading ? 'Requesting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
