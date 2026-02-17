import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { clearTokens, getAccessToken, getRefreshToken, getRolesFromToken } from '../lib/auth'

export default function RoleHome() {
  const [response, setResponse] = useState('')
  const [changePasswordUrl, setChangePasswordUrl] = useState('')
  const roles = getRolesFromToken(getAccessToken())

  const meMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ message: string; user: unknown }>('/users/me', {
        method: 'GET',
      })
    },
    onSuccess: (data) => {
      setResponse(JSON.stringify(data, null, 2))
    },
    onError: (error: Error) => {
      setResponse(error.message)
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ url: string; message: string }>('/auth/change-password', {
        method: 'POST',
      })
    },
    onSuccess: (data) => {
      setChangePasswordUrl(data.url)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })
    },
    onSettled: () => {
      clearTokens()
      window.location.href = '/'
    },
  })

  return (
    <div className="page">
      <div className="card wide">
        <div className="card-header">
          <span className="eyebrow">SmartSite</span>
          <h1>Role dashboard</h1>
          <p>Signed in as {roles.join(', ') || 'User'}.</p>
        </div>

        <div className="pill-row">
          {roles.map((role) => (
            <span key={role} className="pill">
              {role}
            </span>
          ))}
        </div>

        <div className="section">
          <h2>Test endpoints</h2>
          <button className="ghost" onClick={() => meMutation.mutate()}>
            Call /users/me
          </button>
          {response ? <pre className="code-block">{response}</pre> : null}
        </div>

        <div className="section">
          <h2>Account</h2>
          <button className="ghost" onClick={() => changePasswordMutation.mutate()}>
            Open change password
          </button>
          {changePasswordUrl ? (
            <a className="link" href={changePasswordUrl} target="_blank" rel="noreferrer">
              Open Keycloak account console
            </a>
          ) : null}
        </div>

        <div className="section">
          <button className="ghost" onClick={() => logoutMutation.mutate()}>
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
