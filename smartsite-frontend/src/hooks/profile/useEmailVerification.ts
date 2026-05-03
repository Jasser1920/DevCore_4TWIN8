import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../../lib/api'

export function useEmailVerification() {
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/users/resend-verification-email', { method: 'POST' })
    },
    onSuccess: () => {
      setResendMessage('Verification email sent successfully! Check your email.')
      setResendError('')
    },
    onError: (error: Error) => {
      setResendError(error.message)
      setResendMessage('')
    },
  })

  const resendVerification = () => {
    resendVerificationMutation.mutate()
  }

  return {
    resendVerification,
    isResending: resendVerificationMutation.isPending,
    resendMessage,
    resendError,
    setResendMessage,
    setResendError,
  }
}
