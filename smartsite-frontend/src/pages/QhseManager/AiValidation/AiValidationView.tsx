import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getQhseReportQueue } from '../../../lib/api'

const verdictColors: Record<string, string> = {
  SUBMITTED: '#d97706',
  UNDER_REVIEW: '#0ea5e9',
  ACTION_REQUIRED: '#f59e42',
  ACCEPTED: '#16a34a',
}

function AiDetailModal({ item, onClose }: { item: any; onClose: () => void }) {
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
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Report Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, marginBottom: 20 }}>
          <div><span style={{ color: '#64748b' }}>Project:</span> {item.project?.name || '-'}</div>
          <div><span style={{ color: '#64748b' }}>Status:</span> <span style={{ color: verdictColors[item.status] }}>{item.status}</span></div>
          <div><span style={{ color: '#64748b' }}>Submitted At:</span> {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '-'}</div>
          <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 6 }}>
            <div style={{ color: '#64748b', marginBottom: 8 }}>Summary:</div>
            <div style={{ fontSize: 13 }}>{item.summary || 'No summary provided'}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '8px 16px',
            background: '#0f172a',
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
  )
}

export default function AiValidationView() {
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['qhse-reports-queue'],
    queryFn: getQhseReportQueue,
    refetchInterval: 15000,
  })

  const items: any[] = Array.isArray(data) ? data : []

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>AI Validation</div>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#334155', background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Project</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Submitted At</th>
                <th style={{ textAlign: 'center', padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id ?? idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 8 }}>{item.project?.name || '-'}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: verdictColors[item.status] || '#e2e8f0',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 12,
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedItem(item)}
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
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>No AI validation items.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {selectedItem && <AiDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </>
  )
}
