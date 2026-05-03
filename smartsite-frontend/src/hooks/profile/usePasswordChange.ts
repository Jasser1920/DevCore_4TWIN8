import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { getAccessToken, getUsernameFromToken } from '../../lib/auth'

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function usePasswordChange() {
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const changePasswordMutation = useMutation({
    mutationFn: async (formData: PasswordFormData) => {
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }
      const token = getAccessToken()
      const username = getUsernameFromToken(token)
      if (!username) {
        throw new Error('Unable to get username')
      }
      return apiFetch('/auth/update-password', {
        method: 'POST',
        body: JSON.stringify({
          username,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })
    },
    onSuccess: () => {
      setPasswordMessage('Password changed successfully!')
      setPasswordError('')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (error: Error) => {
      setPasswordError(error.message)
      setPasswordMessage('')
    },
  })

  const changePassword = (formData: PasswordFormData) => {
    changePasswordMutation.mutate(formData)
  }

  return {
    passwordForm,
    setPasswordForm,
    changePassword,
    isChanging: changePasswordMutation.isPending,
    passwordMessage,
    passwordError,
    setPasswordMessage,
    setPasswordError,
  }
}
