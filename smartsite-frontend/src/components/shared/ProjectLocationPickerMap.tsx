import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Search, MapPin, Loader2, Target, Crosshair } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

type ProjectLocationPickerMapProps = {
  latitude?: number | null
  longitude?: number | null
  onSelect: (coords: { lat: number; lng: number }) => void
}

const defaultCenter: [number, number] = [36.8065, 10.1815]

// --- Professional SVG Marker ---
const createCustomPin = (isActive: boolean) => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#075B7A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); margin-bottom: -10px; position: relative; z-index: 2;">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <div class="${isActive ? 'map-marker-pulse' : ''}" style="width: 12px; height: 12px; border-radius: 50%; background: #0ea5e9; z-index: 1; margin-bottom: 2px;"></div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 38],
  })
}

// --- Internal Helper: Map Controller ---
function MapController({ latitude, longitude }: { latitude?: number | null, longitude?: number | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (latitude && longitude) {
      map.flyTo([latitude, longitude], 15, {
        duration: 1.5,
        easeLinearity: 0.25
      })
    }
  }, [latitude, longitude, map])

  return null
}

// --- Internal Helper: Interaction Handler ---
function LocationSelector({ onSelect }: { onSelect: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(event) {
      onSelect({
        lat: Number(event.latlng.lat.toFixed(7)),
        lng: Number(event.latlng.lng.toFixed(7)),
      })
    },
  })
  return null
}

export default function ProjectLocationPickerMap({
  latitude,
  longitude,
  onSelect,
}: ProjectLocationPickerMapProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  
  const hasLocation = typeof latitude === 'number' && typeof longitude === 'number'
  const center: [number, number] = hasLocation ? [latitude as number, longitude as number] : defaultCenter

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data && data[0]) {
        onSelect({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        })
      }
    } catch (err) {
      console.error('Geocoding error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleLocateMe = () => {
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelect({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setIsLocating(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        setIsLocating(false)
      }
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
      {/* Dynamic Floating Controls */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        {/* Search Bar - Glassmorphism */}
        <form 
          onSubmit={handleSearch}
          className="map-glass-control"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 16px',
            flex: 1,
            pointerEvents: 'auto',
            minHeight: '48px'
          }}
        >
          {isSearching ? (
            <Loader2 className="animate-spin" style={{ width: '18px', height: '18px', color: '#075B7A', marginRight: '8px' }} />
          ) : (
            <Search style={{ width: '18px', height: '18px', color: '#075B7A', marginRight: '8px' }} />
          )}
          <input
            type="text"
            placeholder="Search for an address or place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '14px',
              color: '#1e293b'
            }}
          />
        </form>

        {/* Locate Me Button */}
        <button
          onClick={handleLocateMe}
          className="map-glass-control"
          title="Detect my location"
          style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 'none',
            pointerEvents: 'auto',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isLocating ? (
            <Loader2 className="animate-spin" style={{ width: '20px', height: '20px', color: '#0ea5e9' }} />
          ) : (
            <Crosshair style={{ width: '20px', height: '20px', color: '#0ea5e9' }} />
          )}
        </button>
      </div>

      {/* Coordinate Overlay */}
      {hasLocation && (
        <div 
          className="map-glass-control"
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            zIndex: 1000,
            padding: '8px 12px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#075B7A',
            letterSpacing: '0.05em',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Target style={{ width: '12px', height: '12px' }} />
          <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={hasLocation ? 14 : 7}
        zoomControl={true}
        style={{ height: '420px', width: '100%', background: '#f1f5f9' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <MapController latitude={latitude} longitude={longitude} />
        <LocationSelector onSelect={onSelect} />
        
        {hasLocation && (
          <Marker
            position={[latitude as number, longitude as number]}
            icon={createCustomPin(true)}
          />
        )}
      </MapContainer>

      {/* Instruction Overlay when no location */}
      {!hasLocation && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 1000,
          background: 'rgba(7, 91, 122, 0.9)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <MapPin style={{ width: '14px', height: '14px' }} />
          Click anywhere on the map to set project location
        </div>
      )}
    </div>
  )
}
