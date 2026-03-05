import type { ReactNode } from 'react'

interface StatRow {
  label: string
  value: string | number
  valueColor?: string
  valueStyle?: 'success' | 'warning' | 'danger'
}

interface DetailedMetricCardProps {
  icon: ReactNode
  iconBgColor: string
  title: string
  stats: StatRow[]
}

export default function DetailedMetricCard({ 
  icon, 
  iconBgColor, 
  title, 
  stats 
}: DetailedMetricCardProps) {
  const getValueColor = (stat: StatRow): string => {
    if (stat.valueColor) return stat.valueColor
    
    switch (stat.valueStyle) {
      case 'success':
        return '#059669'
      case 'warning':
        return '#d97706'
      case 'danger':
        return '#dc2626'
      default:
        return '#1a1a1a'
    }
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          backgroundColor: iconBgColor,
          padding: '10px',
          borderRadius: '8px',
          fontSize: '20px'
        }}>
          {icon}
        </div>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#6b7280',
          margin: 0
        }}>
          {title}
        </h3>
      </div>
      
      <div style={{ 
        fontSize: '13px', 
        color: '#4b5563', 
        lineHeight: '1.8' 
      }}>
        {stats.map((stat, index) => (
          <p 
            key={index}
            style={{ 
              margin: index === stats.length - 1 ? 0 : '0 0 6px 0',
              display: 'flex', 
              justifyContent: 'space-between' 
            }}
          >
            <span>{stat.label}</span>
            <strong style={{ color: getValueColor(stat) }}>
              {stat.value}
            </strong>
          </p>
        ))}
      </div>
    </div>
  )
}
