import { useEffect, useState } from 'react'

type ResponsiveState = {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
}

const getResponsiveState = (): ResponsiveState => {
  if (typeof window === 'undefined') {
    return { 
      isMobile: false, 
      isTablet: false,
      isDesktop: true,
      width: 1024
    }
  }

  const width = window.innerWidth

  return {
    isMobile: width <= 640,
    isTablet: width <= 1024 && width > 640,
    isDesktop: width > 1024,
    width
  }
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(getResponsiveState)

  useEffect(() => {
    const handleResize = () => {
      setState(getResponsiveState())
    }

    window.addEventListener('resize', handleResize)
    // Also handle orientation change on mobile
    window.addEventListener('orientationchange', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return state
}
