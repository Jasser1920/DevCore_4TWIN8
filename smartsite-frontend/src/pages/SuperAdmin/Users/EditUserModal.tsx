import { useState, useEffect } from 'react'
import { Modal, FormField, Button } from '../../../components/shared/UI'
import { useResponsive } from '../../../hooks/useResponsive'
import { useUsers } from './useUsers'
import { X, Save } from 'lucide-react'

const roles = ['SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'QHSE_MANAGER', 'CLIENT']

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
}

interface EditUserModalProps {
  user: User
  onClose: () => void
}

export default function EditUserModal({ user, onClose }: EditUserModalProps) {
  const { isMobile } = useResponsive()
  const { updateUser, isUpdating, updateUserError } = useUsers()
  
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role
  })

  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Close modal on successful update
  useEffect(() => {
    if (hasSubmitted && !isUpdating && !updateUserError) {
      const timer = setTimeout(() => {
        onClose()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isUpdating, hasSubmitted, updateUserError, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setHasSubmitted(true)
    updateUser({
      id: user.id,
      ...form
    })
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit User"
      isMobile={isMobile}
    >
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <FormField
            label="First Name"
            name="firstName"
            value={form.firstName}
            onChange={(value) => setForm({ ...form, firstName: value })}
            required
          />

          <FormField
            label="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={(value) => setForm({ ...form, lastName: value })}
            required
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
            required
          />

          <FormField
            label="Role"
            name="role"
            type="select"
            value={form.role}
            onChange={(value) => setForm({ ...form, role: value })}
            required
            options={roles.map(role => ({ value: role, label: role }))}
          />
        </div>

        {updateUserError && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>
              {updateUserError.message}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="secondary"
            icon={X}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={Save}
            loading={isUpdating}
            disabled={isUpdating}
          >
            Update User
          </Button>
        </div>
      </form>
    </Modal>
  )
}
