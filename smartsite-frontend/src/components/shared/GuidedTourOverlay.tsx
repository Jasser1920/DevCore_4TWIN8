import { useEffect, useMemo, useState } from 'react'

type TourStep = {
  selector: string
  title: string
  description: string
}

type GuidedTourOverlayProps = {
  isOpen: boolean
  steps: TourStep[]
  onClose: () => void
}

export default function GuidedTourOverlay({ isOpen, steps, onClose }: GuidedTourOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const currentStep = steps[currentStepIndex]

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0)
      setTargetRect(null)
      return
    }

    const findTarget = () => {
      const target = document.querySelector(currentStep.selector) as HTMLElement | null
      if (!target) {
        setTargetRect(null)
        return
      }
      setTargetRect(target.getBoundingClientRect())
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    findTarget()
    window.addEventListener('resize', findTarget)
    window.addEventListener('scroll', findTarget, true)

    return () => {
      window.removeEventListener('resize', findTarget)
      window.removeEventListener('scroll', findTarget, true)
    }
  }, [isOpen, currentStep])

  const bubbleStyle = useMemo(() => {
    if (!targetRect) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const top = Math.min(window.innerHeight - 220, targetRect.bottom + 12)
    const left = Math.min(window.innerWidth - 360, Math.max(16, targetRect.left))

    return {
      position: 'fixed' as const,
      top,
      left,
      transform: 'none',
    }
  }, [targetRect])

  if (!isOpen || !currentStep) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.62)',
          zIndex: 2100,
        }}
        onClick={onClose}
      />

      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: '10px',
            border: '3px solid #38bdf8',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.52)',
            zIndex: 2200,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          ...bubbleStyle,
          zIndex: 2300,
          width: 'min(360px, calc(100vw - 32px))',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #dbeafe',
          boxShadow: '0 16px 36px rgba(2, 132, 199, 0.22)',
          padding: '14px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 700 }}>
          Step {currentStepIndex + 1} of {steps.length}
        </div>
        <h4 style={{ margin: '6px 0 6px', color: '#0f172a', fontSize: '16px' }}>{currentStep.title}</h4>
        <p style={{ margin: 0, color: '#334155', fontSize: '14px', lineHeight: 1.5 }}>{currentStep.description}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', gap: '8px' }}>
          <button
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentStepIndex === 0}
            style={{
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>

            <button
              onClick={() => {
                if (currentStepIndex >= steps.length - 1) {
                  onClose()
                } else {
                  setCurrentStepIndex((prev) => prev + 1)
                }
              }}
              style={{
                border: '1px solid #0284c7',
                background: '#0284c7',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              {currentStepIndex >= steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
