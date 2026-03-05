import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { useState, useMemo } from 'react'
import { Status } from './shared/UI'
import ActivityDetailModal from './ActivityDetailModal'

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

interface ActivityLogsResponse {
  logs: ActivityLog[]
  pagination: {
    skip: number
    limit: number
    total: number
    pages: number
  }
}

const Search = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  })
}

type ActivityLogsVariant = 'full' | 'compact'

interface ActivityLogsProps {
  isSuperAdmin: boolean
  userId?: string
  variant?: ActivityLogsVariant
}

export function ActivityLogs({ userId, isSuperAdmin, variant = 'full' }: ActivityLogsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null)
  const itemsPerPage = variant === 'compact' ? 5 : 25

  // Determine which endpoint to use
  let endpoint = '/activity-logs/me'
  if (isSuperAdmin && userId) {
    endpoint = `/activity-logs/user/${userId}`
  } else if (isSuperAdmin && !userId) {
    endpoint = '/activity-logs/all'
  }

  const { data, isLoading, error } = useQuery<ActivityLogsResponse>({
    queryKey: ['activityLogs', userId, currentPage, isSuperAdmin, variant],
    queryFn: () =>
      apiFetch(
        `${endpoint}?skip=${(currentPage - 1) * itemsPerPage}&limit=${itemsPerPage}`,
      ),
    staleTime: 30000,
  })

  // Filter logs based on search query, action, and status
  const filteredLogs = useMemo(() => {
    if (!data?.logs) return []
    
    return data.logs.filter((log) => {
      const matchesSearch = 
        log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesAction = !selectedAction || log.action === selectedAction
      const matchesStatus = !selectedStatus || log.status === selectedStatus
      
      return matchesSearch && matchesAction && matchesStatus
    })
  }, [data?.logs, searchQuery, selectedAction, selectedStatus])

  const logs = data?.logs || []
  const uniqueActions = data?.logs ? Array.from(new Set(data.logs.map((log) => log.action))) : []
  const total = data?.pagination?.total || 0
  const pages = data?.pagination?.pages || 1

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        Loading activity logs...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626'
      }}>
        <p style={{ margin: 0, fontWeight: '500' }}>Error loading activity logs</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{(error as Error).message}</p>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {logs.length === 0 ? (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            No recent activity yet
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log._id}
              onClick={() => setSelectedActivity(log)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
                e.currentTarget.style.borderColor = '#075B7A'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Status
                  type={
                    log.status === 'SUCCESS' ? 'success' :
                    log.status === 'FAILED' ? 'error' :
                    'info'
                  }
                  label={log.status}
                  size="small"
                  icon={true}
                />
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1a1a1a'
                  }}>
                    {log.action.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {log.description}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                {formatDate(log.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1a1a1a',
          margin: 0,
          marginBottom: '8px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Activity Logs
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Total: <span style={{ fontWeight: '600' }}>{total}</span> activities
        </p>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            height: '18px',
            width: '18px',
            color: '#9ca3af',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="Search by username, action, or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              fontSize: '14px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#148ABB'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              padding: '10px 12px',
              fontSize: '14px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '160px',
              color: selectedAction ? '#1a1a1a' : '#9ca3af'
            }}
          >
            <option value="">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              padding: '10px 12px',
              fontSize: '14px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '140px',
              color: selectedStatus ? '#1a1a1a' : '#9ca3af'
            }}
          >
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="INFO">Info</option>
          </select>

          {/* Clear Filters Button */}
          {(searchQuery || selectedAction || selectedStatus) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedAction('')
                setSelectedStatus('')
                setCurrentPage(1)
              }}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#6b7280',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.color = '#1a1a1a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <th style={{
                padding: '14px 12px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                User
              </th>
              <th style={{
                padding: '14px 12px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Action
              </th>
              <th style={{
                padding: '14px 12px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Description
              </th>
              <th style={{
                padding: '14px 12px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Status
              </th>
              <th style={{
                padding: '14px 12px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Time
              </th>
              {isSuperAdmin && (
                <th style={{
                  padding: '14px 12px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  IP Address
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 6 : 5} style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  No activities found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log._id}
                  onClick={() => setSelectedActivity(log)}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{
                    padding: '16px 12px',
                    fontSize: '14px',
                    color: '#1a1a1a',
                    fontWeight: '500'
                  }}>
                    {log.username}
                  </td>
                  <td style={{
                    padding: '16px 12px',
                    fontSize: '14px'
                  }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#CAEDF1',
                      color: '#075B7A',
                      whiteSpace: 'nowrap'
                    }}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px 12px',
                    fontSize: '14px',
                    color: '#6b7280',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {log.description}
                  </td>
                  <td style={{
                    padding: '16px 12px',
                    fontSize: '14px'
                  }}>
                    <Status
                      type={
                        log.status === 'SUCCESS' ? 'success' :
                        log.status === 'FAILED' ? 'error' :
                        'info'
                      }
                      label={log.status}
                      size="small"
                      icon={true}
                    />
                  </td>
                  <td style={{
                    padding: '16px 12px',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    {formatDate(log.timestamp)}
                  </td>
                  {isSuperAdmin && (
                    <td style={{
                      padding: '16px 12px',
                      fontSize: '13px',
                      color: '#6b7280',
                      fontFamily: 'monospace'
                    }}>
                      {log.ipAddress || '-'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '16px'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              backgroundColor: currentPage === 1 ? '#f3f4f6' : '#148ABB',
              color: currentPage === 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Previous
          </button>

          {Array.from({ length: Math.min(5, pages) }).map((_, i) => {
            const pageNum = i + 1
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: currentPage === pageNum ? '#148ABB' : '#f3f4f6',
                  color: currentPage === pageNum ? 'white' : '#1a1a1a',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: currentPage === pageNum ? '600' : '500'
                }}
              >
                {pageNum}
              </button>
            )
          })}

          <button
            onClick={() => setCurrentPage(Math.min(pages, currentPage + 1))}
            disabled={currentPage === pages}
            style={{
              padding: '8px 12px',
              backgroundColor: currentPage === pages ? '#f3f4f6' : '#148ABB',
              color: currentPage === pages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === pages ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  )
}
