import { Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import Profile from './pages/Profile'
import RoleHome from './pages/RoleHome'
import SuperAdmin from './pages/SuperAdmin/index'
import Director from './pages/Director/index'
import ProjectManager from './pages/ProjectManager'
import QhseManager from './pages/QhseManager'
import Client from './pages/Client'
import { VerifyEmail } from './pages/VerifyEmail'

function App() {
  return (
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
        path="/qhse-manager"
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
        path="/role"
        element={
          <ProtectedRoute>
            <RoleHome />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
