import type { NotificationItem } from './api'

export type AppRole = 'SUPER_ADMIN' | 'DIRECTOR' | 'PROJECT_MANAGER' | 'CLIENT'

type RouteTarget = {
  path: string
}

function withQuery(path: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }

  const queryString = query.toString()
  return queryString ? `${path}?${queryString}` : path
}

function defaultRouteByRole(role: AppRole): RouteTarget {
  if (role === 'DIRECTOR') return { path: '/director?view=notifications' }
  if (role === 'PROJECT_MANAGER') return { path: '/project-manager?view=notifications' }
  if (role === 'CLIENT') return { path: '/client?view=notifications' }
  return { path: '/superadmin?view=notifications' }
}

export function resolveNotificationRoute(
  item: Pick<NotificationItem, 'action' | 'metadata'>,
  role: AppRole,
): RouteTarget {
  const details = (item.metadata?.details || {}) as Record<string, string | undefined>
  const projectId = details.projectId
  const milestoneId = details.milestoneId

  switch (item.action) {
    case 'USER_CREATED':
    case 'USER_UPDATED':
    case 'USER_DELETED':
      return { path: '/superadmin?view=users' }

    case 'COMPANY_CREATED':
    case 'COMPANY_UPDATED':
    case 'COMPANY_DELETED':
      return { path: '/superadmin?view=companies' }

    case 'DELETION_REQUESTED':
      return { path: '/superadmin?view=users' }

    case 'PM_ASSIGNED':
    case 'PM_UNASSIGNED':
      if (role === 'DIRECTOR') return { path: '/director?view=company' }
      if (role === 'PROJECT_MANAGER') return { path: '/project-manager?view=workspace' }
      return { path: '/superadmin?view=companies' }

    case 'PROJECT_SUBMITTED':
    case 'PROJECT_RESUBMITTED':
      return {
        path: withQuery('/director', {
          view: 'validation',
          projectId,
        }),
      }

    case 'STRATEGIC_VISION_CREATED':
    case 'STRATEGIC_VISION_UPDATED':
      return { path: '/director?view=strategic-vision' }

    case 'PROJECT_APPROVED':
    case 'PROJECT_REJECTED':
    case 'PROJECT_STARTED':
    case 'PROJECT_CLIENT_ASSIGNED':
      if (role === 'CLIENT') {
        return {
          path: withQuery('/client', {
            view: 'dashboard',
            projectId,
          }),
        }
      }

      if (role === 'DIRECTOR') {
        return {
          path: withQuery('/director', {
            view: 'project-overview',
            projectId,
          }),
        }
      }

      if (role === 'PROJECT_MANAGER') {
        return {
          path: withQuery('/project-manager', {
            view: 'workspace',
            projectId,
          }),
        }
      }

      return { path: '/superadmin?view=companies' }

    case 'MILESTONE_APPROVED_BY_CLIENT':
    case 'MILESTONE_REJECTED_BY_CLIENT':
    case 'MILESTONE_APPROVED_BY_PM':
    case 'MILESTONE_REJECTED_BY_PM':
    case 'MILESTONE_APPROVED_BY_DIRECTOR':
    case 'MILESTONE_REJECTED_BY_DIRECTOR':
      if (role === 'CLIENT') {
        return {
          path: withQuery('/client', {
            view: 'milestone-requests',
            milestoneId,
          }),
        }
      }

      if (role === 'DIRECTOR') {
        return {
          path: withQuery('/director', {
            view: 'project-overview',
            projectId,
          }),
        }
      }

      if (role === 'PROJECT_MANAGER') {
        return {
          path: withQuery('/project-manager', {
            view: 'workspace',
            projectId,
            milestoneId,
          }),
        }
      }

      return { path: '/superadmin?view=activity-logs' }

    default:
      return defaultRouteByRole(role)
  }
}
