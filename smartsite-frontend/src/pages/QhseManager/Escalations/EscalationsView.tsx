import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { getQhseReportQueue, updateQhseCorrectiveAction } from '../../../lib/api'

const severityColors: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e42',
  LOW: '#6b7280',
}

const statusColors: Record<string, string> = {
  OPEN: '#ef4444',
  IN_PROGRESS: '#f59e42',
  DONE: '#16a34a',
  BLOCKED: '#ef4444',
}

function EscalationDetailModal({ escalation, onClose, onAction }: { escalation: any; onClose: () => void; onAction: (act: string) => void }) {
  const [notes, setNotes] = useState('')

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        maxWidth: 600,
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>{escalation.title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, marginBottom: 20 }}>
          <div><span style={{ color: '#64748b' }}>Severity:</span> <span style={{ color: severityColors[escalation.sourceSeverity] }}>{escalation.sourceSeverity}</span></div>
          <div><span style={{ color: '#64748b' }}>Status:</span> <span style={{ color: statusColors[escalation.status] }}>{escalation.status}</span></div>
          <div><span style={{ color: '#64748b' }}>Owner:</span> {escalation.owner || '-'}</div>
          <div><span style={{ color: '#64748b' }}>Due Date:</span> {escalation.dueDate ? new Date(escalation.dueDate).toLocaleDateString() : '-'}</div>
          <div><span style={{ color: '#64748b' }}>Escalated At:</span> {escalation.escalatedAt ? new Date(escalation.escalatedAt).toLocaleString() : '-'}</div>
          <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', borderRadius: 6, borderLeft: `4px solid ${severityColors[escalation.sourceSeverity]}` }}>
            <div style={{ color: '#64748b', marginBottom: 8 }}>Escalation Reason:</div>
            <div>{escalation.escalationReason || 'No reason provided'}</div>
          </div>
        </div>
        <textarea
          placeholder="Add resolution notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: 16,
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
            minHeight: 80,
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onAction('in-progress')}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: '#f59e42',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            In Progress
          </button>
          <button
            onClick={() => onAction('resolve')}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Resolve
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: '#94a3b8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EscalationsView() {
  const [selectedEscalation, setSelectedEscalation] = useState<any>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['qhse-reports-queue'],
    queryFn: getQhseReportQueue,
    refetchInterval: 10000,
  })

  const actionMutation = useMutation({
    mutationFn: (payload: any) => {
      const statusMap: Record<string, any> = {
        'in-progress': 'IN_PROGRESS',
        'resolve': 'DONE',
      }
      return updateQhseCorrectiveAction(payload.escalationId, { status: statusMap[payload.action] })
    },
    onSuccess: () => {
      setSelectedEscalation(null)
      refetch()
    },
  })

  const reports: any[] = Array.isArray(data) ? data : []
  const escalations = reports.flatMap((r: any) => r.actions || []).filter((a: any) => a.escalated)

  const handleAction = (act: string) => {
    if (selectedEscalation) {
      actionMutation.mutate({ escalationId: selectedEscalation.id, action: act })
    }
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Escalations</div>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#334155', background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Severity</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Escalated At</th>
                <th style={{ textAlign: 'center', padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {escalations.map((esc, idx) => (
                <tr key={esc.id ?? idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 8 }}>{esc.title}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: severityColors[esc.sourceSeverity] || '#e2e8f0',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 12,
                    }}>
                      {esc.sourceSeverity}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: statusColors[esc.status] || '#e2e8f0',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 12,
                    }}>
                      {esc.status}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>{esc.escalatedAt ? new Date(esc.escalatedAt).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedEscalation(esc)}
                      style={{
                        padding: '4px 12px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Handle
                    </button>
                  </td>
                </tr>
              ))}
              {escalations.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>No escalations.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {selectedEscalation && <EscalationDetailModal escalation={selectedEscalation} onClose={() => setSelectedEscalation(null)} onAction={handleAction} />}
    </>
  )
}
