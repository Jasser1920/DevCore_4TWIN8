import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../../lib/api'

interface DeletionStatus {
  hasPendingDeletion: boolean
  scheduledDate?: string
}

export function useAccountDeletion() {
  const [deletionMessage, setDeletionMessage] = useState('')
  const [deletionError, setDeletionError] = useState('')
  const [showDeletionModal, setShowDeletionModal] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')

  const { data: deletionStatus } = useQuery<DeletionStatus>({
    queryKey: ['deletionStatus'],
    queryFn: async () => {
      try {
        return await apiFetch<DeletionStatus>('/users/deletion-status', { method: 'GET' })
      } catch {
        return { hasPendingDeletion: false }
      }
    },
  })

  const requestDeletionMutation = useMutation({
    mutationFn: async (reason: string) => {
      return apiFetch('/users/request-deletion', {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    },
    onSuccess: () => {
      setDeletionMessage('Account deletion requested. You will receive a confirmation email.')
      setDeletionError('')
      setShowDeletionModal(false)
      setDeletionReason('')
    },
    onError: (error: Error) => {
      setDeletionError(error.message)
      setDeletionMessage('')
    },
  })

  const cancelDeletionMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/users/cancel-deletion', { method: 'POST' })
    },
    onSuccess: () => {
      setDeletionMessage('Account deletion cancelled successfully.')
      setDeletionError('')
    },
    onError: (error: Error) => {
      setDeletionError(error.message)
      setDeletionMessage('')
    },
  })

  const requestDeletion = (reason: string) => {
    requestDeletionMutation.mutate(reason)
  }

  const cancelDeletion = () => {
    cancelDeletionMutation.mutate()
  }

  return {
    deletionStatus,
    requestDeletion,
    cancelDeletion,
    isRequesting: requestDeletionMutation.isPending,
    isCancelling: cancelDeletionMutation.isPending,
    deletionMessage,
    deletionError,
    showDeletionModal,
    setShowDeletionModal,
    deletionReason,
    setDeletionReason,
    setDeletionMessage,
    setDeletionError,
  }
}
