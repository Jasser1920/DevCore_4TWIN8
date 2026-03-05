import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../../lib/api'

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
}

interface ProfileUser {
  preferred_username: string
  email: string
  email_verified: boolean
  given_name?: string
  family_name?: string
  realm_access?: {
    roles: string[]
  }
}

export function useProfileData() {
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [form, setForm] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
  })

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const data = await apiFetch<{ user: ProfileUser }>('/users/me', { method: 'GET' })
      setForm({
        firstName: data.user.given_name || '',
        lastName: data.user.family_name || '',
        email: data.user.email || '',
      })
      return data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (formData: ProfileFormData) => {
      return apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(formData),
      })
    },
    onSuccess: () => {
      setMessage('Profile updated successfully!')
      setErrorMessage('')
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
      setMessage('')
    },
  })

  const updateProfile = (formData: ProfileFormData) => {
    updateMutation.mutate(formData)
  }

  return {
    profileData,
    isLoading,
    form,
    setForm,
    updateProfile,
    isUpdating: updateMutation.isPending,
    message,
    errorMessage,
    setMessage,
    setErrorMessage,
  }
}
