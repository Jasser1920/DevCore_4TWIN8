
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { apiFetch } from '../../lib/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

function formatPercent(value: number) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0
  return `${amount.toFixed(2)}%`
}
function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

// Fetch construction sites for the MiniMap
const useDirectorSites = () => {
  return useQuery({
    queryKey: ['director-construction-sites-map'],
    queryFn: () => apiFetch<any[]>('/projects/director/construction-sites-map'),
    refetchInterval: 10000,
  });
};
export default function Dashboard() {
  // Fetch construction sites for the MiniMap

  // Defensive: always use an array for sites
  const {
    data: sitesRaw,
    isLoading: showSitesLoading,
    isError: sitesError,
    error: sitesErrorObj,
  } = useDirectorSites() as { data: any; isLoading: boolean; isError: boolean; error: any };
  // Handle possible API response shapes
  const sites: any[] = Array.isArray(sitesRaw)
    ? sitesRaw
    : (sitesRaw && Array.isArray(sitesRaw.data))
      ? sitesRaw.data
      : [];

  const MiniMap = () => {
    const jitteredSites = useMemo(() => {
      const coordinateMap = new Map<string, number>();
      const JITTER_AMOUNT = 0.00015;
      
      return sites.map((site) => {
        let lat = Number(site.latitude) || 36.8065;
        let lng = Number(site.longitude) || 10.1815;
        
        const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        const count = coordinateMap.get(key) || 0;
        coordinateMap.set(key, count + 1);
        
        if (count > 0) {
          const angle = count * 0.8; 
          const radius = JITTER_AMOUNT * (1 + count * 0.2);
          lat += Math.cos(angle) * radius;
          lng += Math.sin(angle) * radius;
        }
        
        return { ...site, latitude: lat, longitude: lng };
      });
    }, [sites]);

    const mapCenter = useMemo<[number, number]>(() => {
      const defaultCenter: [number, number] = [36.8065, 10.1815];
      if (!jitteredSites.length) return defaultCenter;
      const latAvg = jitteredSites.reduce((sum: number, s: any) => sum + (s.latitude || 0), 0) / jitteredSites.length;
      const lngAvg = jitteredSites.reduce((sum: number, s: any) => sum + (s.longitude || 0), 0) / jitteredSites.length;
      return [Number(latAvg.toFixed(7)), Number(lngAvg.toFixed(7))];
    }, [jitteredSites]);
    const statusColor: Record<string, string> = {
      APPROVED: '#0ea5e9',
      ACTIVE: '#16a34a',
      REJECTED: '#dc2626',
      DRAFT: '#6b7280',
      SUBMITTED_FOR_VALIDATION: '#d97706',
    };
    return (
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', marginTop: 24, padding: 24, width: '100%', maxWidth: '100%' }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Active Construction Sites Map</div>
        {showSitesLoading && <div>Loading map...</div>}
        {sitesError && (
          <div style={{ color: '#b91c1c', fontSize: 14 }}>
            Error fetching sites: {sitesErrorObj instanceof Error ? sitesErrorObj.message : 'Unknown error'}
          </div>
        )}
        {!showSitesLoading && !sitesError && (
          <MapContainer
            center={mapCenter}
            zoom={sites.length ? 8 : 6}
            style={{ height: 340, width: '100%', borderRadius: 12, overflow: 'hidden' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            {jitteredSites.map((site: any, idx: number) => (
              <CircleMarker
                key={site.id || idx}
                center={[site.latitude, site.longitude]}
                radius={8}
                pathOptions={{
                  color: statusColor[site.status as keyof typeof statusColor] || '#0f172a',
                  fillColor: statusColor[site.status as keyof typeof statusColor] || '#0f172a',
                  fillOpacity: 0.85,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{site.name}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{site.code}</div>
                    <div style={{ fontSize: 12, marginTop: 8 }}>Status: {site.status}</div>
                    {site.siteAddress && <div style={{ fontSize: 12, marginTop: 6 }}>Address: {site.siteAddress}</div>}
                    <div style={{ fontSize: 12, marginTop: 6, color: '#334155' }}>{site.latitude?.toFixed(6)}, {site.longitude?.toFixed(6)}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>
    );
  };

  // Fetch active projects overview
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['director-active-overview'],
    queryFn: () => apiFetch<any>('/projects/director/active-overview?page=1&pageSize=100'),
    refetchInterval: 5000,
  })

  // Fetch all milestones for upcoming milestones section
  const { data: allMilestonesData, isLoading: milestonesLoading } = useQuery({
    queryKey: ['director-all-milestones'],
    queryFn: () => apiFetch<any>('/projects/director/all-milestones?page=1&pageSize=200'),
    refetchInterval: 10000,
  })

  // Top Projects by Budget Consumption
  const topBudgetProjects = useMemo(() => {
    if (!overviewData?.data) return [];
    return [...overviewData.data]
      .sort((a, b) => (b.budgetConsumptionPercent ?? 0) - (a.budgetConsumptionPercent ?? 0))
      .slice(0, 5);
  }, [overviewData]);

  // Upcoming Milestones
  const upcomingMilestones = useMemo(() => {
    if (!allMilestonesData?.data) return [];
    return [...allMilestonesData.data]
      .filter((m) => m.plannedDate && new Date(m.plannedDate) > new Date())
      .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())
      .slice(0, 5);
  }, [allMilestonesData]);

  // Fetch validation queue
  const { data: validationData, isLoading: validationLoading } = useQuery({
    queryKey: ['director-validation-queue'],
    queryFn: () => apiFetch<any[]>('/projects/director/validation-queue'),
    refetchInterval: 5000,
  })

  // Calculate stats
  const statusStats = useMemo(() => {
    if (!overviewData?.data) return []
    const counts: Record<string, number> = {}
    for (const p of overviewData.data) {
      counts[p.status] = (counts[p.status] || 0) + 1
    }
    return Object.entries(counts).map(([status, value]) => ({ name: status, value }))
  }, [overviewData])

  const riskStats = useMemo(() => {
    if (!overviewData?.data) return []
    const counts: Record<string, number> = {}
    for (const p of overviewData.data) {
      counts[p.risk] = (counts[p.risk] || 0) + 1
    }
    return Object.entries(counts).map(([risk, value]) => ({ name: risk, value }))
  }, [overviewData])

  const COLORS = ['#148ABB', '#22c55e', '#f59e42', '#ef4444', '#6366f1', '#eab308']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {/* Project Status Pie */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', minWidth: 320, flex: 1, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Projects by Status</div>
          {overviewLoading ? 'Loading...' : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {statusStats.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Project Risk Pie */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', minWidth: 320, flex: 1, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Projects by Risk</div>
          {overviewLoading ? 'Loading...' : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {riskStats.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Validation Queue Stat */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', minWidth: 220, flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Pending Validations</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#ef4444' }}>
            {validationLoading ? '...' : (validationData?.length ?? 0)}
          </div>
        </div>
        <MiniMap />
      </div>

      {/* --- Analytics Sections --- */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 24 }}>
        {/* Top Projects by Budget Consumption */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', minWidth: 320, flex: 1, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Top Projects by Budget Consumption</div>
          {overviewLoading ? 'Loading...' : (
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#334155', background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Project</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Code</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Budget %</th>
                </tr>
              </thead>
              <tbody>
                {topBudgetProjects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: 8 }}>{p.name}</td>
                    <td style={{ padding: 8 }}>{p.code}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{formatPercent(p.budgetConsumptionPercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Upcoming Milestones */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', minWidth: 320, flex: 1, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Upcoming Milestones</div>
          {milestonesLoading ? 'Loading...' : (
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#334155', background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Project</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Milestone</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Planned Date</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingMilestones.map((m) => (
                  <tr key={m.id}>
                    <td style={{ padding: 8 }}>{m.projectName || '-'}</td>
                    <td style={{ padding: 8 }}>{m.name}</td>
                    <td style={{ padding: 8 }}>{formatDate(m.plannedDate)}</td>
                    <td style={{ padding: 8 }}>{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
