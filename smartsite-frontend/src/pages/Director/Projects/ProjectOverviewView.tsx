import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  assignClientToProject,
  getDirectorAvailableClients,
  getDirectorActiveProjectsOverview,
  type DirectorClientItem,
  getDirectorProjectFinancialKpis,
  startProject,
  type DirectorProjectOverviewItem,
  type DirectorProjectRisk,
  getDirectorAvailableQhseManagers,
  assignQhseToProject,
  type DirectorQhseManagerItem,
} from '../../../lib/api'
import { useResponsive } from '../../../hooks/useResponsive'
import { Status } from '../../../components/shared/UI'
import PlanningControlView from './PlanningControlView'
import ProtectedProjectImage from '../../../components/shared/ProtectedProjectImage'

const riskColorMap: Record<DirectorProjectRisk, { bg: string; text: string; border: string }> = {
  LOW: { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
  MEDIUM: { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
  HIGH: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
}

function getProjectStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    SUBMITTED_FOR_VALIDATION: 'Waiting for director validation',
    REJECTED: 'Rejected by director',
    APPROVED: 'Approved by director',
    ACTIVE: 'Active',
    PLANNED: 'Planned',
    SUBMITTED_FOR_CLIENT_VALIDATION: 'Waiting for client approval',
    RESUBMITTED_FOR_CLIENT_VALIDATION: 'Resubmitted: waiting for client approval',
    APPROVED_BY_CLIENT: 'Approved by client',
    REJECTED_BY_CLIENT: 'Rejected by client',
  }

  return labels[status] || status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function getProjectStatusTone(status: string): 'success' | 'error' | 'pending' | 'warning' | 'info' {
  if (['APPROVED', 'ACTIVE', 'APPROVED_BY_CLIENT'].includes(status)) return 'success'
  if (['REJECTED', 'REJECTED_BY_CLIENT'].includes(status)) return 'error'
  if (['SUBMITTED_FOR_VALIDATION', 'SUBMITTED_FOR_CLIENT_VALIDATION', 'RESUBMITTED_FOR_CLIENT_VALIDATION'].includes(status)) return 'pending'
  if (status === 'DRAFT' || status === 'PLANNED') return 'info'
  return 'warning'
}

function formatMoney(value: number, currency: string) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPercent(value: number) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0
  return `${amount.toFixed(2)}%`
}

export default function ProjectOverviewView() {
  const { isMobile } = useResponsive()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | 'APPROVED' | 'ACTIVE'>('ALL')
  const [risk, setRisk] = useState<'ALL' | DirectorProjectRisk>('ALL')
  const [sortBy, setSortBy] = useState<'lastUpdatedAt' | 'risk' | 'budgetConsumptionPercent'>('lastUpdatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [startConfirmation, setStartConfirmation] = useState<string | null>(null)
  const [selectedQhseManagerId, setSelectedQhseManagerId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'KPI' | 'PLANNING'>('KPI')
  const qhseManagersQuery = useQuery({
    queryKey: ['director-available-qhse-managers'],
    queryFn: getDirectorAvailableQhseManagers,
  })
  const qhseManagers = qhseManagersQuery.data || []

  const assignQhseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) throw new Error('Select a project first')
      if (!selectedQhseManagerId) throw new Error('Select a QHSE manager first')
      return assignQhseToProject(selectedProjectId, selectedQhseManagerId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-active-overview'] })
    },
  })

  const overviewQuery = useQuery({
    queryKey: ['director-active-overview', page, pageSize, status, risk, search, sortBy, sortOrder],
    queryFn: () =>
      getDirectorActiveProjectsOverview({
        page,
        pageSize,
        status: status === 'ALL' ? undefined : status,
        risk: risk === 'ALL' ? undefined : risk,
        search,
        sortBy,
        sortOrder,
      }),
  })

  const projectRows = overviewQuery.data?.data || []
  const pagination = overviewQuery.data?.pagination || {
    page: 1,
    pageSize,
    total: 0,
    totalPages: 1,
  }

  const selectedProject = useMemo(
    () => projectRows.find((item) => item.id === selectedProjectId),
    [projectRows, selectedProjectId],
  )

  const clientsQuery = useQuery({
    queryKey: ['director-available-clients'],
    queryFn: getDirectorAvailableClients,
  })

  const clients = clientsQuery.data || []

  const kpiQuery = useQuery({
    queryKey: ['director-project-financial-kpi', selectedProjectId],
    queryFn: () => getDirectorProjectFinancialKpis(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  const startProjectMutation = useMutation({
    mutationFn: (projectId: string) => startProject(projectId),
    onSuccess: () => {
      setStartConfirmation(null)
      queryClient.invalidateQueries({ queryKey: ['director-active-overview'] })
      queryClient.invalidateQueries({ queryKey: ['director-project-financial-kpi'] })
    },
  })

  const assignClientMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) throw new Error('Select a project first')
      if (!selectedClientId) throw new Error('Select a client first')
      return assignClientToProject(selectedProjectId, selectedClientId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['director-active-overview'] })
    },
  })

  const resetToFirstPage = () => setPage(1)

  // Helper to get QHSE manager name by ID
  const getQhseManagerName = (qhseManagerId?: string | null) => {
    if (!qhseManagerId) return null;
    const manager = qhseManagers.find((m) => m.id === qhseManagerId);
    if (!manager) return qhseManagerId; // fallback to ID if not found
    return `${manager.firstName || ''} ${manager.lastName || ''}`.trim() || manager.username || manager.email || qhseManagerId;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '14px' : '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>Active Projects Overview</h2>
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
          View project execution health, budget utilization, progress, and risk indicators.
        </p>

        <div
          style={{
            marginTop: '14px',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr 1fr 1fr',
            gap: '10px',
          }}
        >
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              resetToFirstPage()
            }}
            placeholder="Search by project name or code"
            style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px' }}
          />

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as 'ALL' | 'APPROVED' | 'ACTIVE')
              resetToFirstPage()
            }}
            style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
          </select>

          <select
            value={risk}
            onChange={(event) => {
              setRisk(event.target.value as 'ALL' | DirectorProjectRisk)
              resetToFirstPage()
            }}
            style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px' }}
          >
            <option value="ALL">All Risks</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <select
            value={String(pageSize)}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              setPage(1)
            }}
            style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px' }}
          >
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
          </select>

          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as 'lastUpdatedAt' | 'risk' | 'budgetConsumptionPercent')
              resetToFirstPage()
            }}
            style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px' }}
          >
            <option value="lastUpdatedAt">Sort: Last Update</option>
            <option value="risk">Sort: Risk</option>
            <option value="budgetConsumptionPercent">Sort: Budget %</option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as 'asc' | 'desc')
              resetToFirstPage()
            }}
            style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px' }}
          >
            <option value="desc">Order: Desc</option>
            <option value="asc">Order: Asc</option>
          </select>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '14px' : '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        {overviewQuery.isLoading && <p style={{ margin: 0, color: '#6b7280' }}>Loading projects...</p>}

        {overviewQuery.isError && (
          <p style={{ margin: 0, color: '#b91c1c' }}>
            {(overviewQuery.error as Error).message || 'Failed to load project overview'}
          </p>
        )}

        {!overviewQuery.isLoading && !overviewQuery.isError && projectRows.length === 0 && (
          <p style={{ margin: 0, color: '#6b7280' }}>No active projects found for the selected filters.</p>
        )}

        {!overviewQuery.isLoading && !overviewQuery.isError && projectRows.length > 0 && (
          <>
            {isMobile ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                {projectRows.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={() => setSelectedProjectId(project.id)}
                    selected={project.id === selectedProjectId}
                  />
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', color: '#334155', textAlign: 'left' }}>
                      <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Project</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>PM</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Client</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>QHSE Manager</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Budget %</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Progress</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Risk</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Last Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectRows.map((project) => {
                      const riskStyle = riskColorMap[project.risk];
                      return (
                        <tr
                          key={project.id}
                          onClick={() => setSelectedProjectId(project.id)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: selectedProjectId === project.id ? '#eff6ff' : '#ffffff',
                          }}
                        >
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontWeight: 600 }}>{project.name}</div>
                            <div style={{ color: '#6b7280' }}>{project.code}</div>
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            <Status
                              type={getProjectStatusTone(project.status)}
                              label={getProjectStatusLabel(project.status)}
                              size="small"
                              icon={false}
                            />
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontWeight: 600 }}>{project.projectManagerName}</div>
                            <div style={{ color: '#6b7280' }}>{project.projectManagerEmail}</div>
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            {project.clientName ? (
                              <>
                                <div style={{ fontWeight: 600 }}>{project.clientName}</div>
                                <div style={{ color: '#6b7280' }}>{project.clientEmail || 'N/A'}</div>
                              </>
                            ) : (
                              <span style={{ color: '#64748b' }}>Not assigned</span>
                            )}
                          </td>
                           <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            {project.qhseManagerId ? (
                              <span>{getQhseManagerName(project.qhseManagerId)}</span>
                            ) : (
                              <span style={{ color: '#64748b' }}>Not assigned</span>
                            )}
                          </td>
                         
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            {formatPercent(project.progressPercent)}
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            {formatPercent(project.budgetConsumptionPercent)}
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            <span
                              style={{
                                backgroundColor: riskStyle.bg,
                                color: riskStyle.text,
                                border: `1px solid ${riskStyle.border}`,
                                borderRadius: '999px',
                                padding: '2px 8px',
                                fontWeight: 600,
                              }}
                            >
                              {project.risk}
                            </span>
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                            {new Date(project.lastUpdatedAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Page {pagination.page} of {pagination.totalPages} | Total {pagination.total}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    padding: '6px 10px',
                    cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    padding: '6px 10px',
                    cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: isMobile ? '14px' : '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Strategic Project Insights</h3>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            <button
               onClick={() => setViewMode('KPI')}
               style={{
                 padding: '6px 12px',
                 borderRadius: '6px',
                 fontSize: '13px',
                 fontWeight: 600,
                 backgroundColor: viewMode === 'KPI' ? 'white' : 'transparent',
                 color: viewMode === 'KPI' ? '#075B7A' : '#64748b',
                 boxShadow: viewMode === 'KPI' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                 border: 'none',
                 cursor: 'pointer',
                 transition: 'all 0.2s'
               }}
            >
              Financial KPIs
            </button>
            <button
               onClick={() => setViewMode('PLANNING')}
               style={{
                 padding: '6px 12px',
                 borderRadius: '6px',
                 fontSize: '13px',
                 fontWeight: 600,
                 backgroundColor: viewMode === 'PLANNING' ? 'white' : 'transparent',
                 color: viewMode === 'PLANNING' ? '#075B7A' : '#64748b',
                 boxShadow: viewMode === 'PLANNING' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                 border: 'none',
                 cursor: 'pointer',
                 transition: 'all 0.2s'
               }}
            >
              Planning Intelligence (AI)
            </button>
          </div>
        </div>

        {selectedProjectId && selectedProject && viewMode === 'PLANNING' && (
          <PlanningControlView projectId={selectedProjectId} />
        )}

        {selectedProjectId && selectedProject && viewMode === 'KPI' && (
          <>
            {/* Client Assignment Section */}
            <div style={{ marginBottom: '14px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#1f2937' }}>Assign Client To Project</h4>
              {selectedProject.clientUserId ? (
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                  Client assigned: {selectedProject.clientName || 'N/A'} ({selectedProject.clientEmail || 'N/A'})
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr auto', gap: '8px' }}>
                  <select
                    value={selectedClientId}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                    disabled={clientsQuery.isLoading || assignClientMutation.isPending}
                    style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px' }}
                  >
                    <option value="">Select client</option>
                    {clients.map((client: DirectorClientItem) => (
                      <option key={client.id} value={client.id}>
                        {`${client.firstName || ''} ${client.lastName || ''}`.trim() || client.username} ({client.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => assignClientMutation.mutate()}
                    disabled={!selectedClientId || assignClientMutation.isPending}
                    style={{
                      backgroundColor: '#075B7A',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: !selectedClientId || assignClientMutation.isPending ? 'not-allowed' : 'pointer',
                      opacity: !selectedClientId || assignClientMutation.isPending ? 0.7 : 1,
                    }}
                  >
                    {assignClientMutation.isPending ? 'Assigning...' : 'Assign Client'}
                  </button>
                </div>
              )}
              {assignClientMutation.isError && (
                <p style={{ margin: '8px 0 0', color: '#b91c1c', fontSize: '12px' }}>
                  {(assignClientMutation.error as Error).message || 'Failed to assign client'}
                </p>
              )}
            </div>

            {/* QHSE Manager Assignment Section */}
            <div style={{ marginBottom: '14px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#1f2937' }}>Assign QHSE Manager To Project</h4>
              {selectedProject.qhseManagerId ? (
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                  QHSE manager assigned: <span style={{ fontWeight: 600 }}>{getQhseManagerName(selectedProject.qhseManagerId)}</span>
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr auto', gap: '8px' }}>
                  <select
                    value={selectedQhseManagerId}
                    onChange={(event) => setSelectedQhseManagerId(event.target.value)}
                    disabled={qhseManagersQuery.isLoading || assignQhseMutation.isPending}
                    style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px' }}
                  >
                    <option value="">Select QHSE manager</option>
                    {qhseManagers.map((qhse: DirectorQhseManagerItem) => (
                      <option key={qhse.id} value={qhse.id}>
                        {`${qhse.firstName || ''} ${qhse.lastName || ''}`.trim() || qhse.username} ({qhse.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => assignQhseMutation.mutate()}
                    disabled={!selectedQhseManagerId || assignQhseMutation.isPending}
                    style={{
                      backgroundColor: '#075B7A',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: !selectedQhseManagerId || assignQhseMutation.isPending ? 'not-allowed' : 'pointer',
                      opacity: !selectedQhseManagerId || assignQhseMutation.isPending ? 0.7 : 1,
                    }}
                  >
                    {assignQhseMutation.isPending ? 'Assigning...' : 'Assign QHSE'}
                  </button>
                </div>
              )}
              {assignQhseMutation.isError && (
                <p style={{ margin: '8px 0 0', color: '#b91c1c', fontSize: '12px' }}>
                  {(assignQhseMutation.error as Error).message || 'Failed to assign QHSE manager'}
                </p>
              )}
            </div>
          </>
        )}

        {!selectedProjectId && (
          <p style={{ margin: 0, color: '#6b7280' }}>Select a project from the overview to display financial KPIs.</p>
        )}

        {selectedProjectId && kpiQuery.isLoading && <p style={{ margin: 0, color: '#6b7280' }}>Loading financial KPIs...</p>}

        {selectedProjectId && kpiQuery.isError && (
          <p style={{ margin: 0, color: '#b91c1c' }}>
            {(kpiQuery.error as Error).message || 'Failed to load financial KPIs'}
          </p>
        )}

        {selectedProjectId && kpiQuery.data && (
          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)' }}>
            <KpiCard label="Planned Budget" value={formatMoney(kpiQuery.data.plannedBudget, kpiQuery.data.currency)} />
            <KpiCard label="Consumed Budget" value={formatMoney(kpiQuery.data.consumedBudget, kpiQuery.data.currency)} />
            <KpiCard label="Burn Rate" value={formatPercent(kpiQuery.data.burnRatePercent)} />
            <KpiCard
              label="Variance"
              value={`${formatMoney(kpiQuery.data.varianceAmount, kpiQuery.data.currency)} (${formatPercent(kpiQuery.data.variancePercent)})`}
            />
          </div>
        )}

        {selectedProject && (
          <p style={{ marginBottom: 0, marginTop: '12px', color: '#6b7280', fontSize: '12px' }}>
            Selected project: {selectedProject.name} ({selectedProject.code})
          </p>
        )}

        {selectedProject && selectedProject.status === 'APPROVED' && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setStartConfirmation(selectedProject.id)}
              disabled={startProjectMutation.isPending}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: startProjectMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: startProjectMutation.isPending ? 0.7 : 1,
              }}
            >
              {startProjectMutation.isPending ? 'Starting...' : 'Start Execution'}
            </button>
            {startProjectMutation.isError && (
              <span style={{ color: '#dc2626', fontSize: '13px' }}>
                {(startProjectMutation.error as Error).message || 'Failed to start project'}
              </span>
            )}
          </div>
        )}
      </div>

      {startConfirmation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setStartConfirmation(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px', color: '#1f2937' }}>Start Project Execution</h3>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '14px' }}>
              Are you sure you want to start execution for <strong>{selectedProject?.name}</strong>? This will change
              the project status from APPROVED to ACTIVE.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setStartConfirmation(null)}
                disabled={startProjectMutation.isPending}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => startProjectMutation.mutate(startConfirmation)}
                disabled={startProjectMutation.isPending}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: startProjectMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: startProjectMutation.isPending ? 0.7 : 1,
                }}
              >
                {startProjectMutation.isPending ? 'Starting...' : 'Start Execution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px', backgroundColor: '#f8fafc' }}>
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{value}</div>
    </div>
  )
}

function ProjectCard({ project, onSelect, selected }: { project: DirectorProjectOverviewItem; onSelect: () => void; selected: boolean }) {
  const riskStyle = riskColorMap[project.risk];
  // Use qhseManagers from closure (from parent component)
  const qhseManagers = (typeof window !== 'undefined' && window.qhseManagers) || [];
  const getQhseManagerName = (qhseManagerId?: string | null) => {
    if (!qhseManagerId) return null;
    const manager = qhseManagers.find((m: any) => m.id === qhseManagerId);
    if (!manager) return qhseManagerId;
    return `${manager.firstName || ''} ${manager.lastName || ''}`.trim() || manager.username || manager.email || qhseManagerId;
  };
  return (
    <button
      onClick={onSelect}
      style={{
        border: selected ? '1px solid #60a5fa' : '1px solid #e5e7eb',
        borderRadius: '10px',
        backgroundColor: selected ? '#eff6ff' : '#ffffff',
        padding: '12px',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontWeight: 600, color: '#0f172a' }}>{project.name}</div>
      <div style={{ marginTop: '2px', fontSize: '12px', color: '#64748b' }}>{project.code}</div>
      {project.prototypeImageUrl && (
        <ProtectedProjectImage
          attachmentUrl={project.prototypeImageUrl}
          alt={`${project.name} prototype`}
          style={{
            width: '100%',
            height: '118px',
            objectFit: 'cover',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginTop: '10px',
          }}
        />
      )}
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#334155' }}>
        Status:{' '}
        <Status
          type={getProjectStatusTone(project.status)}
          label={getProjectStatusLabel(project.status)}
          size="small"
          icon={false}
        />{' '}
        | PM: {project.projectManagerName}
      </div>
      <div style={{ marginTop: '4px', fontSize: '12px', color: '#64748b' }}>{project.projectManagerEmail}</div>
      <div style={{ marginTop: '4px', fontSize: '12px', color: '#334155' }}>
        Client: {project.clientName || 'Not assigned'}
      </div>
      <div style={{ marginTop: '6px', fontSize: '12px', color: '#334155' }}>
        Budget: {formatPercent(project.budgetConsumptionPercent)} | Progress: {formatPercent(project.progressPercent)}
      </div>
      <div style={{ marginTop: '6px' }}>
        <span
          style={{
            backgroundColor: riskStyle.bg,
            color: riskStyle.text,
            border: `1px solid ${riskStyle.border}`,
            borderRadius: '999px',
            padding: '2px 8px',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          {project.risk}
        </span>
      </div>
      <div style={{ marginTop: '6px', fontSize: '12px', color: '#334155' }}>
        QHSE Manager: {project.qhseManagerId ? getQhseManagerName(project.qhseManagerId) : 'Not assigned'}
      </div>
    </button>
  );
}
