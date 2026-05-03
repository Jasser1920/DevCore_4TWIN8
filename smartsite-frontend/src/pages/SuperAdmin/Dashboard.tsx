 
import {  useQuery } from '@tanstack/react-query'
import {  useMemo } from 'react'
import { apiFetch } from '../../lib/api'
import { exportUsersToPDF } from '../../lib/pdfExport'
import MetricCard from '../../components/shared/UI/MetricCard'
import Card from '../../components/shared/UI/Card'
import { useResponsive } from '../../hooks/useResponsive'
import { Button } from '../../components/shared/UI'
import { Activity, TrendingUp, Users, Building2, Database, Download } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
 

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  isEmailVerified: boolean
}

function formatStorage(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}



export default function Dashboard() {
  const { isMobile } = useResponsive()

  // Fetch users
  const {
    data: usersData,
    isLoading: usersLoading,
    
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<{ users: User[] }>('/users/list'),
    refetchInterval: 5000,
  })
   // Fetch revenue by month
  const {
    data: revenueByMonth,
    isLoading: revenueLoading,
    error: revenueError,
  } = useQuery({
    queryKey: ['revenue-by-month'],
    queryFn: () => apiFetch<{ label: string; value: number }[]>('/projects/revenue-by-month'),
    refetchInterval: 5000,
  })

  // Fetch companies
  const {
    data: companiesData,
    isLoading: companiesLoading,
  } = useQuery({
    queryKey: ['companies'],
    queryFn: () => apiFetch<{ data: any[] }>('/companies'),
    refetchInterval: 5000,
  })


  // Fetch recent activity log
  const {
    data: activityData,
    isLoading: activityLoading,
    error: activityError,
  } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => apiFetch<{ logs: any[] }>('/activity-logs/recent'),
    refetchInterval: 5000,
  })
  
 // Fetch API usage stats (last 60 minutes)
  const {
    data: apiUsageData,
    isLoading: apiUsageLoading,
    error: apiUsageError,
  } = useQuery({
    queryKey: ['api-usage'],
    queryFn: () => apiFetch<{ timestamp: number; count: number }[]>('/projects/api-usage?minutes=60'),
    refetchInterval: 5000,
  })

  // Fetch projects count
  const {
    data: projectsData,
    isLoading: projectsLoading,
  } = useQuery({
    queryKey: ['projects-count'],
    queryFn: () => apiFetch<{ count: number }>('/projects'),
    refetchInterval: 5000,
  })

  // Fetch growth
  const {
    data: growthData,
    isLoading: growthLoading,
  } = useQuery({
    queryKey: ['growth'],
    queryFn: () => apiFetch<{ growth: number }>('/projects/growth'),
    refetchInterval: 5000,
  })

  // Fetch storage usage
  const {
    data: storageData,
    isLoading: storageLoading,
  } = useQuery({
    queryKey: ['storage-usage'],
    queryFn: () => apiFetch<{ used: number; total: number }>('/projects/storage-usage'),
    refetchInterval: 5000,
  })

  // Users, companies, projects count
  const usersCount = usersData?.users?.length ?? 0
  const companiesCount = companiesData?.data?.length ?? 0
  const projectsCount = projectsData?.count ?? 0
  const users = usersData?.users ?? []



  const stats = useMemo(() => [
    {
      title: 'Total Users',
      value: usersLoading ? '...' : usersCount.toString(),
      description: 'Active accounts',
      icon: Users,
      color: '#075B7A',
      bgColor: '#CAEDF1',
    },
    {
      title: 'Active Projects',
      value: projectsLoading ? '...' : projectsCount.toString(),
      description: 'In progress',
      icon: Activity,
      color: '#148ABB',
      bgColor: '#CAEDF1',
    },
    {
      title: 'Companies',
      value: companiesLoading ? '...' : companiesCount.toString(),
      description: 'Total tenants',
      icon: Building2,
      color: '#075B72',
      bgColor: '#CAEDF1',
    },
    {
      title: 'Growth',
      value: growthLoading ? '...' : (growthData?.growth?.toString() ?? 'N/A') + '%',
      description: 'Monthly growth',
      icon: TrendingUp,
      color: '#22c55e',
      bgColor: '#dcfce7',
    },
    {
      title: 'Storage Usage',
      value: storageLoading
        ? '...'
        : storageData
          ? `${formatStorage(storageData.used)} / ${formatStorage(storageData.total)}`
          : 'N/A',
      description: 'Total/Used',
      icon: Database,
      color: '#6366f1',
      bgColor: '#ede9fe',
    },
  ], [usersLoading, usersCount, companiesLoading, companiesCount, projectsLoading, projectsCount, growthLoading, growthData, storageLoading, storageData])

  // Recent activity log from API
  const recentActivity = activityData?.logs ?? []

  return (

    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
        {/* API Usage Chart */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', flex: 2, minWidth: 400, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>API Usage (last 60 min)</div>
          {apiUsageLoading && <div>Loading...</div>}
          {apiUsageError && <div style={{ color: 'red' }}>Failed to load API usage</div>}
          {apiUsageData && (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={apiUsageData.map(d => ({
                ...d,
                // Format timestamp as HH:mm
                time: d.timestamp.toString().slice(-4, -2) + ':' + d.timestamp.toString().slice(-2)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#148ABB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Revenue by Month Chart */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', flex: 1, minWidth: 300, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Revenue by Month</div>
          {revenueLoading && <div>Loading...</div>}
          {revenueError && <div style={{ color: 'red' }}>Failed to load revenue data</div>}
          {revenueByMonth && (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity Log */}
      <Card style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Recent Activity Log</h3>
        {activityLoading && <div>Loading...</div>}
        {activityError && <div style={{ color: 'red' }}>Failed to load activity log</div>}
        <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {recentActivity.map((item: any, idx: number) => (
            <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><b>{item.action || item.type || item.event}</b> by <span style={{ color: '#148ABB' }}>{item.user || item.actor || item.username}</span></span>
              <span style={{ color: '#64748b', fontSize: 13 }}>{item.date || item.timestamp || item.createdAt}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Export Users Card */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h3 style={{ marginBottom: 12 }}>Export Users</h3>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>
          Download the current list of users as a PDF document.
        </p>
        <Button
          onClick={() => exportUsersToPDF(users)}
          disabled={users.length === 0}
          icon={Download}
          style={{
            padding: '10px 20px'
          }}
        >
          Export All Users to PDF
        </Button>
      </div>

    </div>
  )
}
