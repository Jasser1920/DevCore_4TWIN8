import React, { ReactNode } from 'react';
import { User, UserRole } from '../types';
import {
  Building2,
  LayoutDashboard,
  Users,
  FolderKanban,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  Bell,
  HardHat,
  Camera,
  BarChart3,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface LayoutProps {
  user: User;
  children: ReactNode;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadAlerts: number;
}

const getNavigationItems = (role: UserRole) => {
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  switch (role) {
    case 'super_admin':
      return [
        ...baseItems,
        { id: 'companies', label: 'Companies', icon: Building2 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    case 'director':
      return [
        ...baseItems,
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'budget', label: 'Budget & KPIs', icon: BarChart3 },
        { id: 'reports', label: 'Reports', icon: FileText },
      ];
    case 'project_manager':
      return [
        ...baseItems,
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'sites', label: 'Sites', icon: HardHat },
        { id: 'photos', label: 'Site Photos', icon: Camera },
        { id: 'reports', label: 'Reports', icon: FileText },
      ];
    case 'qhse_manager':
      return [
        ...baseItems,
        { id: 'inspections', label: 'Inspections', icon: AlertTriangle },
        { id: 'incidents', label: 'Incidents', icon: FileText },
        { id: 'safety-analytics', label: 'Safety Analytics', icon: BarChart3 },
      ];
    case 'client':
      return [
        ...baseItems,
        { id: 'my-projects', label: 'My Projects', icon: FolderKanban },
        { id: 'milestones', label: 'Milestones', icon: FileText },
        { id: 'photos', label: 'Progress Photos', icon: Camera },
      ];
    default:
      return baseItems;
  }
};

const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    director: 'Director',
    project_manager: 'Project Manager',
    qhse_manager: 'QHSE Manager',
    client: 'Client',
  };
  return labels[role];
};

export const Layout: React.FC<LayoutProps> = ({
  user,
  children,
  onLogout,
  currentPage,
  onNavigate,
  unreadAlerts,
}) => {
  const navItems = getNavigationItems(user.role);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-[#075B7A] text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#064d66]">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
              <HardHat className="h-6 w-6 text-[#075B7A]" />
            </div>
            <span className="text-xl" style={{ fontFamily: 'var(--font-family-heading)' }}>SmartSite</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#148ABB] text-white'
                    : 'text-[#CAEDF1] hover:bg-[#064d66] hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#064d66]">
          <div className="mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-[#148ABB] flex items-center justify-center">
                <span className="text-sm">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{user.name}</p>
                <p className="text-xs text-[#CAEDF1]">{getRoleLabel(user.role)}</p>
              </div>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start text-[#CAEDF1] hover:bg-[#064d66] hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">
                {navItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user.name.split(' ')[0]}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => onNavigate('alerts')}
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadAlerts > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-xs">
                    {unreadAlerts}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
