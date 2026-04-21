import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMyNotifications, type NotificationItem } from '../lib/api'
import { getAccessToken, getBusinessRoles, getRolesFromToken } from '../lib/auth'
import { type AppRole } from '../lib/notificationRoutes'

export function useNotificationToast(onNewNotification: (item: NotificationItem, role: AppRole) => void) {
  
  const roles = getBusinessRoles(getRolesFromToken(getAccessToken()))
  const role = (roles.find((value) => ['CLIENT', 'SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER'].includes(value)) || 'CLIENT') as AppRole
  const lastNotificationId = useRef<string | null>(null)

  // Poll notifications every 10 seconds
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me', 'toast'],
    queryFn: () => getMyNotifications({ page: 1, limit: 1, unreadOnly: true }),
    refetchInterval: 10000,
    staleTime: 5000,
  })

  useEffect(() => {
    const items = notificationsQuery.data?.items || []
    if (items.length > 0) {
      const latest = items[0]
      if (latest.id !== lastNotificationId.current) {
        lastNotificationId.current = latest.id
        onNewNotification(latest, role)
      }
    }
  }, [notificationsQuery.data, role, onNewNotification])
}

