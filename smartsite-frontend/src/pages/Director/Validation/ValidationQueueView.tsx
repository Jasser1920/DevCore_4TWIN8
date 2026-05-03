import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDirectorValidationQueue, validateProject, type ProjectItem } from '../../../lib/api'
import { useResponsive } from '../../../hooks/useResponsive'
import ProtectedProjectImage from '../../../components/shared/ProtectedProjectImage'

type DecisionState = {
  project: ProjectItem
  decision: 'APPROVE' | 'REJECT'
}

export default function ValidationQueueView() {
  const queryClient = useQueryClient()
  const { isMobile } = useResponsive()
  const [decisionState, setDecisionState] = useState<DecisionState | null>(null)
  const [comment, setComment] = useState('')

  const queueQuery = useQuery({
    queryKey: ['director-validation-queue'],
    queryFn: getDirectorValidationQueue,
  })

  const validationMutation = useMutation({
    mutationFn: async () => {
      if (!decisionState) return
      return validateProject(decisionState.project.id, {
        decision: decisionState.decision,
        comment: comment.trim() || undefined,
      })
    },
    onSuccess: () => {
      setDecisionState(null)
      setComment('')
      queryClient.invalidateQueries({ queryKey: ['director-validation-queue'] })
    },
  })

  const projects = queueQuery.data || []

  const totalBudget = useMemo(
    () => projects.reduce((sum, project) => sum + Number(project.budgetPlanned || 0), 0),
    [projects],
  )

  const canConfirm =
    !!decisionState &&
    (decisionState.decision === 'APPROVE' || comment.trim().length > 0) &&
    !validationMutation.isPending

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: isMobile ? '16px' : '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }} data-tour="dir-validation-summary">
        <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>Validation Queue</h2>
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
          Submitted projects waiting for your decision.
        </p>
        <div style={{ marginTop: '12px', color: '#075B7A', fontSize: '14px' }}>
          <strong>{projects.length}</strong> pending | total budget <strong>${totalBudget.toLocaleString()}</strong>
        </div>
      </div>

      {queueQuery.isLoading && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px' }}>Loading queue...</div>
      )}

      {queueQuery.isError && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '12px', padding: '20px' }}>
          {(queueQuery.error as Error).message || 'Failed to load validation queue'}
        </div>
      )}

      {!queueQuery.isLoading && !queueQuery.isError && projects.length === 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', color: '#6b7280' }}>
          No submitted projects are waiting for validation.
        </div>
      )}

      {!queueQuery.isLoading && !queueQuery.isError && projects.length > 0 && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {projects.map((project, index) => (
            <div
              key={project.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: isMobile ? '14px' : '18px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{project.name}</div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                    {project.code} | {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ color: '#075B7A', fontSize: '13px', fontWeight: 500 }}>
                  ${Number(project.budgetPlanned).toLocaleString()} planned
                </div>
              </div>

              {project.description && (
                <p style={{ margin: '10px 0', fontSize: '14px', color: '#4b5563' }}>{project.description}</p>
              )}

              {project.prototypeImageUrl && (
                <ProtectedProjectImage
                  attachmentUrl={project.prototypeImageUrl}
                  alt={`${project.name} prototype`}
                  style={{
                    width: '100%',
                    maxWidth: '420px',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    marginTop: '10px',
                  }}
                />
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button
                  data-tour={index === 0 ? 'dir-validation-approve' : undefined}
                  onClick={() => {
                    setDecisionState({ project, decision: 'APPROVE' })
                    setComment('')
                  }}
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 14px',
                    backgroundColor: '#065f46',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Approve
                </button>
                <button
                  data-tour={index === 0 ? 'dir-validation-reject' : undefined}
                  onClick={() => {
                    setDecisionState({ project, decision: 'REJECT' })
                    setComment('')
                  }}
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 14px',
                    backgroundColor: '#b91c1c',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {decisionState && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '12px',
        }} onClick={() => setDecisionState(null)}>
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '8px' }}>
              {decisionState.decision === 'APPROVE' ? 'Approve' : 'Reject'} {decisionState.project.name}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: 0 }}>
              {decisionState.decision === 'APPROVE'
                ? 'You can optionally add decision notes.'
                : 'Rejection comment is required.'}
            </p>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={decisionState.decision === 'REJECT' ? 'Write rejection reason' : 'Optional decision note'}
              style={{
                width: '100%',
                minHeight: '110px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '10px',
                resize: 'vertical',
              }}
            />

            {validationMutation.isError && (
              <p style={{ color: '#b91c1c', marginTop: '8px', marginBottom: 0 }}>
                {(validationMutation.error as Error).message || 'Failed to save decision'}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => setDecisionState(null)}
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  padding: '9px 14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => validationMutation.mutate()}
                disabled={!canConfirm}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#075B7A',
                  color: 'white',
                  padding: '9px 14px',
                  cursor: canConfirm ? 'pointer' : 'not-allowed',
                  opacity: canConfirm ? 1 : 0.6,
                  fontWeight: 600,
                }}
              >
                {validationMutation.isPending ? 'Saving...' : 'Confirm decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
