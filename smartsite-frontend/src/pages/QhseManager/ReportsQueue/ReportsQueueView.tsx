import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { getQhseReportQueue, reviewQhseReport } from '../../../lib/api'

const statusColors: Record<string, string> = {
  SUBMITTED: '#d97706',
  UNDER_REVIEW: '#0ea5e9',
  ACTION_REQUIRED: '#f59e42',
  ACCEPTED: '#16a34a',
}

function ReportDetailModal({ report, onClose, onAction }: { report: any; onClose: () => void; onAction: (action: string) => void }) {
  const [comment, setComment] = useState('')

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
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>QHSE Report</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, marginBottom: 20 }}>
          <div><span style={{ color: '#64748b' }}>Project:</span> {report.project?.name || '-'}</div>
          <div><span style={{ color: '#64748b' }}>Status:</span> <span style={{ color: statusColors[report.status] }}>{report.status}</span></div>
          <div><span style={{ color: '#64748b' }}>Submitted At:</span> {report.submittedAt ? new Date(report.submittedAt).toLocaleString() : '-'}</div>
          <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 6 }}>
            <div style={{ color: '#64748b', marginBottom: 8 }}>Summary:</div>
            <div>{report.summary || '-'}</div>
          </div>
        </div>
        <textarea
          placeholder="Add comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
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
            onClick={() => onAction('accept')}
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
            Accept
          </button>
          <button
            onClick={() => onAction('reject')}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Request Correction
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

export default function ReportsQueueView() {
  const [selectedReport, setSelectedReport] = useState<any>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['qhse-reports-queue'],
    queryFn: getQhseReportQueue,
    refetchInterval: 10000,
  })

  const actionMutation = useMutation({
    mutationFn: (payload: any) => reviewQhseReport(payload.reportId, { decision: payload.action === 'accept' ? 'ACCEPT' : 'REQUEST_CORRECTION', comment: payload.comment }),
    onSuccess: () => {
      setSelectedReport(null)
      refetch()
    },
  })

  const reports: any[] = Array.isArray(data) ? data : []

  const handleAction = (action: string) => {
    if (selectedReport) {
      actionMutation.mutate({ reportId: selectedReport.id, action })
    }
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Reports Queue</div>
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
              {reports.map((report, idx) => (
                <tr key={report.id ?? idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 8 }}>{report.project?.name || '-'}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: statusColors[report.status] || '#e2e8f0',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 12,
                    }}>
                      {report.status}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>{report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedReport(report)}
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
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>No reports in queue.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {selectedReport && <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} onAction={handleAction} />}
    </>
  )
}
