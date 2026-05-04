import DeviceManagement from '../DeviceManagement'

interface ProfileDeviceManagementProps {
  isMobile: boolean
}

export default function ProfileDeviceManagement({
  isMobile,
}: ProfileDeviceManagementProps) {
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
      <DeviceManagement />
    </div>
  )
}
