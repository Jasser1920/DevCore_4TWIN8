interface AlertMessageProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onDismiss?: () => void
}

const alertStyles = {
  success: {
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
    color: '#065f46',
  },
  error: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    color: '#dc2626',
  },
  warning: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    color: '#92400e',
  },
  info: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
    color: '#1e40af',
  },
}

export default function AlertMessage({ type, message, onDismiss }: AlertMessageProps) {
  const style = alertStyles[type]

  return (
    <div
      style={{
        padding: '12px 16px',
        marginBottom: '16px',
        backgroundColor: style.backgroundColor,
        border: `1px solid ${style.borderColor}`,
        borderRadius: '8px',
        color: style.color,
        fontSize: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: style.color,
            fontSize: '18px',
            fontWeight: 'bold',
            padding: '0 0 0 12px',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
