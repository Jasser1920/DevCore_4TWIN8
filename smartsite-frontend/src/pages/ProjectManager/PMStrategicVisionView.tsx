import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  createStrategicVision,
  getMyAssignedCompany,
  getStrategicVision,
  updateStrategicVision,
} from '../../lib/api'
import { useResponsive } from '../../hooks/useResponsive'
import { Button } from '../../components/shared/UI'

type KPIForm = {
  name: string
  target: string
  unit: string
  description: string
}

type StrategicVision = {
  id: string
  companyId: string
  projectBudget: number
  currency: string
  startDate: string
  endDate: string
  status: 'DRAFT' | 'PENDING_VALIDATION' | 'APPROVED' | 'REJECTED'
  validationNotes?: string
  globalKPIs: Array<{ name: string; target: number; unit: string; description?: string }>
}

const initialForm = {
  projectBudget: '',
  currency: 'USD',
  startDate: '',
  endDate: '',
  globalKPIs: [{ name: '', target: '', unit: '', description: '' }] as KPIForm[],
}

function toDateInput(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function normalizeVisionResponse(input: unknown): StrategicVision | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as { data?: StrategicVision }
  return raw.data || (input as StrategicVision)
}

export default function PMStrategicVisionView() {
  const { isMobile, isTablet } = useResponsive()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [pageMessage, setPageMessage] = useState('')
  const [pageError, setPageError] = useState('')

  const companyQuery = useQuery({
    queryKey: ['pm-assigned-company'],
    queryFn: getMyAssignedCompany,
  })

  const company = companyQuery.data?.data || null

  const visionQuery = useQuery({
    queryKey: ['pm-strategic-vision', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      if (!company?.id) return null
      try {
        const response = await getStrategicVision(company.id)
        return normalizeVisionResponse(response)
      } catch {
        return null
      }
    },
  })

  const strategicVision = visionQuery.data || null

  useEffect(() => {
    if (!strategicVision) {
      setForm(initialForm)
      return
    }

    setForm({
      projectBudget: String(strategicVision.projectBudget || ''),
      currency: strategicVision.currency || 'USD',
      startDate: toDateInput(strategicVision.startDate),
      endDate: toDateInput(strategicVision.endDate),
      globalKPIs: (strategicVision.globalKPIs || []).length
        ? strategicVision.globalKPIs.map((kpi) => ({
            name: kpi.name || '',
            target: String(kpi.target ?? ''),
            unit: kpi.unit || '',
            description: kpi.description || '',
          }))
        : [{ name: '', target: '', unit: '', description: '' }],
    })
  }, [strategicVision])

  const validateForm = (): string | null => {
    const budget = Number(form.projectBudget)
    if (!form.projectBudget.trim() || Number.isNaN(budget) || budget <= 0) {
      return 'Project budget must be greater than 0.'
    }

    if (!form.currency.trim()) {
      return 'Currency is required.'
    }

    if (!form.startDate || !form.endDate) {
      return 'Start and end dates are required.'
    }

    if (new Date(form.endDate) <= new Date(form.startDate)) {
      return 'End date must be after start date.'
    }

    if (!form.globalKPIs.length) {
      return 'Add at least one KPI.'
    }

    for (let index = 0; index < form.globalKPIs.length; index += 1) {
      const kpi = form.globalKPIs[index]
      if (!kpi.name.trim() || !kpi.unit.trim()) {
        return `KPI ${index + 1}: name and unit are required.`
      }

      const target = Number(kpi.target)
      if (kpi.target === '' || Number.isNaN(target) || target < 0) {
        return `KPI ${index + 1}: target must be a non-negative number.`
      }
    }

    return null
  }

  const isReadOnly = strategicVision?.status === 'APPROVED' || strategicVision?.status === 'PENDING_VALIDATION'

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) throw new Error('No assigned company found')
      const validationError = validateForm()
      if (validationError) throw new Error(validationError)

      const payload = {
        projectBudget: Number(form.projectBudget),
        currency: form.currency.trim().toUpperCase(),
        startDate: form.startDate,
        endDate: form.endDate,
        globalKPIs: form.globalKPIs.map((kpi) => ({
          name: kpi.name.trim(),
          target: Number(kpi.target),
          unit: kpi.unit.trim(),
          description: kpi.description.trim() || undefined,
        })),
      }

      if (strategicVision?.id) {
        return updateStrategicVision(strategicVision.id, payload)
      }

      return createStrategicVision(company.id, payload)
    },
    onSuccess: () => {
      setPageError('')
      setPageMessage(
        strategicVision?.status === 'REJECTED'
          ? 'Strategic vision updated and resubmitted for validation.'
          : strategicVision
          ? 'Strategic vision updated successfully.'
          : 'Strategic vision created and submitted for validation.',
      )
      queryClient.invalidateQueries({ queryKey: ['pm-strategic-vision', company?.id] })
    },
    onError: (error: Error) => {
      setPageMessage('')
      setPageError(error.message || 'Failed to save strategic vision')
    },
  })

  const updateKpi = (index: number, field: keyof KPIForm, value: string) => {
    setForm((previous) => {
      const next = [...previous.globalKPIs]
      next[index] = { ...next[index], [field]: value }
      return { ...previous, globalKPIs: next }
    })
  }

  const addKpi = () => {
    setForm((previous) => ({
      ...previous,
      globalKPIs: [...previous.globalKPIs, { name: '', target: '', unit: '', description: '' }],
    }))
  }

  const removeKpi = (index: number) => {
    setForm((previous) => {
      if (previous.globalKPIs.length === 1) return previous
      return {
        ...previous,
        globalKPIs: previous.globalKPIs.filter((_, currentIndex) => currentIndex !== index),
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: isMobile ? '20px' : isTablet ? '24px' : '28px',
        }}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#075B7A', fontFamily: 'Poppins, sans-serif' }}>
          Strategic Vision
        </h2>
        <p style={{ margin: 0, color: '#6b7280', lineHeight: '1.6' }}>
          Define the project strategic baseline with budget, timeline, and global KPIs. Director validation is required before execution.
        </p>
      </div>

      {(pageMessage || pageError) && (
        <div
          style={{
            borderRadius: '10px',
            padding: '12px 16px',
            border: `1px solid ${pageError ? '#fecaca' : '#86efac'}`,
            backgroundColor: pageError ? '#fef2f2' : '#ecfdf5',
            color: pageError ? '#b91c1c' : '#166534',
          }}
        >
          {pageError || pageMessage}
        </div>
      )}

      {companyQuery.isLoading && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px' }}>Loading assigned company...</div>
      )}

      {companyQuery.isError && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '12px', padding: '20px' }}>
          {(companyQuery.error as Error).message || 'Failed to load company assignment'}
        </div>
      )}

      {!companyQuery.isLoading && !companyQuery.isError && !company && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', color: '#6b7280' }}>
          You are not currently assigned to a company.
        </div>
      )}

      {!!company && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {visionQuery.isLoading && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px' }}>Loading strategic vision...</div>
          )}

          {!visionQuery.isLoading && (
            <>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Company</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{company.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Status</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: strategicVision?.status === 'APPROVED' ? '#047857' : strategicVision?.status === 'REJECTED' ? '#b91c1c' : '#92400e' }}>
                      {strategicVision?.status || 'NOT_CREATED'}
                    </div>
                  </div>
                </div>

                {strategicVision?.validationNotes && (
                  <div
                    style={{
                      marginTop: '12px',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fff1f2',
                      color: '#9f1239',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '13px',
                    }}
                  >
                    Latest Director Notes: {strategicVision.validationNotes}
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 14px 0', color: '#111827', fontSize: '18px' }}>Strategic Vision Form</h3>

                {isReadOnly && (
                  <div
                    style={{
                      marginBottom: '12px',
                      border: '1px solid #fde68a',
                      backgroundColor: '#fffbeb',
                      color: '#92400e',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '13px',
                    }}
                  >
                    This strategic vision is currently {strategicVision?.status?.toLowerCase()}. Editing is disabled.
                  </div>
                )}

                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <input
                      type="number"
                      min="0"
                      placeholder="Project budget"
                      value={form.projectBudget}
                      onChange={(event) => setForm((previous) => ({ ...previous, projectBudget: event.target.value }))}
                      disabled={isReadOnly}
                      style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff' }}
                    />
                    <input
                      placeholder="Currency"
                      value={form.currency}
                      onChange={(event) => setForm((previous) => ({ ...previous, currency: event.target.value.toUpperCase() }))}
                      disabled={isReadOnly}
                      style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(event) => setForm((previous) => ({ ...previous, startDate: event.target.value }))}
                      disabled={isReadOnly}
                      style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff' }}
                    />
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(event) => setForm((previous) => ({ ...previous, endDate: event.target.value }))}
                      disabled={isReadOnly}
                      style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ margin: 0, color: '#111827', fontSize: '18px' }}>Global KPIs</h3>
                  <Button variant="secondary" disabled={isReadOnly} onClick={addKpi}>Add KPI</Button>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {form.globalKPIs.map((kpi, index) => (
                    <div key={`kpi-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px', display: 'grid', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr 1fr', gap: '8px' }}>
                        <input
                          placeholder="KPI name"
                          value={kpi.name}
                          onChange={(event) => updateKpi(index, 'name', event.target.value)}
                          disabled={isReadOnly}
                          style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff' }}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Target"
                          value={kpi.target}
                          onChange={(event) => updateKpi(index, 'target', event.target.value)}
                          disabled={isReadOnly}
                          style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff' }}
                        />
                        <input
                          placeholder="Unit"
                          value={kpi.unit}
                          onChange={(event) => updateKpi(index, 'unit', event.target.value)}
                          disabled={isReadOnly}
                          style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff' }}
                        />
                      </div>

                      <textarea
                        placeholder="Description (optional)"
                        value={kpi.description}
                        onChange={(event) => updateKpi(index, 'description', event.target.value)}
                        disabled={isReadOnly}
                        style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', minHeight: '70px', backgroundColor: isReadOnly ? '#f3f4f6' : '#fff' }}
                      />

                      <div>
                        <Button variant="danger" disabled={isReadOnly || form.globalKPIs.length === 1} onClick={() => removeKpi(index)}>
                          Remove KPI
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  disabled={isReadOnly || saveMutation.isPending}
                  onClick={() => {
                    setPageError('')
                    setPageMessage('')
                    saveMutation.mutate()
                  }}
                >
                  {saveMutation.isPending
                    ? 'Saving...'
                    : strategicVision?.status === 'REJECTED'
                    ? 'Update And Resubmit'
                    : strategicVision
                    ? 'Update Strategic Vision'
                    : 'Create Strategic Vision'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
