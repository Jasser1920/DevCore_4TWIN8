import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import {  useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { clearTokens, getAccessToken, getRolesFromToken, getRefreshToken, getBusinessRoles } from '../lib/auth'
import { validators } from '../lib/validators'
import { useResponsive } from '../hooks/useResponsive'
import { ActivityLogs } from '../components/ActivityLogs'
import MetricCard from '../components/shared/UI/MetricCard'
import logoIcon from '../assets/logo smartsite.svg'

// Icon Components
const Building2 = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const Users = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const Activity = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const TrendingUp = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const LayoutDashboard = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
  </svg>
)

const Settings = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const LogOut = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const UserPlus = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
)

const Edit = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const Trash = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const X = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const Eye = ({ style }: { style?: React.CSSProperties }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

type CreateUserResponse = {
  message: string
  user: {
    id: string
    username: string
    email: string
    role: string
    keycloakId: string
  }
}

const roles = ['SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'QHSE_MANAGER', 'CLIENT']

export default function SuperAdmin() {
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
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
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
  })

  // Fetch users list
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      return apiFetch<{ users: any[] }>('/users/list', { method: 'GET' })
    },
  })

  const users = usersData?.users || []

  const createUserMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<CreateUserResponse>('/users/create', {
        method: 'POST',
        body: JSON.stringify(form),
      })
    },
    onSuccess: (data) => {
      setMessage(data.message)
      setErrorMessage('')
      setFieldErrors({})
      setShowPassword(false)
      setForm({ username: '', email: '', password: '', firstName: '', lastName: '', role: 'CLIENT' })
      refetchUsers() // Refresh the users list
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

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
      createUserMutation.mutate()
    } else {
      setErrorMessage('Please fix the errors in the form')
    }
  }

  const meMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ message: string; user: unknown }>('/users/me', {
        method: 'GET',
      })
    },
    onSuccess: (data) => {
      setProfileMessage(JSON.stringify(data, null, 2))
    },
    onError: (error: Error) => {
      setProfileMessage(error.message)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })
    },
    onSettled: () => {
      clearTokens()
      navigate('/login', { replace: true })
      window.setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.replace('/login')
        }
      }, 50)
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) return
      return apiFetch(`/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      })
    },
    onSuccess: () => {
      setEditingUser(null)
      refetchUsers()
      alert('User updated successfully!')
    },
    onError: (error: Error) => {
      alert('Failed to update user: ' + error.message)
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiFetch(`/users/${userId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      refetchUsers()
      alert('User deleted successfully!')
    },
    onError: (error: Error) => {
      alert('Failed to delete user: ' + error.message)
    },
  })

  // Companies State
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactName: '',
    managerUserId: '',
  })
  const [companyFormErrors, setCompanyFormErrors] = useState<Record<string, string>>({})
  const [companyMessage, setCompanyMessage] = useState('')
  const [companyError, setCompanyError] = useState('')

  // Fetch companies list
  const { data: companiesData, isLoading: companiesLoading, refetch: refetchCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      return apiFetch<{ data: any[] }>('/companies', { method: 'GET' })
    },
  })

  const companies = companiesData?.data || []

  // Fetch available directors for manager selection
  const { data: directorsData } = useQuery({
    queryKey: ['directors'],
    queryFn: async () => {
      return apiFetch<{ data: any[] }>('/companies/managers/available', { method: 'GET' })
    },
  })

  const directors = directorsData?.data || []

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ message: string }>('/companies', {
        method: 'POST',
        body: JSON.stringify(companyForm),
      })
    },
    onSuccess: (data) => {
      setCompanyMessage(data.message)
      setCompanyError('')
      setCompanyFormErrors({})
      setCompanyForm({ name: '', description: '', contactEmail: '', contactName: '', managerUserId: '' })
      refetchCompanies()
    },
    onError: (error: Error) => {
      setCompanyError(error.message)
    },
  })

  // Edit company state
  const [editingCompany, setEditingCompany] = useState<any>(null)
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: '',
    description: '',
    contactName: '',
    contactEmail: '',
    managerUserId: '',
    status: 'ACTIVE',
  })
  const [editCompanyFormErrors, setEditCompanyFormErrors] = useState<Record<string, string>>({})
  const [editCompanyError, setEditCompanyError] = useState('')

  const validateCompanyForm = (
    input: {
      name: string
      description: string
      contactEmail: string
      contactName: string
      managerUserId: string
    },
    options: { requireManager: boolean },
  ) => {
    const errors: Record<string, string> = {}

    const fieldValidators = {
      name: validators.companyName,
      description: validators.companyDescription,
      contactName: validators.companyContactName,
      contactEmail: validators.companyContactEmail,
      managerUserId: (value: string) =>
        validators.companyManagerUserId(value, options.requireManager),
    }

    ;(Object.keys(fieldValidators) as Array<keyof typeof fieldValidators>).forEach((field) => {
      const error = fieldValidators[field](input[field])
      if (error) {
        errors[field] = error
      }
    })

    return errors
  }

  const handleCompanyFormChange = (field: keyof typeof companyForm, value: string) => {
    setCompanyForm({ ...companyForm, [field]: value })

    const fieldValidators = {
      name: validators.companyName,
      description: validators.companyDescription,
      contactName: validators.companyContactName,
      contactEmail: validators.companyContactEmail,
      managerUserId: (inputValue: string) => validators.companyManagerUserId(inputValue, true),
    }

    const validator = fieldValidators[field]
    if (validator) {
      const error = validator(value)
      setCompanyFormErrors({ ...companyFormErrors, [field]: error || '' })
    }

    if (companyError) {
      setCompanyError('')
    }
  }

  const handleEditCompanyFormChange = (field: keyof typeof editCompanyForm, value: string) => {
    setEditCompanyForm({ ...editCompanyForm, [field]: value })

    const fieldValidators: Partial<
      Record<keyof typeof editCompanyForm, (inputValue: string) => string | null>
    > = {
      name: validators.companyName,
      description: validators.companyDescription,
      contactName: validators.companyContactName,
      contactEmail: validators.companyContactEmail,
      managerUserId: (inputValue: string) => validators.companyManagerUserId(inputValue, false),
    }

    const validator = fieldValidators[field]
    if (validator) {
      const error = validator(value)
      setEditCompanyFormErrors({ ...editCompanyFormErrors, [field]: error || '' })
    }

    if (editCompanyError) {
      setEditCompanyError('')
    }
  }

  // View company details state
  const [viewingCompany, setViewingCompany] = useState<any>(null)

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async () => {
      if (!editingCompany) return
      return apiFetch(`/companies/${editingCompany.id}`, {
        method: 'PUT',
        body: JSON.stringify(editCompanyForm),
      })
    },
    onSuccess: () => {
      setEditingCompany(null)
      setEditCompanyFormErrors({})
      setEditCompanyError('')
      refetchCompanies()
      alert('Company updated successfully!')
    },
    onError: (error: Error) => {
      setEditCompanyError(error.message)
      alert('Failed to update company: ' + error.message)
    },
  })

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      return apiFetch(`/companies/${companyId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      refetchCompanies()
      alert('Company deleted successfully!')
    },
    onError: (error: Error) => {
      alert('Failed to delete company: ' + error.message)
    },
  })

  const tokenRoles = getRolesFromToken(getAccessToken())
  
  // Filter to show only business roles
  const businessRoles = getBusinessRoles(tokenRoles)
  
  const [currentPage, setCurrentPage] = useState('dashboard')

  // Protect this page - only Super Admin can access
  useEffect(() => {
    if (!tokenRoles.includes('SUPER_ADMIN')) {
      navigate('/login', { replace: true })
    }
  }, [tokenRoles, navigate])

  // Make stats dynamic
  const stats = [
    {
      title: 'Total Users',
      value: users.length.toString(),
      description: 'Active accounts',
      icon: Users,
      color: '#075B7A',
      bgColor: '#CAEDF1',
    },
    {
      title: 'Active Projects',
      value: '12',
      description: 'In progress',
      icon: Activity,
      color: '#148ABB',
      bgColor: '#CAEDF1',
    },
    {
      title: 'Companies',
      value: '3',
      description: 'Total tenants',
      icon: Building2,
      color: '#075B72',
      bgColor: '#CAEDF1',
    },
    {
      title: 'Growth',
      value: '+23%',
      description: 'This month',
      icon: TrendingUp,
      color: '#22c55e',
      bgColor: '#dcfce7',
    },
  ]

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh',
      height: isMobile ? 'auto' : '100vh',
      backgroundColor: '#f9fafb'
    }}>
      {/* Sidebar */}
      <div style={{ 
        width: isMobile ? '100%' : '256px', 
        backgroundColor: '#075B7A', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ 
          padding: isMobile ? '16px' : '24px', 
          borderBottom: '1px solid #064d66'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={logoIcon} 
              alt="SmartSite" 
              style={{ height: isMobile ? '32px' : '40px', width: 'auto' }}
            />
            <span style={{ 
              fontSize: isMobile ? '18px' : '20px', 
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '600'
            }}>SMARTSITE</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          padding: isMobile ? '16px' : '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#148ABB' : 'transparent',
                  color: isActive ? 'white' : '#CAEDF1',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  fontWeight: '500',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = '#064d66')}
                onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Icon style={{ height: '20px', width: '20px' }} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div style={{ 
          padding: '16px', 
          borderTop: '1px solid #064d66'
        }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#064d66'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{
                height: '40px',
                width: '40px',
                borderRadius: '50%',
                backgroundColor: '#148ABB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                flexShrink: 0
              }}>
                SA
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '14px', margin: 0, color: 'white' }}>Super Admin</p>
                <p style={{ fontSize: '12px', color: '#CAEDF1', margin: 0 }}>
                  {businessRoles.join(', ')}
                </p>
              </div>
            </div>
          </button>
          <button
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#CAEDF1',
              border: 'none',
              cursor: logoutMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: logoutMutation.isPending ? 0.75 : 1,
              fontSize: '14px',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#064d66'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#CAEDF1'
            }}
          >
            <LogOut style={{ height: '16px', width: '16px' }} />
            <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '16px' : isTablet ? '20px 24px' : '24px 32px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '24px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: 0,
              fontFamily: 'Poppins, sans-serif'
            }}>
              {navItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Welcome back, manage your platform
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: isMobile ? '16px' : isTablet ? '24px' : '32px'
        }}>
          {currentPage === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Stats Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px'
              }}>
                {stats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <MetricCard
                      key={index}
                      title={stat.title}
                      value={stat.value}
                      color={stat.color}
                      subtitle={stat.description}
                      icon={
                        <div style={{
                          backgroundColor: stat.bgColor,
                          padding: '8px',
                          borderRadius: '8px',
                          display: 'inline-flex'
                        }}>
                          <Icon style={{ height: '20px', width: '20px', color: stat.color }} />
                        </div>
                      }
                    />
                  )
                })}
              </div>

              {/* Test Endpoint Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: isMobile ? '20px' : '32px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ 
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 8px 0',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Test Endpoints
                </h2>
                <p style={{ 
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0 0 16px 0'
                }}>
                  Verify your access token with protected endpoints
                </p>
                <button
                  onClick={() => meMutation.mutate()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#075B7A',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #075B7A',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#075B7A'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#075B7A'
                  }}
                >
                  Call /users/me
                </button>
                {profileMessage && (
                  <pre style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: '#1f2937',
                    color: '#10b981',
                    borderRadius: '8px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {profileMessage}
                  </pre>
                )}
              </div>
            </div>
          )}

          {currentPage === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Create User Card */}
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
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Username *
                      </label>
                      <input
                        value={form.username}
                        onChange={(e) => handleFieldChange('username', e.target.value)}
                        placeholder="john_director"
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: `1px solid ${fieldErrors.username ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        onFocus={(e) => !fieldErrors.username && (e.target.style.borderColor = '#148ABB')}
                        onBlur={(e) => !fieldErrors.username && (e.target.style.borderColor = '#e5e7eb')}
                      />
                      {fieldErrors.username && (
                        <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>
                          {fieldErrors.username}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        placeholder="john@example.com"
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: `1px solid ${fieldErrors.email ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        onFocus={(e) => !fieldErrors.email && (e.target.style.borderColor = '#148ABB')}
                        onBlur={(e) => !fieldErrors.email && (e.target.style.borderColor = '#e5e7eb')}
                      />
                      {fieldErrors.email && (
                        <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Password *
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
                            border: `1px solid ${fieldErrors.password ? '#ef4444' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          onFocus={(e) => !fieldErrors.password && (e.target.style.borderColor = '#148ABB')}
                          onBlur={(e) => !fieldErrors.password && (e.target.style.borderColor = '#e5e7eb')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #148ABB',
                            backgroundColor: '#ffffff',
                            color: '#148ABB',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #148ABB',
                            backgroundColor: '#ffffff',
                            color: '#148ABB',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Generate
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>
                          {fieldErrors.password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Role *
                      </label>
                      <select
                        value={form.role}
                        onChange={(e) => handleFieldChange('role', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: `1px solid ${fieldErrors.role ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => !fieldErrors.role && (e.target.style.borderColor = '#148ABB')}
                        onBlur={(e) => !fieldErrors.role && (e.target.style.borderColor = '#e5e7eb')}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.role && (
                        <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>
                          {fieldErrors.role}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        First Name *
                      </label>
                      <input
                        value={form.firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        placeholder="John"
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: `1px solid ${fieldErrors.firstName ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        onFocus={(e) => !fieldErrors.firstName && (e.target.style.borderColor = '#148ABB')}
                        onBlur={(e) => !fieldErrors.firstName && (e.target.style.borderColor = '#e5e7eb')}
                      />
                      {fieldErrors.firstName && (
                        <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>
                          {fieldErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Last Name *
                      </label>
                      <input
                        value={form.lastName}
                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        placeholder="Doe"
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: `1px solid ${fieldErrors.lastName ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        onFocus={(e) => !fieldErrors.lastName && (e.target.style.borderColor = '#148ABB')}
                        onBlur={(e) => !fieldErrors.lastName && (e.target.style.borderColor = '#e5e7eb')}
                      />
                      {fieldErrors.lastName && (
                        <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0 0' }}>
                          {fieldErrors.lastName}
                        </p>
                      )}
                    </div>
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

                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: createUserMutation.isPending ? '#94a3b8' : '#075B7A',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: createUserMutation.isPending ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => !createUserMutation.isPending && (e.currentTarget.style.backgroundColor = '#064d66')}
                    onMouseLeave={(e) => !createUserMutation.isPending && (e.currentTarget.style.backgroundColor = '#075B7A')}
                  >
                    <UserPlus style={{ height: '16px', width: '16px' }} />
                    <span>{createUserMutation.isPending ? 'Creating User...' : 'Create User'}</span>
                  </button>
                </form>
              </div>

              {/* All Users List Card */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    margin: 0,
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    All Users
                  </h2>
                </div>

                {usersLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    Loading users...
                  </div>
                ) : users.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No users found
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Username
                          </th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Email
                          </th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Name
                          </th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Role
                          </th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user: any) => (
                          <tr
                            key={user.id}
                            style={{
                              borderBottom: '1px solid #e5e7eb'
                            }}
                          >
                            <td style={{
                              padding: '16px 12px',
                              fontSize: '14px',
                              color: '#1a1a1a'
                            }}>
                              {user.username}
                            </td>
                            <td style={{
                              padding: '16px 12px',
                              fontSize: '14px',
                              color: '#1a1a1a'
                            }}>
                              {user.email}
                            </td>
                            <td style={{
                              padding: '16px 12px',
                              fontSize: '14px',
                              color: '#1a1a1a'
                            }}>
                              {user.firstName} {user.lastName}
                            </td>
                            <td style={{
                              padding: '16px 12px',
                              fontSize: '14px'
                            }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: '#CAEDF1',
                                color: '#075B7A'
                              }}>
                                {user.role}
                              </span>
                            </td>
                            <td style={{
                              padding: '16px 12px',
                              textAlign: 'right'
                            }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => {
                                    setEditingUser(user)
                                    setEditForm({
                                      firstName: user.firstName,
                                      lastName: user.lastName,
                                      email: user.email,
                                      role: user.role
                                    })
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#148ABB',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#117a9d'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#148ABB'}
                                >
                                  <Edit style={{ height: '16px', width: '16px' }} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
                                      deleteUserMutation.mutate(user.id)
                                    }
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                >
                                  <Trash style={{ height: '16px', width: '16px' }} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentPage === 'companies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Create Company Card */}
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
                    <Building2 style={{ height: '24px', width: '24px', color: '#075B7A' }} />
                  </div>
                  <div>
                    <h2 style={{ 
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      margin: 0,
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      Create New Company
                    </h2>
                    <p style={{ 
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '4px 0 0 0'
                    }}>
                      Add a new company/tenant to the platform
                    </p>
                  </div>
                </div>

                {companyMessage && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px'
                  }}>
                    ✓ {companyMessage}
                  </div>
                )}

                {companyError && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px'
                  }}>
                    ✗ {companyError}
                  </div>
                )}

                <form onSubmit={(e) => {
                  e.preventDefault()
                  const validationErrors = validateCompanyForm(companyForm, { requireManager: true })
                  setCompanyFormErrors(validationErrors)

                  if (Object.keys(validationErrors).length > 0) {
                    setCompanyError('Please fix the highlighted fields before creating the company.')
                    return
                  }

                  setCompanyError('')
                  createCompanyMutation.mutate()
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: '20px',
                    marginBottom: '24px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Company Name *
                      </label>
                      <input
                        value={companyForm.name}
                        onChange={(e) => handleCompanyFormChange('name', e.target.value)}
                        placeholder="e.g., ABC Construction Co."
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#148ABB')}
                        onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                      />
                      {companyFormErrors.name && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                          {companyFormErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Contact Name
                      </label>
                      <input
                        value={companyForm.contactName}
                        onChange={(e) => handleCompanyFormChange('contactName', e.target.value)}
                        placeholder="John Doe"
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#148ABB')}
                        onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                      />
                      {companyFormErrors.contactName && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                          {companyFormErrors.contactName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={companyForm.contactEmail}
                        onChange={(e) => handleCompanyFormChange('contactEmail', e.target.value)}
                        placeholder="contact@company.com"
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#148ABB')}
                        onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                      />
                      {companyFormErrors.contactEmail && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                          {companyFormErrors.contactEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Company Manager (Director) *
                      </label>
                      <select
                        value={companyForm.managerUserId}
                        onChange={(e) => handleCompanyFormChange('managerUserId', e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#148ABB')}
                        onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                      >
                        <option value="">Select a Director...</option>
                        {directors.map((director: any) => (
                          <option key={director.id} value={director.id}>
                            {director.firstName} {director.lastName} ({director.email})
                          </option>
                        ))}
                      </select>
                      {companyFormErrors.managerUserId && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                          {companyFormErrors.managerUserId}
                        </p>
                      )}
                    </div>

                    <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Description
                      </label>
                      <textarea
                        value={companyForm.description}
                        onChange={(e) => handleCompanyFormChange('description', e.target.value)}
                        placeholder="Enter company description..."
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          minHeight: '100px'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#148ABB')}
                        onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                      />
                      {companyFormErrors.description && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                          {companyFormErrors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyForm({ name: '', description: '', contactEmail: '', contactName: '', managerUserId: '' })
                        setCompanyFormErrors({})
                        setCompanyError('')
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: 'white',
                        color: '#6b7280',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={createCompanyMutation.isPending}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: createCompanyMutation.isPending ? '#94a3b8' : '#075B7A',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: createCompanyMutation.isPending ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => !createCompanyMutation.isPending && (e.currentTarget.style.backgroundColor = '#064d66')}
                      onMouseLeave={(e) => !createCompanyMutation.isPending && (e.currentTarget.style.backgroundColor = '#075B7A')}
                    >
                      {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Companies List Card */}
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
                    <Building2 style={{ height: '24px', width: '24px', color: '#075B7A' }} />
                  </div>
                  <div>
                    <h2 style={{ 
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      margin: 0,
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      Companies List
                    </h2>
                    <p style={{ 
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '4px 0 0 0'
                    }}>
                      Manage all companies on the platform
                    </p>
                  </div>
                </div>

                {companiesLoading ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>Loading companies...</p>
                ) : companies.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No companies found</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Company Name</th>
                          <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Manager</th>
                          <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Contact Email</th>
                          <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Status</th>
                          <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Created</th>
                          <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies.map((company: any) => (
                          <tr key={company.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#1a1a1a', fontWeight: '500' }}>{company.name}</td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{company.managerUserId ? 'Assigned' : 'Not assigned'}</td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{company.contactEmail || '-'}</td>
                            <td style={{ padding: '12px', fontSize: '14px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                backgroundColor: company.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                                color: company.status === 'ACTIVE' ? '#166534' : '#991b1b',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                {company.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                              {new Date(company.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px' }}>
                              {company.status !== 'SUSPENDED' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => setViewingCompany(company)}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#22c55e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
                                >
                                  <Eye style={{ height: '16px', width: '16px' }} />
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCompany(company)
                                    setEditCompanyFormErrors({})
                                    setEditCompanyError('')
                                    setEditCompanyForm({
                                      name: company.name,
                                      description: company.description || '',
                                      contactName: company.contactName || '',
                                      contactEmail: company.contactEmail || '',
                                      managerUserId: company.managerUserId || '',
                                      status: company.status,
                                    })
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#148ABB',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#117a9d'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#148ABB'}
                                >
                                  <Edit style={{ height: '16px', width: '16px' }} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete company ${company.name}?`)) {
                                      deleteCompanyMutation.mutate(company.id)
                                    }
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                >
                                  <Trash style={{ height: '16px', width: '16px' }} />
                                  Delete
                                </button>
                              </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit Company Modal */}
          {editingCompany && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    margin: 0,
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    Edit Company
                  </h2>
                  <button
                    onClick={() => {
                      setEditingCompany(null)
                      setEditCompanyFormErrors({})
                      setEditCompanyError('')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X style={{ height: '24px', width: '24px', color: '#6b7280' }} />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault()
                  const validationErrors = validateCompanyForm(editCompanyForm, { requireManager: false })
                  setEditCompanyFormErrors(validationErrors)

                  if (Object.keys(validationErrors).length > 0) {
                    setEditCompanyError('Please fix the highlighted fields before updating the company.')
                    return
                  }

                  setEditCompanyError('')
                  updateCompanyMutation.mutate()
                }}>
                  {editCompanyError && (
                    <div style={{
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      fontSize: '14px'
                    }}>
                      ✗ {editCompanyError}
                    </div>
                  )}

                  <div style={{
                    display: 'grid',
                    gap: '20px',
                    marginBottom: '24px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Company Name
                      </label>
                      <input
                        value={editCompanyForm.name}
                        onChange={(e) => handleEditCompanyFormChange('name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#148ABB'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                      {editCompanyFormErrors.name && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                          {editCompanyFormErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Contact Name
                      </label>
                      <input
                        value={editCompanyForm.contactName}
                        onChange={(e) => handleEditCompanyFormChange('contactName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#148ABB'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                      {editCompanyFormErrors.contactName && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                          {editCompanyFormErrors.contactName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={editCompanyForm.contactEmail}
                        onChange={(e) => handleEditCompanyFormChange('contactEmail', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#148ABB'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                      {editCompanyFormErrors.contactEmail && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                          {editCompanyFormErrors.contactEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Company Manager (Director)
                      </label>
                      <select
                        value={editCompanyForm.managerUserId}
                        onChange={(e) => handleEditCompanyFormChange('managerUserId', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#148ABB'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      >
                        <option value="">Select a Director...</option>
                        {directors.map((director: any) => (
                          <option key={director.id} value={director.id}>
                            {director.firstName} {director.lastName} ({director.email})
                          </option>
                        ))}
                      </select>
                      {editCompanyFormErrors.managerUserId && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                          {editCompanyFormErrors.managerUserId}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Status
                      </label>
                      <select
                        value={editCompanyForm.status}
                        onChange={(e) => setEditCompanyForm({ ...editCompanyForm, status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#148ABB'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Description
                      </label>
                      <textarea
                        value={editCompanyForm.description}
                        onChange={(e) => handleEditCompanyFormChange('description', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          minHeight: '100px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#148ABB'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                      {editCompanyFormErrors.description && (
                        <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#dc2626' }}>
                          {editCompanyFormErrors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCompany(null)
                        setEditCompanyFormErrors({})
                        setEditCompanyError('')
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateCompanyMutation.isPending}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: updateCompanyMutation.isPending ? '#94a3b8' : '#075B7A',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: updateCompanyMutation.isPending ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => !updateCompanyMutation.isPending && (e.currentTarget.style.backgroundColor = '#064d66')}
                      onMouseLeave={(e) => !updateCompanyMutation.isPending && (e.currentTarget.style.backgroundColor = '#075B7A')}
                    >
                      {updateCompanyMutation.isPending ? 'Updating...' : 'Update Company'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Company Details Modal */}
          {viewingCompany && (
            <div onClick={() => setViewingCompany(null)} style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              <div onClick={(e) => e.stopPropagation()} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #f3f4f6'
                }}>
                  <h2 style={{
                    fontSize: '28px',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    margin: 0,
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    Company Details
                  </h2>
                  <button
                    onClick={() => setViewingCompany(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X style={{ height: '24px', width: '24px', color: '#6b7280' }} />
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gap: '24px'
                }}>
                  {/* Company Name */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Company Name
                    </label>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#1a1a1a',
                      margin: 0
                    }}>
                      {viewingCompany.name}
                    </p>
                  </div>

                  {/* Status */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Status
                    </label>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '500',
                      backgroundColor: viewingCompany.status === 'ACTIVE' 
                        ? '#d1fae5' 
                        : viewingCompany.status === 'SUSPENDED'
                        ? '#fee2e2'
                        : '#e5e7eb',
                      color: viewingCompany.status === 'ACTIVE'
                        ? '#065f46'
                        : viewingCompany.status === 'SUSPENDED'
                        ? '#991b1b'
                        : '#374151'
                    }}>
                      {viewingCompany.status}
                    </span>
                  </div>

                  {/* Two-column layout for Contact Info */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '16px'
                  }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Contact Name
                      </label>
                      <p style={{
                        fontSize: '15px',
                        color: '#1a1a1a',
                        margin: 0
                      }}>
                        {viewingCompany.contactName || 'Not set'}
                      </p>
                    </div>

                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Contact Email
                      </label>
                      <p style={{
                        fontSize: '15px',
                        color: '#1a1a1a',
                        margin: 0,
                        wordBreak: 'break-word'
                      }}>
                        {viewingCompany.contactEmail || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Company Manager */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Company Manager (Director)
                    </label>
                    <p style={{
                      fontSize: '15px',
                      color: '#1a1a1a',
                      margin: 0
                    }}>
                      {viewingCompany.managerUserId 
                        ? directors.find((d: any) => d.id === viewingCompany.managerUserId)
                          ? `${directors.find((d: any) => d.id === viewingCompany.managerUserId).firstName} ${directors.find((d: any) => d.id === viewingCompany.managerUserId).lastName} (${directors.find((d: any) => d.id === viewingCompany.managerUserId).email})`
                          : viewingCompany.managerUserId
                        : 'Not assigned'}
                    </p>
                  </div>

                  {/* Storage Information */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '16px'
                  }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Storage Quota
                      </label>
                      <p style={{
                        fontSize: '15px',
                        color: '#1a1a1a',
                        margin: 0
                      }}>
                        {(viewingCompany.storageQuota / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </p>
                    </div>

                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Storage Used
                      </label>
                      <p style={{
                        fontSize: '15px',
                        color: '#1a1a1a',
                        margin: 0
                      }}>
                        {(viewingCompany.usedStorage / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {viewingCompany.description && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Description
                      </label>
                      <p style={{
                        fontSize: '15px',
                        color: '#4b5563',
                        margin: 0,
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {viewingCompany.description}
                      </p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '16px'
                  }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Created At
                      </label>
                      <p style={{
                        fontSize: '15px',
                        color: '#1a1a1a',
                        margin: 0
                      }}>
                        {new Date(viewingCompany.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Last Updated
                      </label>
                      <p style={{
                        fontSize: '15px',
                        color: '#1a1a1a',
                        margin: 0
                      }}>
                        {new Date(viewingCompany.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <div style={{ 
                  marginTop: '32px',
                  paddingTop: '24px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => setViewingCompany(null)}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#075B7A',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#064d66'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#075B7A'}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentPage !== 'dashboard' && currentPage !== 'users' && currentPage !== 'companies' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: isMobile ? '24px' : '48px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ 
                fontSize: '24px',
                fontWeight: '600',
                color: '#1a1a1a',
                margin: '0 0 8px 0',
                fontFamily: 'Poppins, sans-serif'
              }}>
                {navItems.find(item => item.id === currentPage)?.label}
              </h2>
              <p style={{ 
                fontSize: '14px',
                color: '#6b7280',
                margin: 0
              }}>
                This page is under construction
              </p>
            </div>
          )}

          {currentPage === 'activity-logs' && (
            <div style={{ padding: isMobile ? '20px 0' : '24px 0' }}>
              <ActivityLogs isSuperAdmin={true} />
            </div>
          )}
        </main>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: isMobile ? '20px' : '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1a1a1a',
                margin: 0,
                fontFamily: 'Poppins, sans-serif'
              }}>
                Edit User
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X style={{ height: '24px', width: '24px', color: '#6b7280' }} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              updateUserMutation.mutate()
            }}>
              <div style={{
                display: 'grid',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    First Name
                  </label>
                  <input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#148ABB'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                    Last Name
                  </label>
                  <input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#148ABB'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#148ABB'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#148ABB'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: updateUserMutation.isPending ? '#94a3b8' : '#075B7A',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: updateUserMutation.isPending ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => !updateUserMutation.isPending && (e.currentTarget.style.backgroundColor = '#064d66')}
                  onMouseLeave={(e) => !updateUserMutation.isPending && (e.currentTarget.style.backgroundColor = '#075B7A')}
                >
                  {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
