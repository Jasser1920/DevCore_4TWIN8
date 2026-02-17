import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    },
    onSuccess: (data) => {
      setMessage(data.message)
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <span className="eyebrow">Reset access</span>
          <h1>Forgot password</h1>
          <p>We will send a reset email from Keycloak.</p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            setMessage('')
            setErrorMessage('')
            mutation.mutate()
          }}
          className="form"
        >
          <label className="field">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@smartsite.com"
              required
            />
          </label>

          {message ? <div className="alert success">{message}</div> : null}
          {errorMessage ? <div className="alert">{errorMessage}</div> : null}

          <button className="primary" type="submit" disabled={!email || mutation.isPending}>
            {mutation.isPending ? 'Sending...' : 'Send reset email'}
          </button>
        </form>

        <div className="card-footer">
          <Link to="/">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
