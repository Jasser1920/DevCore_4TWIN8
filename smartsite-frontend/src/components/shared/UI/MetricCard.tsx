import type { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  color: string
  icon?: ReactNode
  subtitle?: string
  onClick?: () => void
}

export default function MetricCard({ 
  title, 
  value, 
  color, 
  icon, 
  subtitle,
  onClick 
}: MetricCardProps) {
  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderTop: `4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '8px',
            fontWeight: '500',
            margin: '0 0 8px 0'
          }}>
            {title}
          </p>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1a1a1a',
            margin: 0,
            lineHeight: '1'
          }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              marginTop: '8px',
              margin: '8px 0 0 0'
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div style={{ 
            fontSize: '32px',
            marginLeft: '12px',
            opacity: 0.8
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
