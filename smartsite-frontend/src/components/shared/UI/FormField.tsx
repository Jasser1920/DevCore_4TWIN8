interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'select' | 'textarea'
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  helpText?: string
  placeholder?: string
  options?: { value: string; label: string; disabled?: boolean }[]
  disabled?: boolean
  rows?: number
  ariaLabel?: string
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  helpText,
  placeholder,
  options = [],
  disabled = false,
  rows = 4,
  ariaLabel
}: FormFieldProps) {
  const inputId = `field-${name}`
  const errorId = `error-${name}`
  const helpId = `help-${name}`
  const descriptionIds = [error && errorId, !error && helpText && helpId].filter(Boolean).join(' ')
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    backgroundColor: disabled ? '#f3f4f6' : '#f9fafb',
    border: `1px solid ${error ? '#dc2626' : '#e5e7eb'}`,
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'text'
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!error) {
      e.target.style.borderColor = '#148ABB'
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!error) {
      e.target.style.borderColor = '#e5e7eb'
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <label
        htmlFor={inputId}
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }}
      >
        {label}
        {required && (
          <span style={{ color: '#dc2626', marginLeft: '4px' }} aria-label="required">
            *
          </span>
        )}
      </label>

      {type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-invalid={!!error}
          aria-describedby={descriptionIds || undefined}
          style={{
            ...inputStyle,
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          aria-label={ariaLabel || label}
          aria-invalid={!!error}
          aria-describedby={descriptionIds || undefined}
          style={{
            ...inputStyle,
            resize: 'vertical',
            minHeight: '80px'
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel || label}
          aria-invalid={!!error}
          aria-describedby={descriptionIds || undefined}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}

      {error && (
        <p
          id={errorId}
          style={{
            fontSize: '12px',
            color: '#dc2626',
            marginTop: '6px',
            marginBottom: 0
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      {helpText && !error && (
        <p
          id={helpId}
          style={{
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '6px',
            marginBottom: 0
          }}
        >
          {helpText}
        </p>
      )}
    </div>
  )
}
