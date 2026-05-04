import { Check, X, Clock, AlertCircle } from 'lucide-react'

export type StatusType = 'success' | 'error' | 'pending' | 'warning' | 'info'

interface StatusProps {
  type: StatusType
  label: string
  size?: 'small' | 'medium' | 'large'
  icon?: boolean
  className?: string
}

const statusConfig = {
  success: {
    className: 'app-status--success',
    icon: Check,
    bgColor: '#10b981'
  },
  error: {
    className: 'app-status--error',
    icon: X,
    bgColor: '#dc2626'
  },
  pending: {
    className: 'app-status--pending',
    icon: Clock,
    bgColor: '#f59e0b'
  },
  warning: {
    className: 'app-status--warning',
    icon: AlertCircle,
    bgColor: '#f97316'
  },
  info: {
    className: 'app-status--info',
    icon: AlertCircle,
    bgColor: '#3b82f6'
  }
}

export default function Status({
  type,
  label,
  size = 'medium',
  icon = true,
  className
}: StatusProps) {
  const config = statusConfig[type]
  const Icon = config.icon
  
  const iconSize = size === 'small' ? '12px' : size === 'large' ? '16px' : '14px'

  return (
    <span
      className={`app-status app-status--${size} ${config.className}${className ? ` ${className}` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}
    >
      {icon && Icon && (
        <Icon style={{ height: iconSize, width: iconSize, flexShrink: 0 }} />
      )}
      <span>{label}</span>
    </span>
  )
}
