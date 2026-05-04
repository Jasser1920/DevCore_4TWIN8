import { useState } from 'react'
import FormInput from '../shared/FormInput'
import AlertMessage from '../shared/AlertMessage'
import PasswordStrengthMeter from '../PasswordStrengthMeter'
import { Button } from '../shared/UI'
import { Save } from 'lucide-react'

interface PasswordChangeFormProps {
  onSubmit: (data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => void
  isLoading: boolean
  message?: string
  error?: string
  isMobile: boolean
}

export default function PasswordChangeForm({
  onSubmit,
  isLoading,
  message,
  error,
  isMobile,
}: PasswordChangeFormProps) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(passwordForm)
  }

  const passwordsMatch = passwordForm.newPassword === passwordForm.confirmPassword
  const isFormValid =
    passwordForm.currentPassword &&
    passwordForm.newPassword &&
    passwordForm.confirmPassword &&
    passwordsMatch

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: isMobile ? '20px' : '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px',
      }}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '24px',
          margin: '0 0 24px 0',
        }}
      >
        Change Password
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <FormInput
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(value) =>
              setPasswordForm({ ...passwordForm, currentPassword: value })
            }
            placeholder="Enter current password"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <FormInput
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(value) =>
              setPasswordForm({ ...passwordForm, newPassword: value })
            }
            placeholder="Enter new password"
          />
          <PasswordStrengthMeter password={passwordForm.newPassword} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <FormInput
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(value) =>
              setPasswordForm({ ...passwordForm, confirmPassword: value })
            }
            placeholder="Confirm new password"
            error={
              passwordForm.confirmPassword && !passwordsMatch
                ? 'Passwords do not match'
                : undefined
            }
          />
        </div>

        {message && <AlertMessage type="success" message={message} />}
        {error && <AlertMessage type="error" message={error} />}

        <Button
          type="submit"
          icon={Save}
          disabled={isLoading || !isFormValid}
          loading={isLoading}
          style={{
            padding: '12px 24px'
          }}
        >
          Change Password
        </Button>
      </form>
    </div>
  )
}
