import logoIcon from '../assets/logo smartsite.svg'

interface LoadingPageProps {
  isVisible: boolean
}

export default function LoadingPage({ isVisible }: LoadingPageProps) {
  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      zIndex: 9999,
      backdropFilter: 'blur(4px)',
    }}>
      {/* Logo */}
      <div style={{
        marginBottom: '40px',
        animation: 'fadeIn 0.6s ease-in-out',
      }}>
        <img 
          src={logoIcon} 
          alt="SmartSite" 
          style={{
            height: '80px',
            width: 'auto',
          }}
        />
      </div>

      {/* Loading Spinner */}
      <div style={{
        position: 'relative',
        width: '50px',
        height: '50px',
        animation: 'spin 1.5s linear infinite',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          border: '3px solid #e0e0e0',
          borderTopColor: '#075B7A',
          borderRightColor: '#075B7A',
        }} />
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
