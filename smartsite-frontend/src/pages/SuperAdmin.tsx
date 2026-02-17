import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../lib/api'
import { clearTokens, getAccessToken, getRolesFromToken, getRefreshToken } from '../lib/auth'

type CreateUserResponse = {
  message: string
  user: {
    id: string
    username: string
    email: string
    role: string
    keycloakId: string
  }
}

const roles = ['SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'QHSE_MANAGER', 'CLIENT']

export default function SuperAdmin() {
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CLIENT',
  })

  const createUserMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<CreateUserResponse>('/users/create', {
        method: 'POST',
        body: JSON.stringify(form),
      })
    },
    onSuccess: (data) => {
      setMessage(data.message)
      setErrorMessage('')
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const meMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ message: string; user: unknown }>('/users/me', {
        method: 'GET',
      })
    },
    onSuccess: (data) => {
      setProfileMessage(JSON.stringify(data, null, 2))
    },
    onError: (error: Error) => {
      setProfileMessage(error.message)
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

  const tokenRoles = getRolesFromToken(getAccessToken())

  return (
    <div className="page">
      <div className="layout">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Admin workspace</span>
              <h1>Super admin</h1>
              <p>Manage users and verify secured endpoints.</p>
            </div>
            <button className="ghost" onClick={() => logoutMutation.mutate()}>
              Log out
            </button>
          </div>

          <div className="pill-row">
            {tokenRoles.map((role) => (
              <span key={role} className="pill">
                {role}
              </span>
            ))}
          </div>

          <div className="section">
            <h2>Create user</h2>
            <form
              className="form grid"
              onSubmit={(event) => {
                event.preventDefault()
                setMessage('')
                setErrorMessage('')
                createUserMutation.mutate()
              }}
            >
              <label className="field">
                Username
                <input
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  required
                />
              </label>
              <label className="field">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </label>
              <label className="field">
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
              </label>
              <label className="field">
                First name
                <input
                  value={form.firstName}
                  onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                  required
                />
              </label>
              <label className="field">
                Last name
                <input
                  value={form.lastName}
                  onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                  required
                />
              </label>
              <label className="field">
                Role
                <select
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  required
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              {message ? <div className="alert success">{message}</div> : null}
              {errorMessage ? <div className="alert">{errorMessage}</div> : null}

              <button className="primary" type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create user'}
              </button>
            </form>
          </div>
        </div>

        <div className="panel secondary">
          <div className="section">
            <h2>Test endpoints</h2>
            <p>Verify your access token with a protected endpoint.</p>
            <button className="ghost" onClick={() => meMutation.mutate()}>
              Call /users/me
            </button>
            {profileMessage ? <pre className="code-block">{profileMessage}</pre> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
