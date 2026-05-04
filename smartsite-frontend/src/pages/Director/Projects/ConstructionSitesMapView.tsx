import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { getDirectorConstructionSitesMap } from '../../../lib/api'
import { useResponsive } from '../../../hooks/useResponsive'
import { Status } from '../../../components/shared/UI'
import SiteWeatherInfo from './SiteWeatherInfo'

const statusColor: Record<string, string> = {
  APPROVED: '#0ea5e9',
  ACTIVE: '#16a34a',
  REJECTED: '#dc2626',
  DRAFT: '#6b7280',
  SUBMITTED_FOR_VALIDATION: '#d97706',
}

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

  const jitteredSites = useMemo(() => {
    const coordinateMap = new Map<string, number>()
    const JITTER_AMOUNT = 0.0002 // Slightly larger for the main map
    
    return sites.map((site) => {
      let lat = Number(site.latitude) || 36.8065
      let lng = Number(site.longitude) || 10.1815
      
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
      const count = coordinateMap.get(key) || 0
      coordinateMap.set(key, count + 1)
      
      if (count > 0) {
        const angle = count * 0.8
        const radius = JITTER_AMOUNT * (1 + count * 0.2)
        lat += Math.cos(angle) * radius
        lng += Math.sin(angle) * radius
      }
      
      return { ...site, latitude: lat, longitude: lng }
    })
  }, [sites])

  const mapCenter = useMemo<[number, number]>(() => {
    const defaultCenter: [number, number] = [36.8065, 10.1815];
    if (!jitteredSites.length) return defaultCenter;
    const latAvg = jitteredSites.reduce((sum: number, s: any) => sum + (s.latitude || 0), 0) / jitteredSites.length;
    const lngAvg = jitteredSites.reduce((sum: number, s: any) => sum + (s.longitude || 0), 0) / jitteredSites.length;
    return [Number(latAvg.toFixed(7)), Number(lngAvg.toFixed(7))];
  }, [jitteredSites]);

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

          {jitteredSites.map((site) => (
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
                <div style={{ minWidth: '280px', padding: '4px' }}>
                  {/* Real-time Weather Integration */}
                  <SiteWeatherInfo latitude={site.latitude} longitude={site.longitude} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{site.name}</div>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: site.risk === 'HIGH' ? '#fef2f2' : site.risk === 'MEDIUM' ? '#fffbeb' : '#f0fdf4',
                      color: site.risk === 'HIGH' ? '#dc2626' : site.risk === 'MEDIUM' ? '#d97706' : '#16a34a',
                      fontWeight: 700,
                      border: `1px solid ${site.risk === 'HIGH' ? '#fecaca' : site.risk === 'MEDIUM' ? '#fde68a' : '#bcf0da'}`
                    }}>
                      {site.risk} RISK
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{site.code}</span>
                    <Status
                      type={getSiteStatusTone(site.status)}
                      label={getSiteStatusLabel(site.status)}
                      size="small"
                      icon={false}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Budget Consumption</span>
                      <span style={{ fontWeight: 700, color: site.budgetConsumptionPercent > 90 ? '#dc2626' : '#0f172a' }}>
                        {site.budgetConsumptionPercent}%
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${Math.min(site.budgetConsumptionPercent, 100)}%`, 
                        backgroundColor: site.budgetConsumptionPercent > 90 ? '#ef4444' : '#148ABB',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '3px', color: '#64748b' }}>
                      <span>{site.budgetConsumed.toLocaleString()} {site.currency}</span>
                      <span>of {site.budgetPlanned.toLocaleString()} {site.currency}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Overall Progress</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{site.progressPercent}%</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${site.progressPercent}%`, 
                        backgroundColor: '#16a34a',
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px', marginBottom: '12px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Start Date</div>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{new Date(site.startDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>End Date</div>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{new Date(site.endDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Project Manager</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{site.projectManagerName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{site.projectManagerEmail}</div>
                  </div>

                  {site.siteAddress && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569', fontStyle: 'italic', display: 'flex', gap: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>📍</span> {site.siteAddress}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
