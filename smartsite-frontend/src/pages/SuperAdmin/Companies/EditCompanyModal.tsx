import { useState, useEffect } from 'react'
import { validators } from '../../../lib/validators'
import { Modal, FormField, Button } from '../../../components/shared/UI'
import { useResponsive } from '../../../hooks/useResponsive'
import { useCompanies } from './useCompanies'
import { X, Save } from 'lucide-react'

interface Company {
  id: string
  name: string
  description: string
  contactEmail: string
  contactName: string
  managerUserId: string
  status: string
  createdAt: string
}

interface Director {
  id: string
  firstName: string
  lastName: string
  isEmailVerified: boolean
}

interface EditCompanyModalProps {
  company: Company
  onClose: () => void
}

export default function EditCompanyModal({ company, onClose }: EditCompanyModalProps) {
  const { isMobile } = useResponsive()
  const { updateCompany, isUpdating, directors, directorsLoading } = useCompanies()
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  const [form, setForm] = useState({
    name: company.name,
    description: company.description,
    contactEmail: company.contactEmail,
    contactName: company.contactName,
    managerUserId: company.managerUserId,
    status: company.status,
  })

  useEffect(() => {
    if (hasSubmitted && !isUpdating) {
      onClose()
    }
  }, [hasSubmitted, isUpdating, onClose])

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
    setErrorMessage('')

    if (validateAllFields()) {
      updateCompany({ id: company.id, ...form })
      setHasSubmitted(true)
    } else {
      setErrorMessage('Please fix the errors in the form')
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Company"
      maxWidth="700px"
      isMobile={isMobile}
    >
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

          <FormField
            label="Assigned Director"
            name="managerUserId"
            type="select"
            value={form.managerUserId}
            onChange={(value) => handleFieldChange('managerUserId', value)}
            options={[
              { value: '', label: directorsLoading ? 'Loading directors...' : 'Select a director' },
              ...directors.map((director: Director) => ({
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

          <FormField
            label="Status"
            name="status"
            type="select"
            value={form.status}
            onChange={(value) => handleFieldChange('status', value)}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'SUSPENDED', label: 'Suspended' }
            ]}
            required
          />
        </div>

        <FormField
          label="Description"
          name="description"
          type="textarea"
          value={form.description}
          onChange={(value) => handleFieldChange('description', value)}
          placeholder="Enter company description"
          error={fieldErrors.description}
          required
        />

        <div style={{ 
          marginTop: '24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <Button
            variant="secondary"
            icon={X}
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={Save}
            loading={isUpdating}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Company'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
