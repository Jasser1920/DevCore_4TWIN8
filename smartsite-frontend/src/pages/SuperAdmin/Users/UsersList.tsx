import { useState } from 'react'
import { Button, Table, Status } from '../../../components/shared/UI'
import { useUsers } from './useUsers'
import EditUserModal from './EditUserModal'
import UserDetailModal from './UserDetailModal'
import { exportUsersToPDF } from '../../../lib/pdfExport'
import { Edit, Trash, Download } from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  isEmailVerified: boolean
}

export default function UsersList() {
  const { users, isLoading, deleteUser } = useUsers()
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    {
      key: 'name',
      label: 'Name',
      render: (user: User) => `${user.firstName} ${user.lastName}`
    },
    {
      key: 'role',
      label: 'Role',
      render: (user: User) => (
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
      )
    },
    {
      key: 'isEmailVerified',
      label: 'Email Verified',
      render: (user: User) => (
        <Status
          type={user.isEmailVerified ? 'success' : 'error'}
          label={user.isEmailVerified ? 'Verified' : 'Not Verified'}
          size="small"
          icon={true}
        />
      )
    }
  ]

  const actions = [
    {
      label: 'Edit',
      icon: Edit,
      onClick: (user: User) => setEditingUser(user),
      variant: 'primary' as const
    },
    {
      label: 'Delete',
      icon: Trash,
      onClick: (user: User) => {
        if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
          deleteUser(user.id)
        }
      },
      variant: 'danger' as const
    }
  ]

  return (
    <>
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
          <Button
            onClick={() => exportUsersToPDF(users)}
            disabled={users.length === 0}
            title={users.length === 0 ? 'No users to export' : 'Export all users to PDF'}
            icon={Download}
            size="medium"
          >
            Export to PDF
          </Button>
        </div>

        <Table
          columns={columns}
          data={users}
          loading={isLoading}
          emptyMessage="No users found"
          actions={actions}
          getRowKey={(user) => user.id}
          onRowClick={(user) => setSelectedUser(user)}
        />
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  )
}
