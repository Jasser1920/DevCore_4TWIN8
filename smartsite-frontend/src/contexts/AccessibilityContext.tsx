import React, { createContext, useContext, useEffect, useState } from 'react'
import { getAccessToken, getSubjectFromToken, onAuthStateChanged } from '../lib/auth'

export interface AccessibilitySettings {
  highContrast: boolean
  keyboardShortcutsEnabled: boolean
  largerText: boolean
  focusIndicators: boolean
  reducedMotion: boolean
  skipLinkVisible: boolean
  screenReaderAnnouncements: boolean
  focusTrapInModals: boolean
  guidedTipsEnabled: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void
  resetSettings: () => void
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
  guidedTipsEnabled: true,
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS)
  const [storageKey, setStorageKey] = useState(() => getStorageKey())
  const [isHydrated, setIsHydrated] = useState(false)

  function getStorageKey() {
    const token = getAccessToken()
    const subject = getSubjectFromToken(token) || 'anonymous'
    return `a11y-settings:${subject}`
  }

  useEffect(() => {
    const syncStorageKey = () => {
      setStorageKey(getStorageKey())
    }

    syncStorageKey()
    const disposeAuthListener = onAuthStateChanged(syncStorageKey)
    window.addEventListener('storage', syncStorageKey)

    return () => {
      disposeAuthListener()
      window.removeEventListener('storage', syncStorageKey)
    }
  }, [])

  // Load settings from localStorage
  useEffect(() => {
    setIsHydrated(false)
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
      } catch {
        setSettings(DEFAULT_SETTINGS)
      }
    } else {
      setSettings(DEFAULT_SETTINGS)
    }
    setIsHydrated(true)
  }, [storageKey])

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

    if (!isHydrated) {
      return
    }

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(settings))
  }, [settings, storageKey, isHydrated])

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, resetSettings }}>
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
