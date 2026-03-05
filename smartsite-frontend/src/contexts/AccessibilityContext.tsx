import React, { createContext, useContext, useEffect, useState } from 'react'

export interface AccessibilitySettings {
  highContrast: boolean
  keyboardShortcutsEnabled: boolean
  largerText: boolean
  focusIndicators: boolean
  reducedMotion: boolean
  skipLinkVisible: boolean
  screenReaderAnnouncements: boolean
  focusTrapInModals: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  keyboardShortcutsEnabled: true,
  largerText: false,
  focusIndicators: true,
  reducedMotion: false,
  skipLinkVisible: true,
  screenReaderAnnouncements: true,
  focusTrapInModals: true,
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS)

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('a11y-settings')
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {
        setSettings(DEFAULT_SETTINGS)
      }
    }
  }, [])

  // Apply settings to document and save to localStorage
  useEffect(() => {
    const root = document.documentElement

    // High contrast
    if (settings.highContrast) {
      root.classList.add('a11y-high-contrast')
    } else {
      root.classList.remove('a11y-high-contrast')
    }

    // Larger text
    if (settings.largerText) {
      root.classList.add('a11y-large-text')
    } else {
      root.classList.remove('a11y-large-text')
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('a11y-reduced-motion')
    } else {
      root.classList.remove('a11y-reduced-motion')
    }

    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('a11y-focus-indicators')
    } else {
      root.classList.remove('a11y-focus-indicators')
    }

    // Save to localStorage
    localStorage.setItem('a11y-settings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}
