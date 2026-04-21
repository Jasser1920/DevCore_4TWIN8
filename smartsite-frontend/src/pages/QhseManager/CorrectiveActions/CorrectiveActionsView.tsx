import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { getQhseReportQueue, updateQhseCorrectiveAction } from '../../../lib/api'

const priorityColors: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e42',
  LOW: '#6b7280',
}

const statusColors: Record<string, string> = {
  OPEN: '#d97706',
  IN_PROGRESS: '#0ea5e9',
  DONE: '#16a34a',
  BLOCKED: '#ef4444',
}

function ActionDetailModal({ action, onClose, onAction }: { action: any; onClose: () => void; onAction: (act: string) => void }) {
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
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>{action.title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, marginBottom: 20 }}>
          <div><span style={{ color: '#64748b' }}>Priority:</span> <span style={{ color: priorityColors[action.priority] }}>{action.priority}</span></div>
          <div><span style={{ color: '#64748b' }}>Status:</span> <span style={{ color: statusColors[action.status] }}>{action.status}</span></div>
          <div><span style={{ color: '#64748b' }}>Owner:</span> {action.owner || '-'}</div>
          <div><span style={{ color: '#64748b' }}>Due Date:</span> {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : '-'}</div>
          <div><span style={{ color: '#64748b' }}>Escalated:</span> {action.escalated ? 'Yes' : 'No'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onAction('mark-complete')}
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
            Mark Complete
          </button>
          <button
            onClick={() => onAction('extend-deadline')}
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
            Extend Deadline
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

export default function CorrectiveActionsView() {
  const [selectedAction, setSelectedAction] = useState<any>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['qhse-reports-queue'],
    queryFn: getQhseReportQueue,
    refetchInterval: 10000,
  })

  const actionMutation = useMutation({
    mutationFn: (payload: any) => {
      const statusMap: Record<string, any> = {
        'mark-complete': 'DONE',
        'extend-deadline': 'IN_PROGRESS',
      }
      return updateQhseCorrectiveAction(payload.actionId, { status: statusMap[payload.action] })
    },
    onSuccess: () => {
      setSelectedAction(null)
      refetch()
    },
  })

  const reports: any[] = Array.isArray(data) ? data : []
  const actions = reports.flatMap((r: any) => r.actions || [])

  const handleAction = (act: string) => {
    if (selectedAction) {
      actionMutation.mutate({ actionId: selectedAction.id, action: act })
    }
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Corrective Actions</div>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#334155', background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Action</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Priority</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Due Date</th>
                <th style={{ textAlign: 'center', padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action, idx) => (
                <tr key={action.id ?? idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 8 }}>{action.title}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: priorityColors[action.priority] || '#e2e8f0',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 12,
                    }}>
                      {action.priority}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: statusColors[action.status] || '#e2e8f0',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 12,
                    }}>
                      {action.status}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>{action.dueDate ? new Date(action.dueDate).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedAction(action)}
                      style={{
                        padding: '4px 12px',
                        background: '#0ea5e9',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {actions.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>No corrective actions.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {selectedAction && <ActionDetailModal action={selectedAction} onClose={() => setSelectedAction(null)} onAction={handleAction} />}
    </>
  )
}
