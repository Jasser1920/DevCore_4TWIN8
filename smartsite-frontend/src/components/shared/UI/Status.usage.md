/**
 * STATUS COMPONENT USAGE GUIDE
 * 
 * The Status component provides a button-like styled badge for displaying
 * different status types across your application.
 * 
 * Import:
 * import { Status } from '../components/shared/UI'
 */

// ============================================================================
// EXAMPLE 1: USERS LIST - Using Status for Email Verification
// ============================================================================

/*
Replace the existing render function in UsersList.tsx:

{
  key: 'isEmailVerified',
  label: 'Email Verified',
  render: (user: User) => (
    <Status
      type={user.isEmailVerified ? 'success' : 'error'}
      label={user.isEmailVerified ? 'Verified' : 'Not Verified'}
      size="small"
    />
  )
}

Also works for user account status:
{
  key: 'accountStatus',
  label: 'Account Status',
  render: (user: User) => {
    const statusMap = {
      'active': { type: 'success' as const, label: 'Active' },
      'suspended': { type: 'error' as const, label: 'Suspended' },
      'pending': { type: 'pending' as const, label: 'Pending' }
    }
    const status = statusMap[user.accountStatus] || { type: 'info', label: 'Unknown' }
    return <Status type={status.type} label={status.label} size="small" />
  }
}
*/

// ============================================================================
// EXAMPLE 2: ACTIVITY LOGS - Using Status for Log Status
// ============================================================================

/*
Replace the emoji status in ActivityLogs.tsx:

// Current code:
<span style={{ fontSize: '16px' }}>{STATUS_ICONS[log.status]}</span>

// New code with Status component:
<Status 
  type={
    log.status === 'SUCCESS' ? 'success' :
    log.status === 'FAILED' ? 'error' :
    'info'
  }
  label={log.status}
  size="small"
  icon={true}
/>
*/

// ============================================================================
// EXAMPLE 3: COMPANIES LIST - Using Status for Company Status
// ============================================================================

/*
For companies (in Companies/CompaniesList.tsx or similar):

{
  key: 'status',
  label: 'Status',
  render: (company: Company) => {
    const statusMap = {
      'active': { type: 'success' as const, label: 'Active' },
      'suspended': { type: 'error' as const, label: 'Suspended' },
      'inactive': { type: 'warning' as const, label: 'Inactive' },
      'archived': { type: 'info' as const, label: 'Archived' }
    }
    const status = statusMap[company.status] || { type: 'info', label: 'Unknown' }
    return <Status type={status.type} label={status.label} size="small" />
  }
}
*/

// ============================================================================
// STATUS TYPES AND THEIR MEANINGS
// ============================================================================

/*
StatusType can be one of:
- 'success': Green badge - Use for verified, active, completed, successful states
- 'error': Red badge - Use for failed, suspended, error, blocked states
- 'pending': Amber badge - Use for pending, in-progress, waiting states
- 'warning': Orange badge - Use for warnings, attention needed, at-risk states
- 'info': Blue badge - Use for general information, neutral states

Examples for each type:

User:
  - Verified email:     <Status type="success" label="Verified" size="small" />
  - Not Verified:       <Status type="error" label="Not Verified" size="small" />
  - Pending:            <Status type="pending" label="Pending" size="small" />
  - Active Account:     <Status type="success" label="Active" size="small" />
  - Suspended Account:  <Status type="error" label="Suspended" size="small" />

Company:
  - Active:             <Status type="success" label="Active" size="small" />
  - Suspended:          <Status type="error" label="Suspended" size="small" />
  - Inactive:           <Status type="warning" label="Inactive" size="small" />
  - Archived:           <Status type="info" label="Archived" size="small" />

Activity Log:
  - Success:            <Status type="success" label="Success" size="small" />
  - Failed:             <Status type="error" label="Failed" size="small" />
  - Info:               <Status type="info" label="Info" size="small" />
*/

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/*
interface StatusProps {
  type: 'success' | 'error' | 'pending' | 'warning' | 'info'
  label: string
  size?: 'small' | 'medium' | 'large'  // default: 'medium'
  icon?: boolean                         // default: true
  className?: string                     // optional custom CSS class
}

Examples:
<Status type="success" label="Verified" />                    // Default medium with icon
<Status type="error" label="Failed" size="small" />            // Small without icon
<Status type="pending" label="Processing" size="large" />      // Large with icon
<Status type="warning" label="Attention" icon={false} />       // No icon displayed
<Status type="info" label="Status" className="custom-class" /> // With custom class
*/

// ============================================================================
// SIZES
// ============================================================================

/*
- small:   Height 24px, padding 4px 8px, font-size 12px
- medium:  Height 28px, padding 6px 12px, font-size 13px (default)
- large:   Height 32px, padding 8px 16px, font-size 14px
*/

// ============================================================================
// COMPLETE EXAMPLE: Users List with Multiple Status Indicators
// ============================================================================

/*
import { Status } from '../components/shared/UI'
import { useUsers } from './useUsers'

export default function UsersList() {
  const { users, isLoading, deleteUser } = useUsers()
  
  const getEmailStatus = (user: User) => ({
    type: user.isEmailVerified ? 'success' : 'error',
    label: user.isEmailVerified ? 'Verified' : 'Not Verified'
  })
  
  const getAccountStatus = (user: User) => {
    const statusMap = {
      'active': { type: 'success', label: 'Active' },
      'suspended': { type: 'error', label: 'Suspended' },
      'pending': { type: 'pending', label: 'Pending' }
    }
    return statusMap[user.accountStatus] || { type: 'info', label: 'Unknown' }
  }

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    {
      key: 'name',
      label: 'Name',
      render: (user: User) => `${user.firstName} ${user.lastName}`
    },
    {
      key: 'isEmailVerified',
      label: 'Email',
      render: (user: User) => {
        const status = getEmailStatus(user)
        return <Status type={status.type as any} label={status.label} size="small" />
      }
    },
    {
      key: 'accountStatus',
      label: 'Account Status',
      render: (user: User) => {
        const status = getAccountStatus(user)
        return <Status type={status.type as any} label={status.label} size="small" />
      }
    }
  ]

  return (
    // ... rest of component
  )
}
*/

export {}
