import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { HardHat, Camera, Clock, AlertCircle } from 'lucide-react';
import { mockProjects, mockSites, mockAlerts } from '../../data/mockData';

export const ProjectManagerDashboard: React.FC = () => {
  const myProjects = mockProjects.filter(p => p.companyId === '1');
  const mySites = mockSites.filter(s => 
    myProjects.some(p => p.id === s.projectId)
  );
  const activeSites = mySites.filter(s => s.status === 'active').length;
  const totalIssues = mySites.reduce((sum, s) => sum + s.issues, 0);
  const criticalAlerts = mockAlerts.filter(a => 
    a.severity === 'critical' && !a.read
  ).length;

  const stats = [
    {
      title: 'Active Sites',
      value: activeSites,
      description: `Out of ${mySites.length} total`,
      icon: HardHat,
      color: 'text-[#075B7A]',
      bgColor: 'bg-[#CAEDF1]',
    },
    {
      title: 'Open Issues',
      value: totalIssues,
      description: 'Across all sites',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Photos This Week',
      value: 24,
      description: 'Uploaded and analyzed',
      icon: Camera,
      color: 'text-[#148ABB]',
      bgColor: 'bg-[#CAEDF1]',
    },
    {
      title: 'Critical Alerts',
      value: criticalAlerts,
      description: 'Require immediate action',
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">{stat.title}</CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Projects */}
      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
          <CardDescription>Active construction projects you're managing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myProjects.map((project) => {
              const projectSites = mySites.filter(s => s.projectId === project.id);
              return (
                <div
                  key={project.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#148ABB] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm mb-1">{project.name}</h3>
                      <p className="text-xs text-gray-500">{project.location}</p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                      {projectSites.length} sites
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Overall Progress</span>
                      <span className="text-[#075B7A]">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#075B7A] h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sites Status */}
      <Card>
        <CardHeader>
          <CardTitle>Sites Status</CardTitle>
          <CardDescription>Current status of all construction sites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mySites.map((site) => {
              const project = myProjects.find(p => p.id === site.projectId);
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'active':
                    return 'bg-green-100 text-green-700';
                  case 'delayed':
                    return 'bg-red-100 text-red-700';
                  case 'completed':
                    return 'bg-blue-100 text-blue-700';
                  default:
                    return 'bg-gray-100 text-gray-700';
                }
              };

              return (
                <div
                  key={site.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#148ABB] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm mb-1">{site.name}</h3>
                      <p className="text-xs text-gray-500">{project?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(site.status)}`}>
                      {site.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Progress</p>
                      <p className="text-sm text-[#075B7A]">{site.progress}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Issues</p>
                      <p className="text-sm text-orange-600">{site.issues}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Inspection</p>
                      <p className="text-sm text-gray-900">
                        {new Date(site.lastInspection).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#075B7A] h-2 rounded-full"
                      style={{ width: `${site.progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>Important notifications requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAlerts.slice(0, 4).map((alert) => {
              const getSeverityColor = (severity: string) => {
                switch (severity) {
                  case 'critical':
                    return 'bg-red-100 border-red-200 text-red-700';
                  case 'high':
                    return 'bg-orange-100 border-orange-200 text-orange-700';
                  case 'medium':
                    return 'bg-yellow-100 border-yellow-200 text-yellow-700';
                  default:
                    return 'bg-blue-100 border-blue-200 text-blue-700';
                }
              };

              return (
                <div
                  key={alert.id}
                  className={`p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm mb-1">{alert.title}</h4>
                      <p className="text-xs">{alert.description}</p>
                    </div>
                    {!alert.read && (
                      <div className="h-2 w-2 bg-current rounded-full"></div>
                    )}
                  </div>
                  <p className="text-xs mt-2 opacity-70">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
