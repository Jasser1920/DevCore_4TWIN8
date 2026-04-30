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
<<<<<<< Updated upstream
import { resolveNotificationRoute, type AppRole } from './lib/notificationRoutes'


=======
import { resolveNotificationRoute, defaultRouteByRole, type AppRole } from './lib/notificationRoutes'
import SiteBrainChatbot from './components/SiteBrainChatbot'
>>>>>>> Stashed changes

function App() {
  const [toast, setToast] = useState<{
    message: string
    onClick: () => void
  } | null>(null)
  const navigate = useNavigate()

  // Callback to show toast when a new notification arrives
  const handleNewNotification = useCallback((item: any, role: AppRole) => {
    setToast({
      message: item.title + (item.message ? ': ' + item.message : ''),
      onClick: () => {
        const target = resolveNotificationRoute(item, role)
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
          message={toast.message}
          onClick={toast.onClick}
          onClose={() => setToast(null)}
        />
      )}
      <SiteBrainChatbot />
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

