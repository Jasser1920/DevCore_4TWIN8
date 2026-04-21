import { useState, useEffect } from 'react'
import { validators } from '../../../lib/validators'
import { FormField, Button } from '../../../components/shared/UI'
import { useResponsive } from '../../../hooks/useResponsive'
import { useCompanies } from './useCompanies'
import { Building2 } from 'lucide-react'

export default function CreateCompanyForm() {
  const { isMobile } = useResponsive()
  const { 
    createCompany, 
    isCreating, 
    createCompanyError, 
    createCompanySuccess,
    directors,
    directorsLoading 
  } = useCompanies()
  
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactName: '',
    managerUserId: '',
  })

  // Handle API responses
  useEffect(() => {
    if (createCompanySuccess) {
      setMessage(createCompanySuccess.message)
      setErrorMessage('')
      setFieldErrors({})
      setForm({ 
        name: '', 
        description: '', 
        contactEmail: '', 
        contactName: '', 
        managerUserId: '' 
      })
    }
  }, [createCompanySuccess])

  useEffect(() => {
    if (createCompanyError) {
      setErrorMessage(createCompanyError.message)
    }
  }, [createCompanyError])

  const handleFieldChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value })
    
    // Real-time validation for email
    if (field === 'contactEmail') {
      const error = validators.email(value)
      if (error) {
        setFieldErrors({ ...fieldErrors, contactEmail: error })
      } else {
        setFieldErrors({ ...fieldErrors, contactEmail: '' })
      }
    }
  }

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {}
    let isValid = true

    if (!form.name.trim()) {
      errors.name = 'Company name is required'
      isValid = false
    }

    if (!form.description.trim()) {
      errors.description = 'Description is required'
      isValid = false
    }

    if (!form.contactName.trim()) {
      errors.contactName = 'Contact name is required'
      isValid = false
    }

    const emailError = validators.email(form.contactEmail)
    if (emailError) {
      errors.contactEmail = emailError
      isValid = false
    }

    if (!form.managerUserId) {
      errors.managerUserId = 'Please select a director'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (validateAllFields()) {
      createCompany(form)
    } else {
      setErrorMessage('Please fix the errors in the form')
    }
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: isMobile ? '20px' : '32px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
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
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '600',
            fontFamily: 'Poppins, sans-serif'
          }}>
            Create New Company
          </h2>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '14px', 
            color: '#6b7280' 
          }}>
            Add a new company to the system
          </p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#d1fae5',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#065f46',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fee2e2',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#991b1b',
          fontSize: '14px'
        }}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div data-tour="sa-create-company-name">
            <FormField
              label="Company Name"
              name="name"
              type="text"
              value={form.name}
              onChange={(value) => handleFieldChange('name', value)}
              placeholder="Enter company name"
              error={fieldErrors.name}
              required
            />
          </div>

          <FormField
            label="Contact Name"
            name="contactName"
            type="text"
            value={form.contactName}
            onChange={(value) => handleFieldChange('contactName', value)}
            placeholder="Enter contact person name"
            error={fieldErrors.contactName}
            required
          />

          <FormField
            label="Contact Email"
            name="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={(value) => handleFieldChange('contactEmail', value)}
            placeholder="contact@company.com"
            error={fieldErrors.contactEmail}
            required
          />

          <div data-tour="sa-create-company-director">
            <FormField
              label="Assigned Director"
              name="managerUserId"
              type="select"
              value={form.managerUserId}
              onChange={(value) => handleFieldChange('managerUserId', value)}
              options={[
                { value: '', label: directorsLoading ? 'Loading directors...' : 'Select a director' },
                ...directors.map(director => ({
                  value: director.id,
                  label: director.isEmailVerified 
                    ? `${director.firstName} ${director.lastName} - Director` 
                    : `${director.firstName} ${director.lastName} - Director (not verified)`,
                  disabled: !director.isEmailVerified
                }))
              ]}
              error={fieldErrors.managerUserId}
              required
              disabled={directorsLoading}
            />
          </div>
        </div>

        <FormField
          label="Description"
          name="description"
          type="textarea"
          value={form.description}
          onChange={(value) => handleFieldChange('description', value)}
          placeholder="Enter company description"
          error={fieldErrors.description}
          helpText="Provide a brief description of the company"
          required
        />

        <div style={{ 
          marginTop: '24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <div data-tour="sa-create-company-submit">
            <Button
              variant="primary"
              type="submit"
              icon={Building2}
              loading={isCreating}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Company'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
