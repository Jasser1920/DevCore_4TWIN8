import { Lightbulb } from 'lucide-react'

type FloatingTutorialButtonProps = {
  onClick: () => void
  disabled?: boolean
  title?: string
}

export default function FloatingTutorialButton({
  onClick,
  disabled = false,
  title = 'Start tutorial',
}: FloatingTutorialButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '999px',
        border: '1px solid #0284c7',
        backgroundColor: '#0ea5e9',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 12px 30px rgba(2, 132, 199, 0.35)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        zIndex: 2400,
      }}
      data-tour="tutorial-floating-lamp"
    >
      <Lightbulb size={22} />
    </button>
  )
}
