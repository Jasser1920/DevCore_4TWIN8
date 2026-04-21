import { useQuery } from '@tanstack/react-query'
import { getQhseAssignedSites, getQhseReportQueue } from '../../lib/api'

export default function Dashboard() {
  const { data: sitesData, isLoading: sitesLoading } = useQuery({
    queryKey: ['qhse-assigned-sites'],
    queryFn: getQhseAssignedSites,
    refetchInterval: 10000,
  })

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['qhse-reports-queue'],
    queryFn: getQhseReportQueue,
    refetchInterval: 10000,
  })

  const sites = Array.isArray(sitesData) ? sitesData : []
  const reports = Array.isArray(reportsData) ? reportsData : []
  const actions = reports.flatMap((r: any) => r.actions || [])
  const escalations = actions.filter((a: any) => a.escalated)

  const stats = [
    { label: 'Assigned Sites', value: sites.length, loading: sitesLoading, color: '#0ea5e9' },
    { label: 'Pending Reports', value: reports.length, loading: reportsLoading, color: '#f59e42' },
    { label: 'Corrective Actions', value: actions.length, loading: reportsLoading, color: '#6366f1' },
    { label: 'Escalations', value: escalations.length, loading: reportsLoading, color: '#ef4444' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              flex: 1,
              minWidth: 180,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: '#334155' }}>{stat.label}</div>
            <div style={{ fontSize: 48, fontWeight: 700, color: stat.color }}>
              {stat.loading ? '...' : stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
