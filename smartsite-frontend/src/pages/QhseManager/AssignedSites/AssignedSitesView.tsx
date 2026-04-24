import { useMutation, useQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { analyzeQhseImage, analyzeQhseSiteAverage, getQhseAssignedSites, previewQhseSiteSafetyReport, resolveApiUrl, sendQhseSiteSafetyReport, type ProjectItem } from '../../../lib/api'
import { getAccessToken, getRefreshToken, isTokenExpiringSoon, refreshAccessToken } from '../../../lib/auth'

const statusColors: Record<string, string> = {
  ACTIVE: '#16a34a',
  INACTIVE: '#6b7280',
  PENDING: '#d97706',
  COMPLETED: '#0ea5e9',
  APPROVED: '#0ea5e9',
  DRAFT: '#94a3b8',
}

const reportStatusColors: Record<string, string> = {
  SUBMITTED: '#d97706',
  UNDER_REVIEW: '#0ea5e9',
  ACTION_REQUIRED: '#f97316',
  ACCEPTED: '#16a34a',
}

type SiteImage = NonNullable<ProjectItem['siteImages']>[number]
type PpeAnalysis = {
  persons: number
  helmets: number
  vests: number
  no_helmet: number
  no_vest: number
  ppe_compliance_percent: number
}

function ProtectedImage({
  attachmentUrl,
  alt,
  style,
}: {
  attachmentUrl: string
  alt: string
  style?: CSSProperties
}) {
  const [resolvedSrc, setResolvedSrc] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    let objectUrl = ''

    async function loadImage() {
      setResolvedSrc('')
      setLoadError('')

      let token = getAccessToken()
      if (!token) {
        setLoadError('Missing access token')
        return
      }

      if (isTokenExpiringSoon(token) && getRefreshToken()) {
        const nextToken = await refreshAccessToken()
        if (nextToken) token = nextToken
      }

      try {
        let response = await fetch(resolveApiUrl(attachmentUrl), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401 && getRefreshToken()) {
          const nextToken = await refreshAccessToken()
          if (nextToken) {
            token = nextToken
            response = await fetch(resolveApiUrl(attachmentUrl), {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          }
        }

        if (!response.ok) {
          throw new Error('Image request failed')
        }

        const imageBlob = await response.blob()
        objectUrl = URL.createObjectURL(imageBlob)
        if (!cancelled) {
          setResolvedSrc(objectUrl)
        }
      } catch {
        if (!cancelled) {
          setLoadError('Unable to load image')
        }
      }
    }

    loadImage()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachmentUrl])

  if (resolvedSrc) {
    return <img src={resolvedSrc} alt={alt} style={style} />
  }

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: loadError ? '#b91c1c' : '#64748b',
        background: '#fff',
        minHeight: 96,
      }}
    >
      {loadError || 'Loading image...'}
    </div>
  )
}

function SiteDetailModal({ site, onClose }: { site: ProjectItem; onClose: () => void }) {
  const [selectedImage, setSelectedImage] = useState<SiteImage | null>(site.siteImages?.[0] || null)
  const [analysisResult, setAnalysisResult] = useState<
    | null
    | {
        mode: 'image'
        attachmentUrl: string
        reportId: string
        analysis: PpeAnalysis
      }
    | {
        mode: 'site-average'
        imageCount: number
        analysis: PpeAnalysis
      }
  >(null)
  const [emailSuccessMessage, setEmailSuccessMessage] = useState('')
  const [reportPreview, setReportPreview] = useState<null | {
    director: {
      id: string
      name: string
      email: string
    }
    project: {
      id: string
      name: string
      code: string
    }
    report: {
      complianceScore: number
      imageCount: number
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
      summary: string
      recommendations: string[]
    }
  }>(null)

  const analyzeMutation = useMutation({
    mutationFn: (attachmentUrl: string) => analyzeQhseImage(attachmentUrl),
    onSuccess: (result) =>
      setAnalysisResult({
        mode: 'image',
        attachmentUrl: result.attachmentUrl,
        reportId: result.reportId,
        analysis: result.analysis,
      }),
  })

  const analyzeAverageMutation = useMutation({
    mutationFn: (projectId: string) => analyzeQhseSiteAverage(projectId),
    onSuccess: (result) =>
      setAnalysisResult({
        mode: 'site-average',
        imageCount: result.imageCount,
        analysis: result.analysis,
      }),
  })

  const sendReportMutation = useMutation({
    mutationFn: (projectId: string) => sendQhseSiteSafetyReport(projectId),
    onSuccess: (result) => {
      setEmailSuccessMessage(`Safety report emailed to ${result.director.email}`)
      setAnalysisResult({
        mode: 'site-average',
        imageCount: result.report.imageCount,
        analysis: {
          persons: 0,
          helmets: 0,
          vests: 0,
          no_helmet: 0,
          no_vest: 0,
          ppe_compliance_percent: result.report.complianceScore,
        },
      })
    },
  })

  const previewReportMutation = useMutation({
    mutationFn: (projectId: string) => previewQhseSiteSafetyReport(projectId),
    onSuccess: (result) => {
      setEmailSuccessMessage('')
      setReportPreview(result)
      setAnalysisResult({
        mode: 'site-average',
        imageCount: result.report.imageCount,
        analysis: {
          persons: 0,
          helmets: 0,
          vests: 0,
          no_helmet: 0,
          no_vest: 0,
          ppe_compliance_percent: result.report.complianceScore,
        },
      })
    },
  })

  const siteImages = site.siteImages || []

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 18,
          padding: 28,
          maxWidth: 1100,
          width: '100%',
          maxHeight: '88vh',
          overflow: 'auto',
          boxShadow: '0 25px 80px rgba(15, 23, 42, 0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 24, color: '#0f172a' }}>{site.name}</div>
            <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
              {site.code} {site.siteAddress ? `• ${site.siteAddress}` : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.1fr) minmax(280px, 0.9fr)', gap: 24 }}>
          <div>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 12 }}>Site Images</div>
              {selectedImage ? (
                <ProtectedImage
                  attachmentUrl={selectedImage.url}
                  alt={`${site.name} site capture`}
                  style={{
                    width: '100%',
                    maxHeight: 360,
                    objectFit: 'cover',
                    borderRadius: 12,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                  }}
                />
              ) : (
                <div
                  style={{
                    minHeight: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    border: '1px dashed #cbd5e1',
                    color: '#94a3b8',
                    background: '#fff',
                  }}
                >
                  No image selected
                </div>
              )}

              {selectedImage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#fff',
                        background: reportStatusColors[selectedImage.reportStatus] || '#64748b',
                      }}
                    >
                      {selectedImage.reportStatus}
                    </span>
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                      {selectedImage.submittedAt ? new Date(selectedImage.submittedAt).toLocaleString() : 'Submission date unavailable'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAnalysisResult(null)
                      setEmailSuccessMessage('')
                      setReportPreview(null)
                      analyzeMutation.mutate(selectedImage.url)
                    }}
                    disabled={analyzeMutation.isPending || analyzeAverageMutation.isPending || sendReportMutation.isPending || previewReportMutation.isPending}
                    style={{
                      padding: '10px 16px',
                      background:
                        analyzeMutation.isPending || analyzeAverageMutation.isPending || sendReportMutation.isPending || previewReportMutation.isPending
                          ? '#94a3b8'
                          : '#0ea5e9',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      cursor:
                        analyzeMutation.isPending || analyzeAverageMutation.isPending || sendReportMutation.isPending || previewReportMutation.isPending
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {analyzeMutation.isPending ? 'Running AI check...' : 'Test AI on this image'}
                  </button>
                  <button
                    onClick={() => {
                      setAnalysisResult(null)
                      setEmailSuccessMessage('')
                      setReportPreview(null)
                      analyzeAverageMutation.mutate(site.id)
                    }}
                    disabled={
                      analyzeMutation.isPending ||
                      analyzeAverageMutation.isPending ||
                      sendReportMutation.isPending ||
                      previewReportMutation.isPending ||
                      siteImages.length === 0
                    }
                    style={{
                      padding: '10px 16px',
                      background:
                        analyzeMutation.isPending ||
                        analyzeAverageMutation.isPending ||
                        sendReportMutation.isPending ||
                        previewReportMutation.isPending ||
                        siteImages.length === 0
                          ? '#cbd5e1'
                          : '#0f766e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      cursor:
                        analyzeMutation.isPending ||
                        analyzeAverageMutation.isPending ||
                        sendReportMutation.isPending ||
                        previewReportMutation.isPending ||
                        siteImages.length === 0
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {analyzeAverageMutation.isPending ? 'Calculating average...' : 'Average all site images'}
                  </button>
                  <button
                    onClick={() => {
                      setEmailSuccessMessage('')
                      previewReportMutation.mutate(site.id)
                    }}
                    disabled={
                      analyzeMutation.isPending ||
                      analyzeAverageMutation.isPending ||
                      sendReportMutation.isPending ||
                      previewReportMutation.isPending ||
                      siteImages.length === 0
                    }
                    style={{
                      padding: '10px 16px',
                      background:
                        analyzeMutation.isPending ||
                        analyzeAverageMutation.isPending ||
                        sendReportMutation.isPending ||
                        previewReportMutation.isPending ||
                        siteImages.length === 0
                          ? '#cbd5e1'
                          : '#7c3aed',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      cursor:
                        analyzeMutation.isPending ||
                        analyzeAverageMutation.isPending ||
                        sendReportMutation.isPending ||
                        previewReportMutation.isPending ||
                        siteImages.length === 0
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {previewReportMutation.isPending ? 'Preparing report...' : 'Preview safety report'}
                  </button>
                  <button
                    onClick={() => {
                      setEmailSuccessMessage('')
                      sendReportMutation.mutate(site.id)
                    }}
                    disabled={
                      analyzeMutation.isPending ||
                      analyzeAverageMutation.isPending ||
                      sendReportMutation.isPending ||
                      previewReportMutation.isPending ||
                      siteImages.length === 0 ||
                      !reportPreview
                    }
                    style={{
                      padding: '10px 16px',
                      background:
                        analyzeMutation.isPending ||
                        analyzeAverageMutation.isPending ||
                        sendReportMutation.isPending ||
                        previewReportMutation.isPending ||
                        siteImages.length === 0 ||
                        !reportPreview
                          ? '#cbd5e1'
                          : '#0f172a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      cursor:
                        analyzeMutation.isPending ||
                        analyzeAverageMutation.isPending ||
                        sendReportMutation.isPending ||
                        previewReportMutation.isPending ||
                        siteImages.length === 0 ||
                        !reportPreview
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {sendReportMutation.isPending ? 'Emailing report...' : 'Send previewed report to director'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
              {siteImages.map((image) => {
                const isActive = selectedImage?.url === image.url
                return (
                  <button
                    key={image.url}
                    onClick={() => {
                      setSelectedImage(image)
                      setAnalysisResult(null)
                    }}
                    style={{
                      padding: 0,
                      borderRadius: 12,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: isActive ? '2px solid #0ea5e9' : '1px solid #cbd5e1',
                      background: '#fff',
                    }}
                  >
                    <ProtectedImage
                      attachmentUrl={image.url}
                      alt="Site thumbnail"
                      style={{ width: '100%', height: 96, objectFit: 'cover', display: 'block' }}
                    />
                  </button>
                )
              })}
              {siteImages.length === 0 && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: 16,
                    borderRadius: 12,
                    border: '1px dashed #cbd5e1',
                    color: '#94a3b8',
                    textAlign: 'center',
                    background: '#f8fafc',
                  }}
                >
                  No site images have been submitted for this site yet.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, background: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 12 }}>Site Details</div>
              <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
                <div><span style={{ color: '#64748b' }}>Status:</span> <span style={{ color: statusColors[site.status] || '#0f172a', fontWeight: 700 }}>{site.status}</span></div>
                <div><span style={{ color: '#64748b' }}>Budget Planned:</span> {site.budgetPlanned || '-'}</div>
                <div><span style={{ color: '#64748b' }}>Start Date:</span> {site.startDate ? new Date(site.startDate).toLocaleDateString() : '-'}</div>
                <div><span style={{ color: '#64748b' }}>End Date:</span> {site.endDate ? new Date(site.endDate).toLocaleDateString() : '-'}</div>
                <div><span style={{ color: '#64748b' }}>Available Site Images:</span> {siteImages.length}</div>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, background: '#f8fafc' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 12 }}>AI PPE Result</div>
              {analyzeMutation.isError ? (
                <div style={{ color: '#b91c1c', fontSize: 14 }}>
                  {(analyzeMutation.error as Error).message || 'Failed to analyze image'}
                </div>
              ) : null}
              {analyzeAverageMutation.isError ? (
                <div style={{ color: '#b91c1c', fontSize: 14 }}>
                  {(analyzeAverageMutation.error as Error).message || 'Failed to analyze site average'}
                </div>
              ) : null}
              {sendReportMutation.isError ? (
                <div style={{ color: '#b91c1c', fontSize: 14 }}>
                  {(sendReportMutation.error as Error).message || 'Failed to email safety report'}
                </div>
              ) : null}
              {previewReportMutation.isError ? (
                <div style={{ color: '#b91c1c', fontSize: 14 }}>
                  {(previewReportMutation.error as Error).message || 'Failed to prepare safety report preview'}
                </div>
              ) : null}
              {emailSuccessMessage ? (
                <div style={{ color: '#166534', fontSize: 14, fontWeight: 600 }}>
                  {emailSuccessMessage}
                </div>
              ) : null}
              {analysisResult ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      background: analysisResult.analysis.ppe_compliance_percent >= 80 ? '#dcfce7' : '#fef3c7',
                      color: '#0f172a',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                      {analysisResult.mode === 'site-average'
                        ? `Average compliance across ${analysisResult.imageCount} image${analysisResult.imageCount === 1 ? '' : 's'}`
                        : 'Compliance score for selected image'}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                      {analysisResult.analysis.ppe_compliance_percent}%
                    </div>
                  </div>
                  {analysisResult.mode === 'image' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                      <MetricCard label="Persons" value={analysisResult.analysis.persons} />
                      <MetricCard label="Helmets" value={analysisResult.analysis.helmets} />
                      <MetricCard label="Vests" value={analysisResult.analysis.vests} />
                      <MetricCard label="No Helmet" value={analysisResult.analysis.no_helmet} danger />
                      <MetricCard label="No Vest" value={analysisResult.analysis.no_vest} danger />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
                  Select a submitted site image, then run the AI check to inspect helmets and safety vests for workers on this site.
                </div>
              )}
            </div>

            {reportPreview ? (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, background: '#fff' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 12 }}>Safety Report Preview</div>
                <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
                  <div><span style={{ color: '#64748b' }}>Director:</span> {reportPreview.director.name} ({reportPreview.director.email})</div>
                  <div><span style={{ color: '#64748b' }}>Compliance Score:</span> {reportPreview.report.complianceScore}%</div>
                  <div><span style={{ color: '#64748b' }}>Risk Level:</span> {reportPreview.report.riskLevel}</div>
                  <div><span style={{ color: '#64748b' }}>Images Used:</span> {reportPreview.report.imageCount}</div>
                  <div>
                    <div style={{ color: '#64748b', marginBottom: 6 }}>Summary:</div>
                    <div style={{ lineHeight: 1.6, color: '#0f172a' }}>{reportPreview.report.summary}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', marginBottom: 6 }}>Recommendations:</div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#0f172a', lineHeight: 1.6 }}>
                      {reportPreview.report.recommendations.map((recommendation) => (
                        <li key={recommendation}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: danger ? '#fff1f2' : '#fff',
        border: `1px solid ${danger ? '#fecdd3' : '#e2e8f0'}`,
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{value}</div>
    </div>
  )
}

export default function AssignedSitesView() {
  const [selectedSite, setSelectedSite] = useState<ProjectItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['qhse-assigned-sites'],
    queryFn: getQhseAssignedSites,
    refetchInterval: 10000,
  })

  const sites: ProjectItem[] = Array.isArray(data) ? data : []
  const filtered = useMemo(
    () =>
      sites.filter((site) => {
        const query = searchTerm.trim().toLowerCase()
        if (!query) return true
        return (
          site.name?.toLowerCase().includes(query) ||
          site.code?.toLowerCase().includes(query) ||
          site.siteAddress?.toLowerCase().includes(query)
        )
      }),
    [searchTerm, sites],
  )

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 10px 30px rgba(15,23,42,0.06)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#0f172a' }}>Assigned Sites</div>
            <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
              Open a site to review submitted images and test PPE detection for helmets and vests.
            </div>
          </div>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {filtered.length} site{filtered.length === 1 ? '' : 's'}
          </div>
        </div>

        <input
          type="text"
          placeholder="Search by name, code, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            marginBottom: 16,
            border: '1px solid #dbe4ee',
            borderRadius: 10,
            fontSize: 14,
            outline: 'none',
          }}
        />

        {isLoading ? (
          <div style={{ padding: 20, color: '#64748b' }}>Loading assigned sites...</div>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#334155', background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: 10 }}>Name</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Code</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Images</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Budget</th>
                <th style={{ textAlign: 'center', padding: 10 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((site) => (
                <tr key={site.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 10 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{site.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{site.siteAddress || 'No address provided'}</div>
                  </td>
                  <td style={{ padding: 10 }}>{site.code}</td>
                  <td style={{ padding: 10 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: statusColors[site.status] || '#e2e8f0',
                        color: '#fff',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {site.status}
                    </span>
                  </td>
                  <td style={{ padding: 10, color: '#0f172a', fontWeight: 600 }}>{site.siteImages?.length || 0}</td>
                  <td style={{ padding: 10 }}>{site.budgetPlanned || '-'}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedSite(site)}
                      style={{
                        padding: '8px 14px',
                        background: '#0ea5e9',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Open Site
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 24, color: '#94a3b8', textAlign: 'center' }}>
                    No assigned sites matched your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedSite ? <SiteDetailModal site={selectedSite} onClose={() => setSelectedSite(null)} /> : null}
    </>
  )
}
