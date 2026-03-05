import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ReCAPTCHA from 'react-google-recaptcha'
import { apiFetch } from '../lib/api'
import { getRolesFromToken, setTokens, getBusinessRoles } from '../lib/auth'
import { useResponsive } from '../hooks/useResponsive'
import { 
  generateDeviceFingerprint, 
  getDeviceName, 
  setStoredDeviceFingerprint, 
  setRememberDevice 
} from '../lib/deviceFingerprint'
import LoadingPage from '../components/LoadingPage'
import logoIcon from '../assets/logo smartsite.svg'
import logoText from '../assets/logo text.svg'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '../components/shared/UI'

type LoginResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  refresh_expires_in: number
}

export default function Login() {
  const navigate = useNavigate()
  const { isMobile } = useResponsive()
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDeviceState] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      return apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          captchaToken,
        }),
      })
    },
    onSuccess: async (data) => {
      setTokens(data.access_token, data.refresh_token)

      // Register device if "remember device" is checked
      if (rememberDevice) {
        try {
          const fingerprint = generateDeviceFingerprint()
          const deviceName = getDeviceName()
          
          await apiFetch('/devices/register', {
            method: 'POST',
            body: JSON.stringify({
              deviceFingerprint: fingerprint,
              deviceName,
            }),
          })

          setStoredDeviceFingerprint(fingerprint)
          setRememberDevice(true)
        } catch (error) {
          console.error('Failed to register device:', error)
          // Continue with login even if device registration fails
        }
      }

      const allRoles = getRolesFromToken(data.access_token)
      const businessRoles = getBusinessRoles(allRoles)
      
      // Route based on role (priority order)
      if (businessRoles.includes('SUPER_ADMIN')) {
        navigate('/superadmin', { replace: true })
      } else if (businessRoles.includes('DIRECTOR')) {
        navigate('/director', { replace: true })
      } else if (businessRoles.includes('PROJECT_MANAGER')) {
        navigate('/project-manager', { replace: true })
      } else if (businessRoles.includes('QHSE_MANAGER')) {
        navigate('/qhse-manager', { replace: true })
      } else if (businessRoles.includes('CLIENT')) {
        navigate('/client', { replace: true })
      } else {
        navigate('/role', { replace: true })
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
      setCaptchaToken('')
    },
  })

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
          }}>Welcome</h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280'
          }}>Sign in to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => {
          e.preventDefault()
          setErrorMessage('')

          if (!captchaToken) {
            setErrorMessage('Please complete CAPTCHA verification before login')
            return
          }

          mutation.mutate()
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151'
            }}>
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(e) => {
                setForm({ ...form, username: e.target.value })
                setErrorMessage('')
              }}
              placeholder="Enter username"
              required
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
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151'
            }}>
              Password
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value })
                  setErrorMessage('')
                }}
                placeholder="Enter password"
                required
                style={{
                  flex: 1,
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
              <Button
                type="button"
                variant="text"
                size="small"
                icon={showPassword ? EyeOff : Eye}
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  whiteSpace: 'nowrap',
                  minWidth: 'auto'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>

          {/* Remember Device Checkbox */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDeviceState(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  accentColor: '#075B7A'
                }}
              />
              <span style={{
                fontSize: '14px',
                color: '#374151'
              }}>
                Remember this device
              </span>
            </label>
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginTop: '4px',
              marginLeft: '24px'
            }}>
              Don't check this on shared or public computers
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            {recaptchaSiteKey ? (
              <ReCAPTCHA
                sitekey={recaptchaSiteKey}
                onChange={(token: string | null) => {
                  setCaptchaToken(token || '')
                  setErrorMessage('')
                }}
                onExpired={() => setCaptchaToken('')}
              />
            ) : (
              <div style={{
                padding: '12px',
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                color: '#9a3412',
                fontSize: '13px'
              }}>
                CAPTCHA is not configured. Set <strong>VITE_RECAPTCHA_SITE_KEY</strong> in frontend env.
              </div>
            )}
          </div>

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
            icon={LogIn}
            fullWidth
            disabled={!form.username || !form.password || !captchaToken || mutation.isPending}
            loading={mutation.isPending}
            style={{
              padding: '12px'
            }}
          >
            Sign in
          </Button>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link 
              to="/forgot" 
              style={{ 
                fontSize: '14px', 
                color: '#148ABB',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
