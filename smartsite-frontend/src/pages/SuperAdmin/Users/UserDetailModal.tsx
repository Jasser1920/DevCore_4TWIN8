import { Modal, Status } from '../../../components/shared/UI'
import { X } from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  isEmailVerified: boolean
  phoneNumber?: string
  createdAt?: string
  updatedAt?: string
}

interface UserDetailModalProps {
  user: User | null
  onClose: () => void
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  if (!user) return null

  return (
    <Modal isOpen={true} onClose={onClose} title="">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '600px'
      }}>
        {/* Header with title and close button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0
          }}>
            User Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '20px'
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Full Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Full Name
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1a1a1a',
              fontWeight: '500'
            }}>
              {user.firstName} {user.lastName}
            </div>
          </div>

          {/* Username and Email Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Username
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1a1a1a'
              }}>
                {user.username}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Email
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1a1a1a',
                overflowWrap: 'break-word'
              }}>
                {user.email}
              </div>
            </div>
          </div>

          {/* Role and Email Verification Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Role
              </label>
              <div style={{
                padding: '4px 12px',
                backgroundColor: '#CAEDF1',
                color: '#075B7A',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                display: 'inline-block'
              }}>
                {user.role}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Email Verification
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Status
                  type={user.isEmailVerified ? 'success' : 'error'}
                  label={user.isEmailVerified ? 'Verified' : 'Not Verified'}
                  size="small"
                  icon={true}
                />
              </div>
            </div>
          </div>

          {/* Phone Number */}
          {user.phoneNumber && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Phone Number
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1a1a1a'
              }}>
                {user.phoneNumber}
              </div>
            </div>
          )}

          {/* Created Date */}
          {user.createdAt && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Created Date
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1a1a1a'
              }}>
                {formatDate(user.createdAt)}
              </div>
            </div>
          )}

          {/* Last Updated */}
          {user.updatedAt && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px'
              }}>
                Last Updated
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1a1a1a'
              }}>
                {formatDate(user.updatedAt)}
              </div>
            </div>
          )}

          {/* User ID */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              User ID
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'monospace',
              overflowWrap: 'break-word'
            }}>
              {user.id}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
