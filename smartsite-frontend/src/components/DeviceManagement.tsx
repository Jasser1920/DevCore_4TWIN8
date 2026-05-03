import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../lib/api'

interface Device {
  _id: string
  deviceId: string
  deviceName: string
  lastUsed: string
  createdAt: string
  trusted: boolean
  ipAddress?: string
  userAgent?: string
}

const DeviceIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const TrashIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export default function DeviceManagement() {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      return apiFetch<Device[]>('/devices', { method: 'GET' })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      return apiFetch(`/devices/${deviceId}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      setMessage('Device removed successfully!')
      setErrorMessage('')
      setTimeout(() => setMessage(''), 3000)
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
      setMessage('')
    },
  })

  const removeAllMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/devices', { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      setMessage('All devices removed successfully!')
      setErrorMessage('')
      setTimeout(() => setMessage(''), 3000)
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
      setMessage('')
    },
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Loading devices...
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1a1a1a',
          margin: 0
        }}>
          Trusted Devices
        </h2>
        {devices && devices.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to remove all trusted devices?')) {
                removeAllMutation.mutate()
              }
            }}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              color: '#dc2626',
              backgroundColor: 'transparent',
              border: '1px solid #dc2626',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Remove All
          </button>
        )}
      </div>

      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '20px'
      }}>
        Devices you've marked as trusted. You can remove any device at any time.
      </p>

      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#d1fae5',
          border: '1px solid #6ee7b7',
          borderRadius: '8px',
          color: '#065f46',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          {errorMessage}
        </div>
      )}

      {!devices || devices.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <DeviceIcon style={{ 
            height: '48px', 
            width: '48px', 
            margin: '0 auto 12px',
            color: '#d1d5db'
          }} />
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            No trusted devices yet. Check "Remember this device" when logging in.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {devices.map((device) => (
            <div
              key={device.deviceId}
              style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{
                  padding: '10px',
                  backgroundColor: '#CAEDF1',
                  borderRadius: '8px'
                }}>
                  <DeviceIcon style={{ height: '24px', width: '24px', color: '#075B7A' }} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    margin: '0 0 4px 0'
                  }}>
                    {device.deviceName}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Last used: {formatDate(device.lastUsed)}
                  </p>
                  {device.ipAddress && (
                    <p style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      margin: '2px 0 0 0'
                    }}>
                      IP: {device.ipAddress}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`Remove ${device.deviceName}?`)) {
                    removeMutation.mutate(device.deviceId)
                  }
                }}
                disabled={removeMutation.isPending}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: removeMutation.isPending ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => !removeMutation.isPending && (e.currentTarget.style.backgroundColor = '#fee2e2')}
                onMouseLeave={(e) => !removeMutation.isPending && (e.currentTarget.style.backgroundColor = 'transparent')}
                title="Remove device"
              >
                <TrashIcon style={{ height: '20px', width: '20px', color: '#dc2626' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
