import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../lib/api'



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

  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        const data = await apiFetch<any>('/companies', { method: 'GET' })
        console.log('Companies API response:', data)
        
        if (Array.isArray(data)) {
          console.log('Response is array, returning directly')
          return data
        }
        if (data?.data && Array.isArray(data.data)) {
          console.log('Response has .data property, returning that')
          return data.data
        }
        if (data?.companies && Array.isArray(data.companies)) {
          console.log('Response has .companies property, returning that')
          return data.companies
        }
        console.warn('Could not extract array from response, returning empty array')
        return []
      } catch (error) {
        console.error('Error fetching companies:', error)
        return []
      }
    },
  })

  const directorsQuery = useQuery({
    queryKey: ['directors'],
    queryFn: async () => {
      try {
        const data = await apiFetch<any>('/companies/managers/available', { method: 'GET' })
        console.log('Directors API response:', data)
        
        if (Array.isArray(data)) {
          console.log('Response is array, returning directly')
          return data
        }
        if (data?.data && Array.isArray(data.data)) {
          console.log('Response has .data property, returning that')
          return data.data
        }
        if (data?.directors && Array.isArray(data.directors)) {
          console.log('Response has .directors property, returning that')
          return data.directors
        }
        console.warn('Could not extract array from response, returning empty array')
        return []
      } catch (error) {
        console.error('Error fetching directors:', error)
        return []
      }
    },
  })

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
