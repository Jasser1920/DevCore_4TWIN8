import { useState } from 'react'
import { useResponsive } from '../../../hooks/useResponsive'
import { useAccessibility } from '../../../contexts/AccessibilityContext'
import { Button } from '../../../components/shared/UI'
import { Check, AlertCircle } from 'lucide-react'

interface SettingsSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div style={{
      marginBottom: '32px',
      paddingBottom: '24px',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#1a1a1a',
        margin: '0 0 8px 0',
        fontFamily: 'Poppins, sans-serif'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: '#6b7280',
        margin: '0 0 16px 0',
        lineHeight: '1.5'
      }}>
        {description}
      </p>
      {children}
    </div>
  )
}

function AccessibilityToggle({
  id,
  label,
  description,
  enabled,
  onChange
}: {
  id: string
  label: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      padding: '12px 0',
      borderBottom: '1px solid #f3f4f6'
    }}>
      <div style={{ flex: 1 }}>
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#1a1a1a',
            marginBottom: '4px',
            cursor: 'pointer'
          }}
        >
          {label}
        </label>
        <p style={{
          fontSize: '13px',
          color: '#6b7280',
          margin: 0
        }}>
          {description}
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '48px',
          height: '28px',
          backgroundColor: enabled ? '#148ABB' : '#d1d5db',
          borderRadius: '14px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background-color 0.3s, box-shadow 0.2s',
          border: enabled ? '2px solid #075B7A' : '2px solid #9ca3af'
        }}
        onClick={() => onChange(!enabled)}
        role="switch"
        aria-checked={enabled}
        aria-labelledby={id}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onChange(!enabled)
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '20px',
            height: '20px',
            backgroundColor: 'white',
            borderRadius: '50%',
            left: enabled ? 'calc(100% - 24px)' : '4px',
            transition: 'left 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {enabled && (
            <Check style={{ width: '12px', height: '12px', color: '#148ABB' }} />
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsView() {
  const { isMobile, isTablet } = useResponsive()
  const { settings, updateSettings } = useAccessibility()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleAccessibilityChange = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value })
  }

  const handleSaveSettings = () => {
    setSaveStatus('saving')
    setErrorMessage('')

    // Simulate save (just local storage since no backend)
    setTimeout(() => {
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }, 500)
  }

  const cardPadding = isMobile ? '20px' : isTablet ? '24px' : '32px'

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Accessibility Settings Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: cardPadding,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: '600',
          color: '#1a1a1a',
          margin: '0 0 8px 0',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Accessibility Settings
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: '0 0 24px 0',
          lineHeight: '1.5'
        }}>
          Customize accessibility features to improve your user experience.
        </p>

        {/* Vision Settings */}
        <SettingsSection
          title="Vision Enhancements"
          description="Adjust display settings for better visibility and reduced eye strain"
        >
          <AccessibilityToggle
            id="highContrast"
            label="High Contrast Mode"
            description="Increases contrast between text and background colors for better readability"
            enabled={settings.highContrast}
            onChange={(value) => handleAccessibilityChange('highContrast', value)}
          />
          <AccessibilityToggle
            id="largerText"
            label="Larger Text"
            description="Increases default font sizes across the entire application"
            enabled={settings.largerText}
            onChange={(value) => handleAccessibilityChange('largerText', value)}
          />
        </SettingsSection>

        {/* Motor & Navigation Settings */}
        <SettingsSection
          title="Navigation & Motor Control"
          description="Improve navigation and interaction features"
        >
          <AccessibilityToggle
            id="keyboardShortcutsEnabled"
            label="Keyboard Shortcuts"
            description="Enable keyboard navigation shortcuts for faster access to features"
            enabled={settings.keyboardShortcutsEnabled}
            onChange={(value) => handleAccessibilityChange('keyboardShortcutsEnabled', value)}
          />
          <AccessibilityToggle
            id="focusIndicators"
            label="Enhanced Focus Indicators"
            description="Display visible focus outlines on all interactive elements"
            enabled={settings.focusIndicators}
            onChange={(value) => handleAccessibilityChange('focusIndicators', value)}
          />
          <AccessibilityToggle
            id="focusTrapInModals"
            label="Focus Trap in Modal Dialogs"
            description="Keep focus within modal dialogs for keyboard-only navigation"
            enabled={settings.focusTrapInModals}
            onChange={(value) => handleAccessibilityChange('focusTrapInModals', value)}
          />
        </SettingsSection>

        {/* Motion & Animation Settings */}
        <SettingsSection
          title="Motion & Animation"
          description="Control animation and motion effects"
        >
          <AccessibilityToggle
            id="reducedMotion"
            label="Reduce Motion"
            description="Minimizes animations and transitions for users sensitive to motion"
            enabled={settings.reducedMotion}
            onChange={(value) => handleAccessibilityChange('reducedMotion', value)}
          />
        </SettingsSection>

        {/* Screen Reader Settings */}
        <SettingsSection
          title="Screen Reader Support"
          description="Enhance compatibility with screen readers"
        >
          <AccessibilityToggle
            id="screenReaderAnnouncements"
            label="Announcements"
            description="Enable screen reader announcements for dynamic content updates"
            enabled={settings.screenReaderAnnouncements}
            onChange={(value) => handleAccessibilityChange('screenReaderAnnouncements', value)}
          />
          <AccessibilityToggle
            id="skipLinkVisible"
            label="Skip Links"
            description="Show skip-to-content links for keyboard navigation"
            enabled={settings.skipLinkVisible}
            onChange={(value) => handleAccessibilityChange('skipLinkVisible', value)}
          />
        </SettingsSection>

        {/* Status Messages */}
        {saveStatus === 'success' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#15803d',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            <Check style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>Settings updated successfully</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '24px'
        }}>
          <Button
            variant="secondary"
            onClick={() => {
              window.location.reload()
            }}
            ariaLabel="Reset settings to defaults"
          >
            Reset to Defaults
          </Button>
          <Button
            variant="primary"
            loading={saveStatus === 'saving'}
            onClick={handleSaveSettings}
            ariaLabel="Save accessibility settings"
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '12px',
        padding: cardPadding
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#075b7a',
          margin: '0 0 8px 0',
          fontFamily: 'Poppins, sans-serif'
        }}>
          💡 Tip
        </h3>
        <p style={{
          fontSize: '13px',
          color: '#0369a1',
          margin: 0,
          lineHeight: '1.5'
        }}>
          Your accessibility preferences are automatically saved to your browser's local storage. These settings will be restored when you return to the application.
        </p>
      </div>
    </div>
  )
}
