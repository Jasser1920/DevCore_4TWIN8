import { useNavigate } from 'react-router-dom'
import { getAccessToken, getRolesFromToken, getBusinessRoles } from '../../lib/auth'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Activity, 
  Settings
} from '../../components/shared/icons/NavigationIcons'

export function useRoleBasedNavigation() {
  const navigate = useNavigate()
  const tokenRoles = getRolesFromToken(getAccessToken())
  const businessRoles = getBusinessRoles(tokenRoles)
  const userRole = businessRoles[0] || 'User'

  const getNavItems = () => {
    if (tokenRoles.includes('SUPER_ADMIN')) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'companies', label: 'Companies', icon: Building2 },
        { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    } else if (tokenRoles.includes('DIRECTOR')) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'company', label: 'Company', icon: Building2 },
        { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    } else if (tokenRoles.includes('PROJECT_MANAGER')) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects', icon: Building2 },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    } else if (tokenRoles.includes('QHSE_MANAGER')) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    } else if (tokenRoles.includes('CLIENT')) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    }

    return []
  }

  const handlePageChange = (pageId: string, setCurrentPage: (page: string) => void) => {
    if (pageId === 'profile') {
      setCurrentPage('profile')
    } else if (pageId === 'dashboard') {
      // Navigate to role-specific dashboard
      if (tokenRoles.includes('SUPER_ADMIN')) {
        navigate('/superadmin')
      } else if (tokenRoles.includes('DIRECTOR')) {
        navigate('/director')
      } else if (tokenRoles.includes('PROJECT_MANAGER')) {
        navigate('/project-manager')
      } else if (tokenRoles.includes('QHSE_MANAGER')) {
        navigate('/qhse-manager')
      } else if (tokenRoles.includes('CLIENT')) {
        navigate('/client')
      }
    } else {
      // For other navigation items, navigate to the appropriate role page
      if (tokenRoles.includes('SUPER_ADMIN')) {
        navigate('/superadmin')
      } else if (tokenRoles.includes('DIRECTOR')) {
        navigate('/director')
      } else if (tokenRoles.includes('PROJECT_MANAGER')) {
        navigate('/project-manager')
      } else if (tokenRoles.includes('QHSE_MANAGER')) {
        navigate('/qhse-manager')
      } else if (tokenRoles.includes('CLIENT')) {
        navigate('/client')
      }
    }
  }

  return {
    navItems: getNavItems(),
    handlePageChange,
    userRole,
    businessRoles,
    tokenRoles,
  }
}
