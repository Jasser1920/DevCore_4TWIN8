import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Building2, Users, Activity, TrendingUp } from 'lucide-react';
import { mockCompanies, mockUsers, mockProjects } from '../../data/mockData';

export const SuperAdminDashboard: React.FC = () => {
  const totalCompanies = mockCompanies.length;
  const totalUsers = mockUsers.length;
  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter(p => p.status === 'active').length;

  const stats = [
    {
      title: 'Total Companies',
      value: totalCompanies,
      description: 'Active tenants',
      icon: Building2,
      color: 'text-[#075B7A]',
      bgColor: 'bg-[#CAEDF1]',
    },
    {
      title: 'Total Users',
      value: totalUsers,
      description: 'Across all companies',
      icon: Users,
      color: 'text-[#148ABB]',
      bgColor: 'bg-[#CAEDF1]',
    },
    {
      title: 'Active Projects',
      value: activeProjects,
      description: `Out of ${totalProjects} total`,
      icon: Activity,
      color: 'text-[#075B72]',
      bgColor: 'bg-[#CAEDF1]',
    },
    {
      title: 'Platform Growth',
      value: '+23%',
      description: 'Month over month',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
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

      {/* Company Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Company Overview</CardTitle>
          <CardDescription>Manage all companies on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCompanies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#148ABB] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-[#CAEDF1] rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-[#075B7A]" />
                  </div>
                  <div>
                    <h3 className="text-sm">{company.name}</h3>
                    <p className="text-xs text-gray-500">
                      Created {new Date(company.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-lg text-[#075B7A]">{company.activeProjects}</div>
                    <div className="text-xs text-gray-500">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-[#148ABB]">{company.totalUsers}</div>
                    <div className="text-xs text-gray-500">Users</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Response Time</span>
                <span className="text-sm text-green-600">120ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Load</span>
                <span className="text-sm text-[#148ABB]">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#148ABB] h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage Usage</span>
                <span className="text-sm text-[#075B7A]">62%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#075B7A] h-2 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-[#148ABB] rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm">New company registered: Skyline Developers</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-[#075B7A] rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm">15 new users added across 3 companies</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-green-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm">System update completed successfully</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
