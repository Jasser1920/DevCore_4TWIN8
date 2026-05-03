import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useResponsive } from '../hooks/useResponsive'
import logoIcon from '../assets/logo smartsite.svg'
import logoText from '../assets/logo text.svg'
import { Button } from '../components/shared/UI'
import { LogIn, ArrowLeft } from 'lucide-react'

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isMobile } = useResponsive()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      const email = searchParams.get('email')

      if (!token || !email) {
        setStatus('error')
        setMessage('Invalid verification link. Missing token or email.')
        return
      }

      try {
        const response = await apiFetch<any>(`/auth/verify-email?token=${token}&email=${email}`)
        setStatus('success')
        setMessage(response.message || '✅ Email verified successfully! Redirecting to login...')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } catch (error: any) {
        setStatus('error')
        setMessage(error.message || '❌ Email verification failed. Please try again or contact support.')
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(to bottom right, #CAEDF1, #148ABB)',
      padding: isMobile ? '12px' : '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '32rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: isMobile ? '24px' : '32px',
        textAlign: 'center',
      }}>
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

        {status === 'loading' && (
          <div>
            <h2 style={{
              fontSize: isMobile ? '22px' : '24px',
              color: '#075B7A',
              margin: '0 0 10px 0'
            }}>Checking your verification link</h2>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Please wait while we verify your SmartSite email.
            </p>
            <div style={{
              display: 'inline-block',
              width: '44px',
              height: '44px',
              border: '4px solid #dbeafe',
              borderTop: '4px solid #148ABB',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginTop: '20px'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '9999px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #bbf7d0',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '14px'
            }}>
              ✅
            </div>
            <h2 style={{ color: '#075B7A', margin: '0 0 10px 0' }}>Email verified successfully</h2>
            <p style={{ color: '#16a34a', marginBottom: '10px' }}>{message}</p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Redirecting to login in 3 seconds...
            </p>
            <Button
              onClick={() => navigate('/login')}
              icon={LogIn}
              style={{
                marginTop: '12px'
              }}
            >
              Go to Login now
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '9999px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginBottom: '14px'
            }}>
              ⚠️
            </div>
            <h2 style={{ color: '#b91c1c', margin: '0 0 10px 0' }}>Verification link is invalid</h2>
            <p style={{ color: '#dc2626', marginBottom: '20px' }}>{message}</p>
            <Button
              onClick={() => navigate('/login')}
              icon={ArrowLeft}
            >
              Back to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
