
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getQhseDashboardStats } from '../../lib/api'
import MetricCard from '../../components/shared/UI/MetricCard'
import Card from '../../components/shared/UI/Card'
import { useResponsive } from '../../hooks/useResponsive'
import { ShieldCheck, FileWarning, ClipboardList, Gauge, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Dashboard() {
  const { isMobile } = useResponsive()

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['qhse-dashboard-stats'],
    queryFn: getQhseDashboardStats,
    refetchInterval: 10000,
  })

  const metrics = dashboardData?.metrics
  const monthlyStats = dashboardData?.monthlyStats ?? []
  const recentActions = dashboardData?.recentActions ?? []

  const stats = useMemo(() => [
    {
      title: 'Assigned Sites',
      value: isLoading ? '...' : metrics?.assignedSitesCount.toString() ?? '0',
      description: 'Active monitoring',
      icon: ShieldCheck,
      color: '#075B7A',
      bgColor: '#CAEDF1',
    },
    {
      title: 'Pending Reports',
      value: isLoading ? '...' : metrics?.pendingReportsCount.toString() ?? '0',
      description: 'Need review',
      icon: FileWarning,
      color: '#f59e42',
      bgColor: '#fffbeb',
    },
    {
      title: 'Open Actions',
      value: isLoading ? '...' : metrics?.openActionsCount.toString() ?? '0',
      description: 'Pending correction',
      icon: ClipboardList,
      color: '#ef4444',
      bgColor: '#fef2f2',
    },
    {
      title: 'Compliance Score',
      value: isLoading ? '...' : (metrics?.complianceAverage?.toString() ?? '0') + '%',
      description: 'Average safety score',
      icon: Gauge,
      color: '#22c55e',
      bgColor: '#dcfce7',
    },
  ], [isLoading, metrics])

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>Failed to load dashboard data</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} data-tour="qhse-page-dashboard">
      {/* Page Header */}
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#075B7A', margin: 0, fontFamily: 'Poppins, sans-serif' }}>QHSE Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Real-time safety and quality monitoring overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px'
        }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <MetricCard
              key={index}
              title={stat.title}
              value={stat.value}
              color={stat.color}
              subtitle={stat.description}
              icon={
                <div
                  style={{
                    backgroundColor: stat.bgColor,
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                  }}
                >
                  <Icon style={{ height: '20px', width: '20px', color: stat.color }} />
                </div>
              }
            />
          )
        })}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 8 }}>
        {/* Reports Submission Trend */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', flex: 2, minWidth: 400, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#334155' }}>Reports Submitted (Last 6 Months)</div>
            <Activity size={18} color="#64748b" />
          </div>
          {isLoading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading trends...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#148ABB" 
                  strokeWidth={3} 
                  dot={{ fill: '#148ABB', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Corrective Actions */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', flex: 1, minWidth: 300, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, color: '#334155' }}>Recent Corrective Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentActions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No recent actions</div>
            ) : (
              recentActions.map((action: any) => (
                <div key={action.id} style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', position: 'relative' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>{action.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      backgroundColor: action.status === 'DONE' ? '#dcfce7' : '#fef2f2',
                      color: action.status === 'DONE' ? '#16a34a' : '#ef4444',
                      fontWeight: 700
                    }}>
                      {action.status}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Due: {new Date(action.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Access Card */}
      <Card style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '10px' }}>
            <ClipboardList size={20} color="#148ABB" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#075B7A' }}>Quick Actions</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Common tasks for QHSE Manager</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
          <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
             <div style={{ backgroundColor: '#fffbeb', padding: '6px', borderRadius: '6px' }}>
               <FileWarning size={18} color="#f59e42" />
             </div>
             <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Review Site Reports</span>
          </div>
          <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
             <div style={{ backgroundColor: '#dcfce7', padding: '6px', borderRadius: '6px' }}>
               <Gauge size={18} color="#22c55e" />
             </div>
             <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>Global Safety Analysis</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
