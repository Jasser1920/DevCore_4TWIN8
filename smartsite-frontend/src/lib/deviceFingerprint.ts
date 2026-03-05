/**
 * Generate a device fingerprint based on browser and system information
 */
export function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    navigator.hardwareConcurrency || 0,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height,
    screen.colorDepth,
  ]

  // Create a simple hash from the components
  const fingerprint = components.join('|')
  return btoa(fingerprint) // Base64 encode for consistency
}

/**
 * Get a human-readable device name
 */
export function getDeviceName(): string {
  const ua = navigator.userAgent
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  // Detect browser
  if (ua.includes('Firefox/')) {
    browser = 'Firefox'
  } else if (ua.includes('Edg/')) {
    browser = 'Edge'
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    browser = 'Chrome'
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    browser = 'Safari'
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browser = 'Opera'
  }

  // Detect OS
  if (ua.includes('Windows NT 10.0')) {
    os = 'Windows 10/11'
  } else if (ua.includes('Windows NT 6.3')) {
    os = 'Windows 8.1'
  } else if (ua.includes('Windows NT 6.2')) {
    os = 'Windows 8'
  } else if (ua.includes('Windows NT 6.1')) {
    os = 'Windows 7'
  } else if (ua.includes('Windows')) {
    os = 'Windows'
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS'
  } else if (ua.includes('Linux')) {
    os = 'Linux'
  } else if (ua.includes('Android')) {
    os = 'Android'
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS'
  }

  return `${browser} on ${os}`
}

/**
 * Store device trust preference in localStorage
 */
const DEVICE_FINGERPRINT_KEY = 'smartsite_device_fingerprint'
const REMEMBER_DEVICE_KEY = 'smartsite_remember_device'

export function getStoredDeviceFingerprint(): string | null {
  return localStorage.getItem(DEVICE_FINGERPRINT_KEY)
}

export function setStoredDeviceFingerprint(fingerprint: string) {
  localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint)
}

export function clearStoredDeviceFingerprint() {
  localStorage.removeItem(DEVICE_FINGERPRINT_KEY)
  localStorage.removeItem(REMEMBER_DEVICE_KEY)
}

export function shouldRememberDevice(): boolean {
  return localStorage.getItem(REMEMBER_DEVICE_KEY) === 'true'
}

export function setRememberDevice(remember: boolean) {
  localStorage.setItem(REMEMBER_DEVICE_KEY, remember.toString())
}
