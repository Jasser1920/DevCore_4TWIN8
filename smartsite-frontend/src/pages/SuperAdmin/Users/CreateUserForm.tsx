import { useState, useEffect } from 'react'
import { validators } from '../../../lib/validators'
import { FormField, Button } from '../../../components/shared/UI'
import { useResponsive } from '../../../hooks/useResponsive'
import { useUsers } from './useUsers'
import { UserPlus, Eye, EyeOff, Sparkles } from 'lucide-react'

const roles = ['SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'QHSE_MANAGER', 'CLIENT']

export default function CreateUserForm() {
  const { isMobile } = useResponsive()
  const { createUser, isCreating, createUserError, createUserSuccess } = useUsers()
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CLIENT',
  })

  // Handle API responses
  useEffect(() => {
    if (createUserSuccess) {
      setMessage(createUserSuccess.message)
      setErrorMessage('')
      setFieldErrors({})
      setShowPassword(false)
      setForm({ username: '', email: '', password: '', firstName: '', lastName: '', role: 'CLIENT' })
    }
  }, [createUserSuccess])

  useEffect(() => {
    if (createUserError) {
      setErrorMessage(createUserError.message)
    }
  }, [createUserError])

  const handleFieldChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value })
    
    // Real-time validation
    const validator = validators[field as keyof typeof validators]
    if (validator) {
      const error = validator(value)
      if (error) {
        setFieldErrors({ ...fieldErrors, [field]: error })
      } else {
        setFieldErrors({ ...fieldErrors, [field]: '' })
      }
    }
  }

  const generateStrongPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const special = '@$!%*?&'
    const allChars = lowercase + uppercase + numbers + special

    const passwordChars = [
      lowercase[Math.floor(Math.random() * lowercase.length)],
      uppercase[Math.floor(Math.random() * uppercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)],
    ]

    while (passwordChars.length < 12) {
      passwordChars.push(allChars[Math.floor(Math.random() * allChars.length)])
    }

    for (let index = passwordChars.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      const temp = passwordChars[index]
      passwordChars[index] = passwordChars[randomIndex]
      passwordChars[randomIndex] = temp
    }

    return passwordChars.join('')
  }

  const handleGeneratePassword = () => {
    const generatedPassword = generateStrongPassword()
    handleFieldChange('password', generatedPassword)
  }

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {}
    let isValid = true

    Object.keys(form).forEach((field) => {
      const validator = validators[field as keyof typeof validators]
      if (validator) {
        const error = validator(form[field as keyof typeof form])
        if (error) {
          errors[field] = error
          isValid = false
        }
      }
    })

    setFieldErrors(errors)
    return isValid
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (validateAllFields()) {
      createUser(form)
    } else {
      setErrorMessage('Please fix the errors in the form')
    }
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#CAEDF1',
          padding: '12px',
          borderRadius: '8px'
        }}>
          <UserPlus style={{ height: '24px', width: '24px', color: '#075B7A' }} />
        </div>
        <div>
          <h2 style={{ 
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0,
            fontFamily: 'Poppins, sans-serif'
          }}>
            Create New User
          </h2>
          <p style={{ 
            fontSize: '14px',
            color: '#6b7280',
            margin: '4px 0 0 0'
          }}>
            Add a new user to the platform
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div data-tour="sa-create-user-username">
            <FormField
              label="Username"
              name="username"
              value={form.username}
              onChange={(value) => handleFieldChange('username', value)}
              error={fieldErrors.username}
              required
              placeholder="john_director"
            />
          </div>

          <div data-tour="sa-create-user-email">
            <FormField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(value) => handleFieldChange('email', value)}
              error={fieldErrors.email}
              required
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Password <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="Password@123"
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  backgroundColor: '#f9fafb',
                  border: `1px solid ${fieldErrors.password ? '#dc2626' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  outline: 'none'
                }}
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
              <Button
                type="button"
                variant="text"
                size="small"
                icon={Sparkles}
                onClick={handleGeneratePassword}
                style={{
                  whiteSpace: 'nowrap',
                  minWidth: 'auto'
                }}
              >
                Generate
              </Button>
            </div>
            {fieldErrors.password && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px', marginBottom: 0 }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div data-tour="sa-create-user-role">
            <FormField
              label="Role"
              name="role"
              type="select"
              value={form.role}
              onChange={(value) => handleFieldChange('role', value)}
              error={fieldErrors.role}
              required
              options={roles.map(role => ({ value: role, label: role }))}
            />
          </div>

          <FormField
            label="First Name"
            name="firstName"
            value={form.firstName}
            onChange={(value) => handleFieldChange('firstName', value)}
            error={fieldErrors.firstName}
            required
            placeholder="John"
          />

          <FormField
            label="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={(value) => handleFieldChange('lastName', value)}
            error={fieldErrors.lastName}
            required
            placeholder="Doe"
          />
        </div>

        {message && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#dcfce7',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '14px', color: '#15803d', margin: 0 }}>
              {message}
            </p>
          </div>
        )}

        {errorMessage && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>
              {errorMessage}
            </p>
          </div>
        )}

        <div data-tour="sa-create-user-submit">
          <Button
            type="submit"
            loading={isCreating}
            disabled={isCreating}
            icon={UserPlus}
          >
            Create User
          </Button>
        </div>
      </form>
    </div>
  )
}
