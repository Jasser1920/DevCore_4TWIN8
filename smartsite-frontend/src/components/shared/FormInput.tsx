interface FormInputProps {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

export default function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
}: FormInputProps) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px',
        }}
      >
        {label}
        {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '14px',
          backgroundColor: disabled ? '#f3f4f6' : '#f9fafb',
          border: `1px solid ${error ? '#dc2626' : '#e5e7eb'}`,
          borderRadius: '8px',
          outline: 'none',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={(e) => !disabled && (e.target.style.borderColor = '#148ABB')}
        onBlur={(e) => !disabled && (e.target.style.borderColor = error ? '#dc2626' : '#e5e7eb')}
      />
      {error && (
        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', margin: '4px 0 0 0' }}>
          {error}
        </p>
      )}
    </div>
  )
}
