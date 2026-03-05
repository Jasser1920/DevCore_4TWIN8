import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../lib/api'

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  keycloakId: string
  isEmailVerified: boolean
}

interface CreateUserData {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
}

interface UpdateUserData {
  firstName: string
  lastName: string
  email: string
  role: string
}

interface CreateUserResponse {
  message: string
  user: {
    id: string
    username: string
    email: string
    role: string
    keycloakId: string
  }
}

export function useUsers() {
  const queryClient = useQueryClient()

  // Fetch users list
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const data = await apiFetch<{ users: User[] }>('/users/list', { method: 'GET' })
      return data.users
    },
  })

  // Create user
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      return apiFetch<CreateUserResponse>('/users/create', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  // Update user
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...userData }: UpdateUserData & { id: string }) => {
      return apiFetch(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(userData),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiFetch(`/users/${userId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    createUserError: createUserMutation.error,
    updateUserError: updateUserMutation.error,
    createUserSuccess: createUserMutation.isSuccess ? createUserMutation.data : null,
  }
}
