import { useState } from 'react'
import FormInput from '../shared/FormInput'
import AlertMessage from '../shared/AlertMessage'

interface ProfileUpdateFormProps {
  initialData: {
    firstName: string
    lastName: string
    email: string
  }
  onSubmit: (data: { firstName: string; lastName: string; email: string }) => void
  isLoading: boolean
  message?: string
  error?: string
  isMobile: boolean
}

export default function ProfileUpdateForm({
  initialData,
  onSubmit,
  isLoading,
  message,
  error,
  isMobile,
}: ProfileUpdateFormProps) {
  const [form, setForm] = useState(initialData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: isMobile ? '20px' : '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px',
      }}
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <FormInput
            label="First Name"
            value={form.firstName}
            onChange={(value) => setForm({ ...form, firstName: value })}
            placeholder="John"
          />

          <FormInput
            label="Last Name"
            value={form.lastName}
            onChange={(value) => setForm({ ...form, lastName: value })}
            placeholder="Doe"
          />

          <div style={{ gridColumn: '1 / -1' }}>
            <FormInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm({ ...form, email: value })}
              placeholder="john@example.com"
            />
          </div>
        </div>

        {message && <AlertMessage type="success" message={message} />}
        {error && <AlertMessage type="error" message={error} />}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: isLoading ? '#94a3b8' : '#075B7A',
            color: 'white',
            fontSize: '16px',
            fontWeight: '500',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) =>
            !isLoading && (e.currentTarget.style.backgroundColor = '#064d66')
          }
          onMouseLeave={(e) =>
            !isLoading && (e.currentTarget.style.backgroundColor = '#075B7A')
          }
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  )
}
