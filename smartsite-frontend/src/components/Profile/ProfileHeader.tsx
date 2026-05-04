import { UserIcon } from '../shared/icons/NavigationIcons'

interface ProfileHeaderProps {
  username: string
  email: string
  roles: string[]
  isEmailVerified: boolean
  isMobile: boolean
}

export default function ProfileHeader({
  username,
  email,
  roles,
  isEmailVerified,
  isMobile,
}: ProfileHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: '16px',
        paddingBottom: '24px',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px',
        flexDirection: isMobile ? 'column' : 'row',
      }}
    >
      <div
        style={{
          height: isMobile ? '64px' : '80px',
          width: isMobile ? '64px' : '80px',
          borderRadius: '50%',
          backgroundColor: '#CAEDF1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <UserIcon
          style={{
            height: isMobile ? '32px' : '40px',
            width: isMobile ? '32px' : '40px',
            color: '#075B7A',
          }}
        />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0,
          }}
        >
          {username}
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '4px 0 0 0',
          }}
        >
          {email}
        </p>
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              padding: '4px 12px',
              backgroundColor: '#CAEDF1',
              color: '#075B7A',
              borderRadius: '12px',
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: '500',
            }}
          >
            {roles.join(', ') || 'No roles'}
          </div>
          {!isEmailVerified && (
            <div
              style={{
                padding: '4px 12px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: '12px',
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: '500',
              }}
            >
              📧 Email Not Verified
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
