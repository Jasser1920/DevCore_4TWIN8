import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getQhseAssignedSites } from '../../../lib/api'

const statusColors: Record<string, string> = {
  ACTIVE: '#16a34a',
  INACTIVE: '#6b7280',
  PENDING: '#d97706',
  COMPLETED: '#0ea5e9',
  APPROVED: '#0ea5e9',
  DRAFT: '#94a3b8',
}

function SiteDetailModal({ site, onClose }: { site: any; onClose: () => void }) {
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
        maxWidth: 500,
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>{site.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
          <div><span style={{ color: '#64748b' }}>Code:</span> {site.code}</div>
          <div><span style={{ color: '#64748b' }}>Status:</span> <span style={{ color: statusColors[site.status] || '#000' }}>{site.status}</span></div>
          <div><span style={{ color: '#64748b' }}>Address:</span> {site.siteAddress || '-'}</div>
          <div><span style={{ color: '#64748b' }}>Budget Planned:</span> {site.budgetPlanned || '-'}</div>
          <div><span style={{ color: '#64748b' }}>Start Date:</span> {site.startDate ? new Date(site.startDate).toLocaleDateString() : '-'}</div>
          <div><span style={{ color: '#64748b' }}>End Date:</span> {site.endDate ? new Date(site.endDate).toLocaleDateString() : '-'}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 24,
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

export default function AssignedSitesView() {
  const [selectedSite, setSelectedSite] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['qhse-assigned-sites'],
    queryFn: getQhseAssignedSites,
    refetchInterval: 10000,
  })

  const sites: any[] = Array.isArray(data) ? data : []
  const filtered = sites.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.code?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Assigned Sites</div>
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: 16,
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#334155', background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Code</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Budget</th>
                <th style={{ textAlign: 'center', padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((site, idx) => (
                <tr key={site.id ?? idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 8 }}>{site.name}</td>
                  <td style={{ padding: 8 }}>{site.code}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: statusColors[site.status] || '#e2e8f0',
                      color: '#fff',
                      borderRadius: 4,
                      fontSize: 12,
                    }}>
                      {site.status}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>{site.budgetPlanned || '-'}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedSite(site)}
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
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>No sites found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {selectedSite && <SiteDetailModal site={selectedSite} onClose={() => setSelectedSite(null)} />}
    </>
  )
}
