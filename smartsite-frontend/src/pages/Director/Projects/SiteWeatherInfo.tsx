import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, AlertCircle } from 'lucide-react'

// IMPORTANT: Replace this placeholder with your real API key from OpenWeatherMap
const OPENWEATHER_API_KEY = '' // Removed for security reasons

interface SiteWeatherInfoProps {
  latitude: number
  longitude: number
}

interface WeatherData {
  temp: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
  name: string
}

export default function SiteWeatherInfo({ latitude, longitude }: SiteWeatherInfoProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWeather() {
      if (OPENWEATHER_API_KEY === 'YOUR_API_KEY_HERE') {
        setError('Missing API Key')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Weather data unavailable')
        }

        const data = await response.json()
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          icon: data.weather[0].main,
          name: data.name
        })
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load weather')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [latitude, longitude])

  if (loading) {
    return (
      <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
        Fetching live weather...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '10px',
        backgroundColor: '#fff1f2',
        borderRadius: '8px',
        border: '1px solid #fda4af',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#be123c',
        fontSize: '11px',
        marginBottom: '12px'
      }}>
        <AlertCircle size={14} />
        {error === 'Missing API Key' ? 'Weather API Key required for live updates' : error}
      </div>
    )
  }

  if (!weather) return null

  const WeatherIcon = () => {
    switch (weather.icon) {
      case 'Clear': return <Sun size={20} color="#f59e0b" fill="#fef3c7" />
      case 'Rain': return <CloudRain size={20} color="#3b82f6" />
      case 'Clouds': return <Cloud size={20} color="#64748b" />
      default: return <Cloud size={20} color="#64748b" />
    }
  }

  return (
    <div style={{
      marginBottom: '14px',
      padding: '12px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WeatherIcon />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>
              {weather.description}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Live Site Condition</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a' }}>
          <Thermometer size={14} color="#ef4444" />
          <span style={{ fontSize: '16px', fontWeight: 800 }}>{weather.temp}°C</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'white',
          padding: '6px 8px',
          borderRadius: '6px',
          border: '1px solid #f1f5f9'
        }}>
          <Wind size={14} color="#0ea5e9" />
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>WIND</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>{weather.windSpeed} km/h</div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'white',
          padding: '6px 8px',
          borderRadius: '6px',
          border: '1px solid #f1f5f9'
        }}>
          <Droplets size={14} color="#3b82f6" />
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>HUMIDITY</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>{weather.humidity}%</div>
          </div>
        </div>
      </div>

      {weather.windSpeed > 40 && (
        <div style={{
          marginTop: '8px',
          padding: '6px',
          backgroundColor: '#fffbeb',
          borderRadius: '6px',
          border: '1px solid #fde68a',
          fontSize: '10px',
          color: '#92400e',
          display: 'flex',
          gap: '6px',
          alignItems: 'center'
        }}>
          <AlertCircle size={12} />
          <strong>High Wind Alert:</strong> Secure loose equipment.
        </div>
      )}
    </div>
  )
}
