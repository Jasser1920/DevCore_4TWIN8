import { useAccessibility } from '../../contexts/AccessibilityContext'

export default function SkipToContent() {
  const { settings } = useAccessibility()

  if (!settings.skipLinkVisible) return null

  return (
    <a
      href="#main-content"
      className="skip-to-content"
      style={{
        position: 'absolute',
        top: '-40px',
        left: 0,
        backgroundColor: '#075B7A',
        color: 'white',
        padding: '8px 16px',
        textDecoration: 'none',
        borderRadius: '0 0 4px 0',
        zIndex: 9999,
        fontWeight: 600,
        transition: 'top 0.2s ease-out',
        fontSize: '14px',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0'
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px'
      }}
    >
      Skip to main content
    </a>
  )
}
