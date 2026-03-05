import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAccessToken, getRolesFromToken, getBusinessRoles } from '../lib/auth'

type ProtectedRouteProps = {
  children: ReactNode
  requireRole?: string
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const token = getAccessToken()
  if (!token) {
    return <Navigate to="/" replace />
  }

  if (requireRole) {
    const allRoles = getRolesFromToken(token)
    const businessRoles = getBusinessRoles(allRoles)
    if (!businessRoles.includes(requireRole)) {
      return <Navigate to="/role" replace />
    }
  }

  return <>{children}</>
}
