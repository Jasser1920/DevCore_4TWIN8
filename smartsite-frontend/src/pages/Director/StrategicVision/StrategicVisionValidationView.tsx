import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch, getStrategicVision, validateStrategicVision } from '../../../lib/api'
import { useResponsive } from '../../../hooks/useResponsive'
import { Button } from '../../../components/shared/UI'
import { Status } from '../../../components/shared/UI'

type StrategicVision = {
  id: string
  companyId: string
  projectBudget: number
  currency: string
  startDate: string
  endDate: string
  globalKPIs: Array<{ name: string; target: number; unit: string; description?: string }>
  status: 'DRAFT' | 'PENDING_VALIDATION' | 'APPROVED' | 'REJECTED'
  validationNotes?: string
  validatedAt?: string
  updatedAt?: string
}

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function getVisionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_VALIDATION: 'Waiting for director validation',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  }

  return labels[status] || status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function getVisionStatusTone(status: string): 'success' | 'error' | 'pending' | 'warning' | 'info' {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'error'
  if (status === 'PENDING_VALIDATION') return 'pending'
  return 'info'
}

export default function StrategicVisionValidationView() {
  const { isMobile, isTablet } = useResponsive()
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')

  const companyQuery = useQuery({
    queryKey: ['director-company'],
    queryFn: async () => apiFetch<{ data: { id: string; name: string } | null }>('/companies/my-company', { method: 'GET' }),
  })

  const company = companyQuery.data?.data || null

  const visionQuery = useQuery({
    queryKey: ['director-strategic-vision', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      if (!company?.id) return null
      try {
        return (await getStrategicVision(company.id)) as { data?: StrategicVision } | StrategicVision | null
      } catch {
        return null
      }
    },
  })

  const strategicVision = (() => {
    const raw = visionQuery.data as any
    if (!raw) return null
    return raw.data ? (raw.data as StrategicVision) : (raw as StrategicVision)
  })()

  const validateMutation = useMutation({
    mutationFn: async (status: 'APPROVED' | 'REJECTED') => {
      if (!strategicVision?.id) throw new Error('No strategic vision available to validate')
      return validateStrategicVision(strategicVision.id, {
        status,
        validationNotes: notes.trim(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-strategic-vision', company?.id] })
      setNotes('')
    },
  })

  const canValidate = strategicVision?.status === 'PENDING_VALIDATION'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>Strategic Vision Validation</h2>
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
          Review and validate budget strategy and global KPIs for your company.
        </p>
      </div>

      {companyQuery.isLoading && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px' }}>Loading company...</div>
      )}

      {companyQuery.isError && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '12px', padding: '20px' }}>
          {(companyQuery.error as Error).message || 'Failed to load company information'}
        </div>
      )}

      {!companyQuery.isLoading && !companyQuery.isError && !company && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', color: '#6b7280' }}>
          You are not assigned to any company.
        </div>
      )}

      {!!company && visionQuery.isLoading && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px' }}>Loading strategic vision...</div>
      )}

      {!!company && !visionQuery.isLoading && !strategicVision && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', color: '#6b7280' }}>
          No strategic vision found for your company yet.
        </div>
      )}

      {!!strategicVision && (
        <>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Company</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{company?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Status</div>
                <Status
                  type={getVisionStatusTone(strategicVision.status)}
                  label={getVisionStatusLabel(strategicVision.status)}
                  size="small"
                  icon={false}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: '14px',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Budget</div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{formatMoney(strategicVision.projectBudget, strategicVision.currency)}</div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Start Date</div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{new Date(strategicVision.startDate).toLocaleDateString()}</div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>End Date</div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{new Date(strategicVision.endDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: '#111827' }}>Global KPIs</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {(strategicVision.globalKPIs || []).map((kpi, index) => (
                <div
                  key={`${kpi.name}-${index}`}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}
                >
                  <div style={{ fontWeight: 600, color: '#111827' }}>{kpi.name}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Target: {kpi.target} {kpi.unit}
                  </div>
                  {kpi.description && (
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{kpi.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: '#111827' }}>Validation Decision</h3>

            {!canValidate && (
              <p style={{ margin: 0, color: '#6b7280' }}>
                This strategic vision is already {getVisionStatusLabel(strategicVision.status).toLowerCase()} and cannot be validated again.
              </p>
            )}

            {canValidate && (
              <>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add validation notes (optional for approve, recommended for reject)"
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px',
                    resize: 'vertical',
                  }}
                />

                {validateMutation.isError && (
                  <p style={{ margin: '8px 0 0', color: '#b91c1c' }}>
                    {(validateMutation.error as Error).message || 'Failed to validate strategic vision'}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <Button
                    variant="secondary"
                    disabled={validateMutation.isPending}
                    onClick={() => validateMutation.mutate('APPROVED')}
                  >
                    {validateMutation.isPending ? 'Saving...' : 'Approve Strategic Vision'}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={validateMutation.isPending}
                    onClick={() => validateMutation.mutate('REJECTED')}
                  >
                    {validateMutation.isPending ? 'Saving...' : 'Reject Strategic Vision'}
                  </Button>
                </div>
              </>
            )}

            {!!strategicVision.validationNotes && (
              <div
                style={{
                  marginTop: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '10px',
                  backgroundColor: '#f8fafc',
                  fontSize: '14px',
                  color: '#334155',
                }}
              >
                <strong>Latest validation notes:</strong> {strategicVision.validationNotes}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
