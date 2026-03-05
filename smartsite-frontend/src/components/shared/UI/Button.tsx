import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'text'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  icon?: ComponentType<{ style?: React.CSSProperties; className?: string }> | LucideIcon
  children: React.ReactNode
  fullWidth?: boolean
  ariaLabel?: string
}

export default function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  type = 'button',
  children,
  fullWidth = false,
  style,
  className,
  title,
  ariaLabel,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  const iconSize = size === 'small' ? '14px' : size === 'large' ? '18px' : '16px'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      aria-label={ariaLabel}
      className={`app-button app-button--${variant} app-button--${size}${fullWidth ? ' app-button--full' : ''}${className ? ` ${className}` : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style
      }}
      {...rest}
    >
      {Icon && <Icon style={{ height: iconSize, width: iconSize, flexShrink: 0 }} />}
      <span>{loading ? 'Loading...' : children}</span>
    </button>
  )
}
