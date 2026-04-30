import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from '../lib/api'
import { getAccessToken, getBusinessRoles, getRolesFromToken } from '../lib/auth'
import { resolveNotificationRoute, type AppRole } from '../lib/notificationRoutes'

function formatTime(value: string) {
  const date = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleString()
}

function NotificationCard({
  item,
  onMarkRead,
  onOpen,
  isMutating,
}: {
  item: NotificationItem
  onMarkRead: (id: string) => void
  onOpen: (item: NotificationItem) => void
  isMutating: boolean
}) {
  return (
    <div
      style={{
        border: `1px solid ${item.isRead ? '#e5e7eb' : '#93c5fd'}`,
        borderLeft: `5px solid ${item.isRead ? '#d1d5db' : '#148ABB'}`,
        borderRadius: '10px',
        padding: '12px 14px',
        backgroundColor: item.isRead ? 'white' : '#eff6ff',
        cursor: 'pointer',
      }}
      onClick={() => onOpen(item)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{item.title}</h4>
          <p style={{ margin: '4px 0 0', color: '#334155', fontSize: '14px' }}>{item.message}</p>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#475569', background: '#e2e8f0', padding: '2px 8px', borderRadius: '999px' }}>
              {item.action}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{formatTime(item.createdAt)}</span>
          </div>
        </div>

        {!item.isRead && (
          <button
            disabled={isMutating}
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead(item.id)
            }}
            style={{
              border: '1px solid #148ABB',
              background: 'white',
              color: '#075B7A',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: isMutating ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Mark read
          </button>
        )}
      </div>
    </div>
  )
}

export default function NotificationsPanel() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const roles = getBusinessRoles(getRolesFromToken(getAccessToken()))
  const role = (roles.find((value) => ['CLIENT', 'SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'QHSE_MANAGER'].includes(value)) ||
    'CLIENT') as AppRole

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: () => getMyNotifications({ page: 1, limit: 50 }),
    staleTime: 20000,
  })

  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getMyUnreadNotificationCount,
    staleTime: 10000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const items = notificationsQuery.data?.items || []
  const unread = unreadCountQuery.data?.unread || 0

  const openNotification = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await markReadMutation.mutateAsync(item.id)
      } catch {
        // Continue navigation even if mark-as-read fails.
      }
    }

    const target = resolveNotificationRoute(item, role)
    navigate(target.path)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1a1a1a', fontFamily: 'Poppins, sans-serif' }}>
            Notifications
          </h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Unread: <strong>{unread}</strong>
          </p>
        </div>

        <button
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || unread === 0}
          style={{
            border: '1px solid #148ABB',
            background: '#148ABB',
            color: 'white',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: markAllReadMutation.isPending || unread === 0 ? 'not-allowed' : 'pointer',
            opacity: markAllReadMutation.isPending || unread === 0 ? 0.7 : 1,
            fontWeight: 600,
          }}
        >
          {markAllReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '20px',
          display: 'grid',
          gap: '12px',
        }}
      >
        {notificationsQuery.isLoading && (
          <p style={{ margin: 0, color: '#64748b' }}>Loading notifications...</p>
        )}

        {notificationsQuery.isError && (
          <p style={{ margin: 0, color: '#b91c1c' }}>
            {(notificationsQuery.error as Error).message}
          </p>
        )}

        {!notificationsQuery.isLoading && !notificationsQuery.isError && items.length === 0 && (
          <p style={{ margin: 0, color: '#64748b' }}>No notifications available.</p>
        )}

        {items.map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            isMutating={markReadMutation.isPending}
            onMarkRead={(id) => markReadMutation.mutate(id)}
            onOpen={openNotification}
          />
        ))}
      </div>
    </div>
  )
}
