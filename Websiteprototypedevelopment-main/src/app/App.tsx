import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { SuperAdminDashboard } from './components/dashboards/SuperAdminDashboard';
import { DirectorDashboard } from './components/dashboards/DirectorDashboard';
import { ProjectManagerDashboard } from './components/dashboards/ProjectManagerDashboard';
import { QHSEDashboard } from './components/dashboards/QHSEDashboard';
import { ClientDashboard } from './components/dashboards/ClientDashboard';
import { CompaniesPage } from './components/pages/CompaniesPage';
import { PhotosPage } from './components/pages/PhotosPage';
import { InspectionsPage } from './components/pages/InspectionsPage';
import { mockAlerts } from './data/mockData';

const AppContent: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const unreadAlerts = mockAlerts.filter(a => !a.read).length;

  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={login} />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'director':
        return <DirectorDashboard />;
      case 'project_manager':
        return <ProjectManagerDashboard />;
      case 'qhse_manager':
        return <QHSEDashboard />;
      case 'client':
        return <ClientDashboard />;
      default:
        return <div>Dashboard not configured for this role</div>;
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return renderDashboard();
      case 'companies':
        return <CompaniesPage />;
      case 'photos':
        return <PhotosPage />;
      case 'inspections':
        return <InspectionsPage />;
      case 'users':
        return (
          <div className="space-y-6">
            <h2>User Management</h2>
            <p className="text-gray-500">User management interface - Coming soon in Sprint 1</p>
          </div>
        );
      case 'projects':
        return (
          <div className="space-y-6">
            <h2>Projects</h2>
            <p className="text-gray-500">Project management interface - Coming soon in Sprint 2</p>
          </div>
        );
      case 'sites':
        return (
          <div className="space-y-6">
            <h2>Construction Sites</h2>
            <p className="text-gray-500">Site management interface - Coming soon in Sprint 1</p>
          </div>
        );
      case 'budget':
        return (
          <div className="space-y-6">
            <h2>Budget & Financial KPIs</h2>
            <p className="text-gray-500">Budget tracking interface - Coming soon in Sprint 2</p>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <h2>Reports</h2>
            <p className="text-gray-500">Report generation interface - Coming soon in Sprint 2</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <h2>Platform Analytics</h2>
            <p className="text-gray-500">Analytics dashboard - Coming soon in Sprint 3</p>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h2>Settings</h2>
            <p className="text-gray-500">System settings - Coming soon in Sprint 1</p>
          </div>
        );
      case 'incidents':
        return (
          <div className="space-y-6">
            <h2>Incident Management</h2>
            <p className="text-gray-500">Incident tracking - Coming soon in Sprint 2</p>
          </div>
        );
      case 'safety-analytics':
        return (
          <div className="space-y-6">
            <h2>Safety Analytics</h2>
            <p className="text-gray-500">Safety KPI dashboard - Coming soon in Sprint 3</p>
          </div>
        );
      case 'my-projects':
        return (
          <div className="space-y-6">
            <h2>My Projects</h2>
            <p className="text-gray-500">Client project view - Coming soon in Sprint 2</p>
          </div>
        );
      case 'milestones':
        return (
          <div className="space-y-6">
            <h2>Milestones</h2>
            <p className="text-gray-500">Milestone tracking - Coming soon in Sprint 3</p>
          </div>
        );
      case 'alerts':
        return (
          <div className="space-y-6">
            <h2>Alerts & Notifications</h2>
            <div className="grid gap-4">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'high'
                      ? 'bg-orange-50 border-orange-200'
                      : alert.severity === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm mb-1">{alert.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">{alert.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!alert.read && (
                      <div className="h-2 w-2 bg-red-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <Layout
      user={user}
      onLogout={logout}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      unreadAlerts={unreadAlerts}
    >
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
