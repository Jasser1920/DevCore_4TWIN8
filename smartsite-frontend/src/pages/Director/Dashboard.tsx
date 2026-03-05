import DetailedMetricCard from '../../components/shared/UI/DetailedMetricCard'
import { useResponsive } from '../../hooks/useResponsive'

export default function Dashboard() {
  const { isMobile, isTablet } = useResponsive()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Operations Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: '24px'
      }}>
        <DetailedMetricCard
          icon="📊"
          iconBgColor="#CAEDF1"
          title="Projects Overview"
          stats={[
            { label: 'Active Projects:', value: 5 },
            { label: 'Completed:', value: 12 },
            { label: 'In Progress:', value: 5 },
            { label: 'Team Members:', value: 24 }
          ]}
        />

        <DetailedMetricCard
          icon="🛡️"
          iconBgColor="#dcfce7"
          title="Safety & QHSE"
          stats={[
            { label: 'Days Without Incident:', value: 127, valueStyle: 'success' },
            { label: 'Inspections (Month):', value: '18/20' },
            { label: 'Open Safety Issues:', value: 3, valueStyle: 'warning' },
            { label: 'Compliance Rate:', value: '96.5%' }
          ]}
        />

        <DetailedMetricCard
          icon="💰"
          iconBgColor="#fef3c7"
          title="Financial Overview"
          stats={[
            { label: 'Total Budget:', value: '$2.45M' },
            { label: 'Current Spend:', value: '$1.82M' },
            { label: 'Budget Variance:', value: '-$12.3K', valueStyle: 'success' },
            { label: 'Change Orders:', value: '$48.2K' }
          ]}
        />

        <DetailedMetricCard
          icon="📅"
          iconBgColor="#e0e7ff"
          title="Schedule Performance"
          stats={[
            { label: 'Projects On Schedule:', value: '4/5 (80%)' },
            { label: 'Behind Schedule:', value: 1, valueStyle: 'danger' },
            { label: 'Upcoming Milestones:', value: 6 },
            { label: 'SPI:', value: '0.97' }
          ]}
        />

        <DetailedMetricCard
          icon="👷"
          iconBgColor="#fed7aa"
          title="Resource Utilization"
          stats={[
            { label: 'Equipment Utilization:', value: '87%' },
            { label: 'Labor Hours (Week):', value: '1,248 hrs' },
            { label: 'Available Crew:', value: '24/28' },
            { label: 'Subcontractors Active:', value: 3 }
          ]}
        />

        <DetailedMetricCard
          icon="🤝"
          iconBgColor="#fce7f3"
          title="Client Relations"
          stats={[
            { label: 'Change Requests:', value: 2 },
            { label: 'Satisfaction Score:', value: '4.6/5.0', valueStyle: 'success' },
            { label: 'Pending Approvals:', value: 4 },
            { label: 'Outstanding RFIs:', value: 7 }
          ]}
        />

        <DetailedMetricCard
          icon="📋"
          iconBgColor="#ddd6fe"
          title="Documents & Compliance"
          stats={[
            { label: 'Pending Review:', value: 8 },
            { label: 'Active Permits:', value: '12/12', valueStyle: 'success' },
            { label: 'Contract Milestones:', value: 3 },
            { label: 'Daily Reports:', value: '100%' }
          ]}
        />

        <DetailedMetricCard
          icon="✅"
          iconBgColor="#ccfbf1"
          title="Quality Metrics"
          stats={[
            { label: 'Inspections Passed:', value: '94%' },
            { label: 'Deficiencies Open:', value: 11 },
            { label: 'Rework Hours (Month):', value: '28 hrs' },
            { label: 'Punch List Items:', value: 5 }
          ]}
        />

        <DetailedMetricCard
          icon="⚠️"
          iconBgColor="#fee2e2"
          title="Risk Management"
          stats={[
            { label: 'Active Risks:', value: '4 (1H, 2M, 1L)' },
            { label: 'Risks Mitigated:', value: 3 },
            { label: 'Weather Delays:', value: '2 days' },
            { label: 'Insurance Claims:', value: 0, valueStyle: 'success' }
          ]}
        />
      </div>
    </div>
  )
}
