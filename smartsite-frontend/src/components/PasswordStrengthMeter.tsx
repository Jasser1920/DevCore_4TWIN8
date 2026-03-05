import { useMemo } from 'react'

interface PasswordStrength {
  score: number // 0-4
  label: string
  color: string
  feedback: string[]
}

interface PasswordStrengthMeterProps {
  password: string
  showFeedback?: boolean
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0
  const feedback: string[] = []

  // Length check
  if (password.length >= 8) {
    score++
  } else {
    feedback.push('At least 8 characters')
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('Include uppercase letters')
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++
  } else {
    feedback.push('Include lowercase letters')
  }

  // Number check
  if (/\d/.test(password)) {
    score++
  } else {
    feedback.push('Include numbers')
  }

  // Special character check
  if (/[@$!%*?&]/.test(password)) {
    score++
  } else {
    feedback.push('Include special characters (@$!%*?&)')
  }

  // Bonus for length
  if (password.length >= 12) {
    score = Math.min(score + 1, 5)
  }

  // Common patterns penalty
  if (/^(password|123456|qwerty)/i.test(password)) {
    score = Math.max(score - 2, 0)
    feedback.push('Avoid common patterns')
  }

  // Normalize score to 0-4
  score = Math.min(Math.max(score, 0), 4)

  const strengthLabels = [
    { label: 'Very Weak', color: '#dc2626' },
    { label: 'Weak', color: '#f97316' },
    { label: 'Fair', color: '#eab308' },
    { label: 'Strong', color: '#22c55e' },
    { label: 'Very Strong', color: '#16a34a' },
  ]

  const strength = strengthLabels[score]

  return {
    score,
    label: strength.label,
    color: strength.color,
    feedback,
  }
}

export default function PasswordStrengthMeter({ password, showFeedback = true }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password])

  if (!password) return null

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Strength bars */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '8px' 
      }}>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              backgroundColor: level <= strength.score ? strength.color : '#e5e7eb',
              transition: 'background-color 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Strength label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: '500',
          color: strength.color,
        }}>
          {strength.label}
        </span>
      </div>

      {/* Feedback */}
      {showFeedback && strength.feedback.length > 0 && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: '500',
            color: '#6b7280',
            margin: '0 0 4px 0',
          }}>
            Password should have:
          </p>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '11px',
            color: '#9ca3af',
          }}>
            {strength.feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
