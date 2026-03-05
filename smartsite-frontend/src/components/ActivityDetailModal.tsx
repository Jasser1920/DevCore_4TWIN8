import { Modal, Status } from './shared/UI'
import { X } from 'lucide-react'

interface ActivityLog {
  _id: string
  userId: string
  username: string
  action: string
  description: string
  details?: any
  ipAddress?: string
  userAgent?: string
  status: 'SUCCESS' | 'FAILED' | 'INFO'
  performedBy?: string
  timestamp: string
}

interface ActivityDetailModalProps {
  activity: ActivityLog | null
  onClose: () => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  if (!activity) return null

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
            Activity Details
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

        {/* Activity Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Action */}
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
              Action
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1a1a1a',
              fontWeight: '500'
            }}>
              {activity.action.replace(/_/g, ' ')}
            </div>
          </div>

          {/* Description */}
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
              Description
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1a1a1a',
              lineHeight: '1.5'
            }}>
              {activity.description}
            </div>
          </div>

          {/* Status */}
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
              Status
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Status
                type={
                  activity.status === 'SUCCESS' ? 'success' :
                  activity.status === 'FAILED' ? 'error' :
                  'info'
                }
                label={activity.status}
                size="small"
                icon={true}
              />
            </div>
          </div>

          {/* User Information */}
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
                User
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1a1a1a'
              }}>
                {activity.username}
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
                {activity.userId}
              </div>
            </div>
          </div>

          {/* Timestamp */}
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
              Date & Time
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1a1a1a'
            }}>
              {formatDate(activity.timestamp)}
            </div>
          </div>

          {/* IP Address */}
          {activity.ipAddress && (
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
                IP Address
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1a1a1a',
                fontFamily: 'monospace'
              }}>
                {activity.ipAddress}
              </div>
            </div>
          )}

          {/* User Agent */}
          {activity.userAgent && (
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
                User Agent
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#6b7280',
                fontFamily: 'monospace',
                overflowWrap: 'break-word',
                maxHeight: '120px',
                overflow: 'auto'
              }}>
                {activity.userAgent}
              </div>
            </div>
          )}

          {/* Additional Details (JSON) */}
          {activity.details && Object.keys(activity.details).length > 0 && (
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
                Additional Details
              </label>
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#1a1a1a',
                fontFamily: 'monospace',
                overflowWrap: 'break-word',
                maxHeight: '200px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {JSON.stringify(activity.details, null, 2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
