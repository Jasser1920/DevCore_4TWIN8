import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch, getAvailableProjectManagers, assignProjectManager, unassignProjectManager } from '../../../lib/api'
import { useResponsive } from '../../../hooks/useResponsive'
import { exportCompanyDetailsToPDF } from '../../../lib/pdfExport'
import { Button } from '../../../components/shared/UI'
import { Status } from '../../../components/shared/UI'
import { Download, UserPlus, Save, X } from 'lucide-react'

export default function CompanyView() {
  const { isMobile, isTablet } = useResponsive()
  const [showPmAssignment, setShowPmAssignment] = useState(false)
  const [selectedPmId, setSelectedPmId] = useState('')

  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: ['director-company'],
    queryFn: async () => {
      return apiFetch<{ data: any | null }>('/companies/my-company', { method: 'GET' })
    },
  })

  const company = companyData?.data || null

  // Project Manager Query
  const { data: projectManagersData } = useQuery({
    queryKey: ['available-project-managers'],
    queryFn: async () => {
      return getAvailableProjectManagers()
    },
  })

  const projectManagers = projectManagersData?.data || []
  const availableToAssign = projectManagers.filter((pm: any) => !pm.isAssignedGlobally)
  const selectedProjectManager = projectManagers.find((pm: any) => pm.id === selectedPmId)
  const assignedPmIds = Array.isArray(company?.projectManagerIds)
    ? company.projectManagerIds
    : company?.projectManagerId
    ? [company.projectManagerId]
    : []
  const assignedProjectManagers = projectManagers.filter((pm: any) => assignedPmIds.includes(pm.id))

  // Assign PM Mutation
  const assignPmMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id || !selectedPmId) throw new Error('Missing required data')
      return assignProjectManager(company.id, selectedPmId)
    },
    onSuccess: () => {
      setShowPmAssignment(false)
      setSelectedPmId('')
      window.location.reload()
    },
  })

  const unassignPmMutation = useMutation({
    mutationFn: async (projectManagerId: string) => {
      if (!company?.id) throw new Error('Missing company data')
      return unassignProjectManager(company.id, projectManagerId)
    },
    onSuccess: () => {
      window.location.reload()
    },
  })

  if (companyLoading) {
    return (
      <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', padding: '32px' }}>
        Loading company data...
      </div>
    )
  }

  if (!company) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 16px 0' }}>
          No Company Assigned
        </h2>
        <p style={{ color: '#6b7280' }}>
          You are not currently assigned to any company. Please contact the Super Admin.
        </p>
      </div>
    )
  }

  const containerGap = isMobile ? '16px' : isTablet ? '20px' : '24px'
  const containerPadding = isMobile ? '16px' : isTablet ? '20px' : '24px'
  const gridGap = isMobile ? '12px' : '16px'
  const buttonPadding = isMobile ? '12px 16px' : '8px 16px'
  const buttonFontSize = isMobile ? '15px' : '14px'

  const handleExportCompany = () => {
    exportCompanyDetailsToPDF(company)
  }

  const companyStatusTone: 'success' | 'error' | 'pending' | 'warning' | 'info' =
    company.status === 'ACTIVE' ? 'success' : 'error'

  const companyStatusLabel = company.status === 'ACTIVE' ? 'Active' : 'Inactive'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: containerGap }}>
      {/* Company Details */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: containerPadding,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
            Company Details
          </h2>
          <Button
            onClick={handleExportCompany}
            icon={Download}
            size={isMobile ? 'large' : 'medium'}
            style={{
              fontSize: buttonFontSize,
              padding: buttonPadding
            }}
            title="Export company details to PDF"
          >
            Export to PDF
          </Button>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: gridGap
        }}>
          <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Company Name</p>
            <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a', fontWeight: '600' }}>{company.name}</p>
          </div>
          <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Status</p>
            <Status type={companyStatusTone} label={companyStatusLabel} size="small" icon={false} />
          </div>
          <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Contact Name</p>
            <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a' }}>{company.contactName || 'Not set'}</p>
          </div>
          <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Contact Email</p>
            <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a' }}>{company.contactEmail || 'Not set'}</p>
          </div>
          <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Storage Quota</p>
            <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a' }}>
              {(company.storageQuota / (1024 * 1024 * 1024)).toFixed(2)} GB
            </p>
          </div>
          <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Storage Used</p>
            <p style={{ margin: 0, fontSize: '16px', color: '#1a1a1a' }}>
              {(company.usedStorage / (1024 * 1024 * 1024)).toFixed(2)} GB
            </p>
          </div>
          <div style={{ gridColumn: isMobile ? '1' : isTablet ? 'span 2' : 'span 3', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Description</p>
            <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', whiteSpace: 'pre-wrap' }}>
              {company.description || 'No description provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Project Manager Assignment */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>Project Manager Assignment</h3>
          {!showPmAssignment && (
            <Button
              onClick={() => setShowPmAssignment(true)}
              size={isMobile ? 'large' : 'medium'}
              icon={UserPlus}
              style={{
                padding: buttonPadding,
                fontSize: buttonFontSize
              }}
            >
              Add Project Manager
            </Button>
          )}
        </div>

        {showPmAssignment && (
          <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 16px 0' }}>
              Select Project Manager
            </h4>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                Project Manager
              </label>
              <select
                value={selectedPmId}
                onChange={(e) => setSelectedPmId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select a Project Manager...</option>
                {availableToAssign.map((pm: any) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.firstName} {pm.lastName} ({pm.email})
                  </option>
                ))}
              </select>
              {availableToAssign.length === 0 && (
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#92400e' }}>
                  All Project Managers are already assigned to other companies.
                </p>
              )}
            </div>

            {selectedProjectManager && (
              <div style={{
                marginBottom: '16px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#1e3a8a', fontWeight: '600' }}>
                  Selected Project Manager Details
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '10px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Full Name</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                      {selectedProjectManager.firstName} {selectedProjectManager.lastName}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Username</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                      {selectedProjectManager.username || 'N/A'}
                    </p>
                  </div>
                  <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Email</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                      {selectedProjectManager.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                onClick={() => assignPmMutation.mutate()}
                disabled={!selectedPmId || assignPmMutation.isPending}
                variant="secondary"
                icon={Save}
                style={{
                  padding: '10px 16px',
                  fontSize: '14px'
                }}
              >
                {assignPmMutation.isPending ? 'Assigning...' : 'Assign PM'}
              </Button>
              <Button
                onClick={() => {
                  setShowPmAssignment(false)
                  setSelectedPmId('')
                }}
                variant="text"
                icon={X}
                style={{
                  padding: '10px 16px',
                  fontSize: '14px'
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!showPmAssignment && assignedPmIds.length > 0 && (
          <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #86efac' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#065f46', fontWeight: '600' }}>
              Assigned Project Managers
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {assignedPmIds.map((pmId: string) => {
                const pm = assignedProjectManagers.find((item: any) => item.id === pmId)
                return (
                  <div key={pmId} style={{
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    padding: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
                        {pm ? `${pm.firstName} ${pm.lastName}` : `Project Manager ID: ${pmId}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {pm?.email || pm?.username || 'No details'}
                      </div>
                    </div>
                    <Button
                      variant="text"
                      disabled={unassignPmMutation.isPending}
                      onClick={() => unassignPmMutation.mutate(pmId)}
                      style={{ color: '#b91c1c' }}
                    >
                      {unassignPmMutation.isPending ? 'Removing...' : 'Remove'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!showPmAssignment && assignedPmIds.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', padding: '16px' }}>
            No Project Managers assigned yet. Click the button above to add one.
          </div>
        )}
      </div>
    </div>
  )
}
