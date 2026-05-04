import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { resolveApiUrl } from '../../lib/api'
import { getAccessToken, getRefreshToken, isTokenExpiringSoon, refreshAccessToken } from '../../lib/auth'

type ProtectedProjectImageProps = {
  attachmentUrl: string
  alt: string
  style?: CSSProperties
  fallbackStyle?: CSSProperties
}

export default function ProtectedProjectImage({
  attachmentUrl,
  alt,
  style,
  fallbackStyle,
}: ProtectedProjectImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    let objectUrl = ''

    async function loadImage() {
      setResolvedSrc('')
      setLoadError('')

      let token = getAccessToken()
      if (!token) {
        setLoadError('Missing access token')
        return
      }

      if (isTokenExpiringSoon(token) && getRefreshToken()) {
        const refreshedToken = await refreshAccessToken()
        if (refreshedToken) token = refreshedToken
      }

      try {
        let response = await fetch(resolveApiUrl(attachmentUrl), {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.status === 401 && getRefreshToken()) {
          const refreshedToken = await refreshAccessToken()
          if (refreshedToken) {
            token = refreshedToken
            response = await fetch(resolveApiUrl(attachmentUrl), {
              headers: { Authorization: `Bearer ${token}` },
            })
          }
        }

        if (!response.ok) {
          throw new Error('Image request failed')
        }

        const imageBlob = await response.blob()
        objectUrl = URL.createObjectURL(imageBlob)
        if (!cancelled) {
          setResolvedSrc(objectUrl)
        }
      } catch {
        if (!cancelled) {
          setLoadError('Unable to load image')
        }
      }
    }

    loadImage()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachmentUrl])

  if (resolvedSrc) {
    return <img src={resolvedSrc} alt={alt} style={style} />
  }

  return (
    <div
      style={{
        ...style,
        ...fallbackStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: loadError ? '#b91c1c' : '#64748b',
        background: '#f8fafc',
        minHeight: style?.height || 96,
      }}
    >
      {loadError || 'Loading image...'}
    </div>
  )
}
