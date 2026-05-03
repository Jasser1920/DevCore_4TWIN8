import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { getDirectorConstructionSitesMap } from '../../../lib/api'
import { useResponsive } from '../../../hooks/useResponsive'
import { Status } from '../../../components/shared/UI'

const statusColor: Record<string, string> = {
  APPROVED: '#0ea5e9',
  ACTIVE: '#16a34a',
  REJECTED: '#dc2626',
  DRAFT: '#6b7280',
  SUBMITTED_FOR_VALIDATION: '#d97706',
}

const defaultCenter: [number, number] = [36.8065, 10.1815]

function getSiteStatusLabel(status: string) {
  const labels: Record<string, string> = {
    APPROVED: 'Approved',
    ACTIVE: 'Active',
    REJECTED: 'Rejected',
    DRAFT: 'Draft',
    SUBMITTED_FOR_VALIDATION: 'Waiting for director validation',
  }

  return labels[status] || status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function getSiteStatusTone(status: string): 'success' | 'error' | 'pending' | 'warning' | 'info' {
  if (status === 'APPROVED' || status === 'ACTIVE') return 'success'
  if (status === 'REJECTED') return 'error'
  if (status === 'SUBMITTED_FOR_VALIDATION') return 'pending'
  return 'info'
}

export default function ConstructionSitesMapView() {
  const { isMobile, isTablet } = useResponsive()
  const [projectManagerId, setProjectManagerId] = useState('')

  const sitesQuery = useQuery({
    queryKey: ['director-construction-sites-map', projectManagerId],
    queryFn: () => getDirectorConstructionSitesMap(projectManagerId || undefined),
  })

  const sites = sitesQuery.data?.data || []
  const pmOptions = sitesQuery.data?.filters.projectManagers || []

  const mapCenter = useMemo<[number, number]>(() => {
    if (!sites.length) return defaultCenter

    const latAvg = sites.reduce((sum, site) => sum + site.latitude, 0) / sites.length
    const lngAvg = sites.reduce((sum, site) => sum + site.longitude, 0) / sites.length
    return [Number(latAvg.toFixed(7)), Number(lngAvg.toFixed(7))]
  }, [sites])

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 600,
            color: '#075B7A',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Construction Sites Map
        </h2>
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
          View all mapped construction projects and filter by Project Manager.
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '16px',
          display: 'grid',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ color: '#334155', fontWeight: 600, fontSize: '14px' }}>Filter by PM</label>
          <select
            value={projectManagerId}
            onChange={(event) => setProjectManagerId(event.target.value)}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '8px 10px',
              minWidth: '260px',
              backgroundColor: '#f8fafc',
            }}
          >
            <option value=''>All Project Managers</option>
            {pmOptions.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name} ({pm.email})
              </option>
            ))}
          </select>
          <span style={{ color: '#475569', fontSize: '13px' }}>Showing {sites.length} site(s)</span>
        </div>

        {sitesQuery.isLoading && <p style={{ margin: 0, color: '#6b7280' }}>Loading map data...</p>}
        {sitesQuery.isError && (
          <p style={{ margin: 0, color: '#b91c1c' }}>{(sitesQuery.error as Error).message}</p>
        )}

        <MapContainer
          center={mapCenter}
          zoom={sites.length ? 8 : 6}
          style={{ height: '560px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          {sites.map((site) => (
            <CircleMarker
              key={site.id}
              center={[site.latitude, site.longitude]}
              radius={9}
              pathOptions={{
                color: statusColor[site.status] || '#0f172a',
                fillColor: statusColor[site.status] || '#0f172a',
                fillOpacity: 0.85,
              }}
            >
              <Popup>
                <div style={{ minWidth: '220px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{site.name}</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                    {site.code} |{' '}
                    <Status
                      type={getSiteStatusTone(site.status)}
                      label={getSiteStatusLabel(site.status)}
                      size="small"
                      icon={false}
                    />
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    PM: {site.projectManagerName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155' }}>{site.projectManagerEmail}</div>
                  {site.siteAddress && (
                    <div style={{ fontSize: '12px', marginTop: '6px' }}>Address: {site.siteAddress}</div>
                  )}
                  <div style={{ fontSize: '12px', marginTop: '6px', color: '#334155' }}>
                    {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
