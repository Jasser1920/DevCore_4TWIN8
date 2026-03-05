import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { validators } from '../lib/validators'
import { useResponsive } from '../hooks/useResponsive'
import LoadingPage from '../components/LoadingPage'
import logoIcon from '../assets/logo smartsite.svg'
import logoText from '../assets/logo text.svg'
import { Button } from '../components/shared/UI'
import { Send } from 'lucide-react'

export default function ForgotPassword() {
  const { isMobile } = useResponsive()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldError, setFieldError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ message: string; info: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    },
    onSuccess: (data) => {
      setMessage(data.message)
      setFieldError('')
      setErrorMessage('')
      setEmail('')
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const handleEmailChange = (value: string) => {
    setEmail(value)
    const error = validators.email(value)
    if (error) {
      setFieldError(error)
    } else {
      setFieldError('')
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    const error = validators.email(email)
    if (error) {
      setFieldError(error)
    } else {
      mutation.mutate()
    }
  }

  return (
    <>
      <LoadingPage isVisible={mutation.isPending} />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #CAEDF1, #148ABB)',
        padding: isMobile ? '12px' : '16px'
      }}>
      <div style={{
        width: '100%',
        maxWidth: '28rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: isMobile ? '24px' : '32px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            marginBottom: '24px'
          }}>
            <img 
              src={logoIcon} 
              alt="SmartSite Logo" 
              style={{
                height: isMobile ? '40px' : '48px',
                width: 'auto'
              }}
            />
            <img 
              src={logoText} 
              alt="SmartSite" 
              style={{
                height: isMobile ? '26px' : '32px',
                width: 'auto'
              }}
            />
          </div>
          <h1 style={{ 
            fontSize: isMobile ? '22px' : '24px', 
            fontWeight: '600', 
            color: '#1a1a1a',
            marginBottom: '8px'
          }}>Reset Password</h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280'
          }}>Enter your email to receive a new password</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151'
            }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="your.email@company.com"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#148ABB'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            {fieldError && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                {fieldError}
              </p>
            )}
          </div>

          {message && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#d1fae5',
              border: '1px solid #6ee7b7',
              borderRadius: '8px',
              color: '#065f46',
              fontSize: '14px'
            }}>
              <strong>{message}</strong>
              <p style={{ marginTop: '8px', fontSize: '13px' }}>
                Check your inbox and spam folder
              </p>
            </div>
          )}

          {errorMessage && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            icon={Send}
            fullWidth
            disabled={!email || !!fieldError || mutation.isPending}
            loading={mutation.isPending}
            style={{
              padding: '12px',
              marginBottom: '16px'
            }}
          >
            Send temporary password
          </Button>

          <div style={{ textAlign: 'center' }}>
            <Link 
              to="/" 
              style={{ 
                fontSize: '14px', 
                color: '#148ABB',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
      </div>
    </>
  )
}
