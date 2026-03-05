import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '../../lib/api'
import { exportUsersToPDF } from '../../lib/pdfExport'
import MetricCard from '../../components/shared/UI/MetricCard'
import { useResponsive } from '../../hooks/useResponsive'
import { Button } from '../../components/shared/UI'
import { Activity, TrendingUp, Users, Building2, Download, Play } from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  isEmailVerified: boolean
}

interface DashboardProps {
  usersCount: number
  companiesCount: number
  users?: User[]
}

export default function Dashboard({ usersCount, companiesCount, users = [] }: DashboardProps) {
  const { isMobile } = useResponsive()
  const [profileMessage, setProfileMessage] = useState('')

  const meMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ message: string; user: unknown }>('/users/me', {
        method: 'GET',
      })
    },
    onSuccess: (data) => {
      setProfileMessage(JSON.stringify(data, null, 2))
    },
    onError: (error: Error) => {
      setProfileMessage(error.message)
    },
  })

  const stats = [
    {
      title: 'Total Users',
      value: usersCount.toString(),
      description: 'Active accounts',
      icon: Users,
      color: '#075B7A',
      bgColor: '#CAEDF1',
    },
    {
      title: 'Active Projects',
      value: '12',
      description: 'In progress',
      icon: Activity,
      color: '#148ABB',
      bgColor: '#CAEDF1',
    },
    {
      title: 'Companies',
      value: companiesCount.toString(),
      description: 'Total tenants',
      icon: Building2,
      color: '#075B72',
      bgColor: '#CAEDF1',
    },
    {
      title: 'Growth',
      value: '+23%',
      description: 'This month',
      icon: TrendingUp,
      color: '#22c55e',
      bgColor: '#dcfce7',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px'
        }}
      >
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
                    display: 'inline-flex'
                  }}
                >
                  <Icon style={{ height: '20px', width: '20px', color: stat.color }} />
                </div>
              }
            />
          )
        })}
      </div>

      {/* Export Users Card */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: '0 0 8px 0',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          Export User Data
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 16px 0'
          }}
        >
          Generate a PDF report with all user details
        </p>
        <Button
          onClick={() => exportUsersToPDF(users)}
          disabled={users.length === 0}
          icon={Download}
          title={users.length === 0 ? 'No users to export' : 'Export all users to PDF'}
          style={{
            padding: '10px 20px'
          }}
        >
          Export All Users to PDF
        </Button>
      </div>

      {/* Test Endpoint Card */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '32px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: '0 0 8px 0',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          Test Endpoints
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 16px 0'
          }}
        >
          Verify your access token with protected endpoints
        </p>
        <Button
          onClick={() => meMutation.mutate()}
          variant="text"
          icon={Play}
          style={{
            padding: '10px 20px'
          }}
        >
          Call /users/me
        </Button>
        {profileMessage && (
          <pre
            style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#1f2937',
              color: '#10b981',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px'
            }}
          >
            {profileMessage}
          </pre>
        )}
      </div>
    </div>
  )
}
