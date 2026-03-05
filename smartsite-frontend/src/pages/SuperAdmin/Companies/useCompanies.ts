import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../lib/api'

interface Company {
  id: string
  name: string
  description: string
  contactEmail: string
  contactName: string
  managerUserId: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Director {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  isEmailVerified: boolean
}

interface CreateCompanyData {
  name: string
  description: string
  contactEmail: string
  contactName: string
  managerUserId: string
}

interface UpdateCompanyData {
  name: string
  description: string
  contactName: string
  contactEmail: string
  managerUserId: string
  status: string
}

export function useCompanies() {
  const queryClient = useQueryClient()

  // Fetch companies list
  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const data = await apiFetch<{ data: Company[] }>('/companies', { method: 'GET' })
      return data.data
    },
  })

  // Fetch available directors for manager selection
  const directorsQuery = useQuery({
    queryKey: ['directors'],
    queryFn: async () => {
      const data = await apiFetch<{ data: Director[] }>('/companies/managers/available', { method: 'GET' })
      return data.data
    },
  })

  // Create company
  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: CreateCompanyData) => {
      return apiFetch<{ message: string }>('/companies', {
        method: 'POST',
        body: JSON.stringify(companyData),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  // Update company
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, ...companyData }: UpdateCompanyData & { id: string }) => {
      return apiFetch(`/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(companyData),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  // Delete company
  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      return apiFetch(`/companies/${companyId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  return {
    companies: companiesQuery.data ?? [],
    isLoading: companiesQuery.isLoading,
    error: companiesQuery.error,
    directors: directorsQuery.data ?? [],
    directorsLoading: directorsQuery.isLoading,
    createCompany: createCompanyMutation.mutate,
    updateCompany: updateCompanyMutation.mutate,
    deleteCompany: deleteCompanyMutation.mutate,
    isCreating: createCompanyMutation.isPending,
    isUpdating: updateCompanyMutation.isPending,
    isDeleting: deleteCompanyMutation.isPending,
    createCompanyError: createCompanyMutation.error,
    updateCompanyError: updateCompanyMutation.error,
    createCompanySuccess: createCompanyMutation.isSuccess ? createCompanyMutation.data : null,
  }
}
