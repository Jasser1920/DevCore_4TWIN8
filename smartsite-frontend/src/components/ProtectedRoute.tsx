import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAccessToken, getRolesFromToken } from '../lib/auth'

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
    const roles = getRolesFromToken(token)
    if (!roles.includes(requireRole)) {
      return <Navigate to="/role" replace />
    }
  }

  return <>{children}</>
}
