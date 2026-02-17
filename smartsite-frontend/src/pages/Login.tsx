import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { getRolesFromToken, setTokens } from '../lib/auth'

type LoginResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  refresh_expires_in: number
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [errorMessage, setErrorMessage] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      return apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      })
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token)
      const roles = getRolesFromToken(data.access_token)
      if (roles.includes('SUPER_ADMIN')) {
        navigate('/superadmin', { replace: true })
      } else {
        navigate('/role', { replace: true })
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const isDisabled = useMemo(() => !form.username || !form.password, [form])

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <span className="eyebrow">SmartSite Console</span>
          <h1>Sign in</h1>
          <p>Use your credentials to test the backend endpoints.</p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            setErrorMessage('')
            mutation.mutate()
          }}
          className="form"
        >
          <label className="field">
            Username
            <input
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              placeholder="admin"
              required
            />
          </label>

          <label className="field">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="••••••••"
              required
            />
          </label>

          {errorMessage ? <div className="alert">{errorMessage}</div> : null}

          <button className="primary" type="submit" disabled={isDisabled || mutation.isPending}>
            {mutation.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="card-footer">
          <Link to="/forgot">Forgot password?</Link>
        </div>
      </div>
    </div>
  )
}
