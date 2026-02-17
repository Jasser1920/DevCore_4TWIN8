import { Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import RoleHome from './pages/RoleHome'
import SuperAdmin from './pages/SuperAdmin'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute requireRole="SUPER_ADMIN">
            <SuperAdmin />
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
