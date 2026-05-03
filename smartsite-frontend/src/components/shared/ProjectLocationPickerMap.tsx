import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'

type ProjectLocationPickerMapProps = {
  latitude?: number | null
  longitude?: number | null
  onSelect: (coords: { lat: number; lng: number }) => void
}

const defaultCenter: [number, number] = [36.8065, 10.1815]

function LocationSelector({
  onSelect,
}: {
  onSelect: (coords: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
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
  const hasLocation = typeof latitude === 'number' && typeof longitude === 'number'
  const center: [number, number] = hasLocation
    ? [latitude as number, longitude as number]
    : defaultCenter
  return (
    <MapContainer
      center={center}
      zoom={hasLocation ? 14 : 7}
      style={{ height: '360px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <LocationSelector onSelect={onSelect} />
      {hasLocation && (
        <CircleMarker
          center={[latitude as number, longitude as number]}
          radius={10}
          pathOptions={{ color: '#0369a1', fillColor: '#0ea5e9', fillOpacity: 0.85 }} />
      )}
    </MapContainer>

  )
}
