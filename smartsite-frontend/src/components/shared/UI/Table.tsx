import type { ComponentType } from 'react'
import Button from './Button'

interface Column<T> {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T) => React.ReactNode
}

interface Action<T> {
  label: string
  icon?: ComponentType<{ style?: React.CSSProperties }>
  onClick: (item: T) => void
  variant?: 'primary' | 'danger' | 'secondary'
  shouldShow?: (item: T) => boolean
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  actions?: Action<T>[]
  onRowClick?: (item: T) => void
  getRowKey: (item: T) => string | number
}

export default function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  actions = [],
  onRowClick,
  getRowKey
}: TableProps<T>) {
  // Defensive: ensure data is always an array
  const safeData = Array.isArray(data) ? data : []

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        Loading...
      </div>
    )
  }

  if (safeData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: '12px',
                  textAlign: column.align || 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: column.width
                }}
              >
                {column.label}
              </th>
            ))}
            {actions.length > 0 && (
              <th
                style={{
                  padding: '12px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {safeData.map((item) => {
            const rowKey = getRowKey(item)
            const visibleActions = actions.filter((action) => action.shouldShow?.(item) ?? true)
            return (
              <tr
                key={rowKey}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.15s'
                }}
                onClick={() => onRowClick?.(item)}
                onMouseEnter={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: '16px 12px',
                      fontSize: '14px',
                      color: '#1a1a1a',
                      textAlign: column.align || 'left'
                    }}
                  >
                    {column.render
                      ? column.render(item)
                      : String((item as any)[column.key] ?? '')}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td
                    style={{
                      padding: '16px 12px',
                      textAlign: 'right'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {visibleActions.map((action, index) => {
                        const Icon = action.icon
                        return (
                          <Button
                            key={index}
                            onClick={() => action.onClick(item)}
                            variant={action.variant ?? 'primary'}
                            size="small"
                            icon={Icon}
                          >
                            {action.label}
                          </Button>
                        )
                      })}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
