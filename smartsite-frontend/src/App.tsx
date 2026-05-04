import { Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Accessibility from './pages/Accessibility'
import RoleHome from './pages/RoleHome'
import SuperAdmin from './pages/SuperAdmin/index'
import Director from './pages/Director/index'
import ProjectManager from './pages/ProjectManager'
import QhseManager from './pages/QhseManager'
import Client from './pages/Client'
import { VerifyEmail } from './pages/VerifyEmail'
import NotificationToast from './components/NotificationToast'
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationToast } from './hooks/useNotificationToast'
import { defaultRouteByRole, type AppRole } from './lib/notificationRoutes'

function App() {
  const [toast, setToast] = useState<{
    title: string
    description?: string
    onClick: () => void
  } | null>(null)
  const navigate = useNavigate()

  // Callback to show toast when a new notification arrives
  const handleNewNotification = useCallback((item: any, role: AppRole) => {
    setToast({
      title: item.title,
      description: item.message,
      onClick: () => {
        // Redirection to the central notifications page
        const target = defaultRouteByRole(role)
        setToast(null)
        navigate(target.path)
      },
    })
  }, [navigate])

  useNotificationToast(handleNewNotification)

  return (
    <>
      {toast && (
        <NotificationToast
          title={toast.title}
          description={toast.description}
          onClick={toast.onClick}
          onClose={() => setToast(null)}
        />
      )}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute requireRole="SUPER_ADMIN">
              <SuperAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/director"
          element={
            <ProtectedRoute requireRole="DIRECTOR">
              <Director />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager"
          element={
            <ProtectedRoute requireRole="PROJECT_MANAGER">
              <ProjectManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qhse-manager/*"
          element={
            <ProtectedRoute requireRole="QHSE_MANAGER">
              <QhseManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client"
          element={
            <ProtectedRoute requireRole="CLIENT">
              <Client />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accessibility"
          element={
            <ProtectedRoute>
              <Accessibility />
            </ProtectedRoute>
          }
        />
        <Route
          path="/role"
          element={
            <ProtectedRoute>
              <RoleHome />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App

