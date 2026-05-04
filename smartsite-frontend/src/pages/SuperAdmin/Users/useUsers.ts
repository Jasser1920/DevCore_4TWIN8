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

  const usersQuery = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      try {
        const data = await apiFetch<User[] | { users?: User[]; data?: User[] }>('/users/list', { method: 'GET' })
        console.log('Users API response:', data)
        
        if (Array.isArray(data)) {
          console.log('Response is array, returning directly')
          return data
        }
        if (data?.users && Array.isArray(data.users)) {
          console.log('Response has .users property, returning that')
          return data.users
        }
        if (data?.data && Array.isArray(data.data)) {
          console.log('Response has .data property, returning that')
          return data.data
        }
        console.warn('Could not extract array from response, returning empty array')
        return []
      } catch (error) {
        console.error('Error fetching users:', error)
        return []
      }
    },
  })

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
