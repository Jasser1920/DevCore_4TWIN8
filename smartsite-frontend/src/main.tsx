import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import './styles/responsive.css'
import App from './App'
import { useTokenRefresh } from './hooks/useTokenRefresh'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import SkipToContent from './components/shared/SkipToContent'

const queryClient = new QueryClient()

function AppWithTokenRefresh() {
  useTokenRefresh()
  return (
    <>
      <SkipToContent />
      <div id="main-content">
        <App />
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppWithTokenRefresh />
        </BrowserRouter>
      </QueryClientProvider>
    </AccessibilityProvider>
  </StrictMode>,
)
