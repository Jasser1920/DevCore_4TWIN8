/**
 * Focus Management Utilities
 * Provides helper functions for keyboard navigation and focus trapping
 */

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
]

const FOCUSABLE_SELECTOR = FOCUSABLE_ELEMENTS.join(',')

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
  return elements.filter((el) => {
    return el instanceof HTMLElement && isVisible(el)
  }) as HTMLElement[]
}

/**
 * Check if element is visible in the DOM
 */
function isVisible(element: HTMLElement): boolean {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusables = getFocusableElements(container)
  if (focusables.length > 0) {
    focusables[0].focus()
  }
}

/**
 * Focus the last focusable element in a container
 */
export function focusLastElement(container: HTMLElement): void {
  const focusables = getFocusableElements(container)
  if (focusables.length > 0) {
    focusables[focusables.length - 1].focus()
  }
}

/**
 * Trap focus within a container (circular navigation)
 * Returns cleanup function
 */
export function trapFocus(
  container: HTMLElement,
  options: { returnFocusOnExit?: boolean } = {}
): () => void {
  const previousActiveElement = document.activeElement as HTMLElement

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    const focusables = getFocusableElements(container)
    if (focusables.length === 0) return

    const firstElement = focusables[0]
    const lastElement = focusables[focusables.length - 1]
    const activeElement = document.activeElement

    // Shift+Tab at beginning: focus last
    if (e.shiftKey && activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
      return
    }

    // Tab at end: focus first
    if (!e.shiftKey && activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
      return
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  const cleanup = () => {
    container.removeEventListener('keydown', handleKeyDown)
    if (options.returnFocusOnExit && previousActiveElement) {
      previousActiveElement.focus()
    }
  }

  return cleanup
}

/**
 * Lock body scroll when modal is open
 * Returns cleanup function
 */
export function lockBodyScroll(): () => void {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  document.body.style.overflow = 'hidden'
  document.body.style.paddingRight = `${scrollbarWidth}px`

  return () => {
    document.body.style.overflow = 'unset'
    document.body.style.paddingRight = '0'
  }
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcer = document.createElement('div')
  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', priority)
  announcer.setAttribute('aria-atomic', 'true')
  announcer.className = 'sr-only'
  announcer.textContent = message

  document.body.appendChild(announcer)

  // Remove after announcement
  setTimeout(() => {
    announcer.remove()
  }, 1000)
}

/**
 * Ensure sr-only CSS class exists in document
 */
export function ensureScreenReaderStyles(): void {
  if (document.getElementById('sr-only-styles')) return

  const style = document.createElement('style')
  style.id = 'sr-only-styles'
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `
  document.head.appendChild(style)
}

// Ensure sr-only styles are available
ensureScreenReaderStyles()
