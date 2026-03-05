import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FolderKanban, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { mockProjects } from '../../data/mockData';

export const DirectorDashboard: React.FC = () => {
  const projects = mockProjects.filter(p => p.companyId === '1');
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const avgProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length);

  const stats = [
    {
      title: 'Active Projects',
      value: projects.filter(p => p.status === 'active').length,
      description: `Out of ${projects.length} total`,
      icon: FolderKanban,
      color: 'text-[#075B7A]',
      bgColor: 'bg-[#CAEDF1]',
    },
    {
      title: 'Total Budget',
      value: `$${(totalBudget / 1000000).toFixed(1)}M`,
      description: 'Across all projects',
      icon: DollarSign,
      color: 'text-[#148ABB]',
      bgColor: 'bg-[#CAEDF1]',
    },
    {
      title: 'Budget Spent',
      value: `${Math.round((totalSpent / totalBudget) * 100)}%`,
      description: `$${(totalSpent / 1000000).toFixed(1)}M spent`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Avg Progress',
      value: `${avgProgress}%`,
      description: 'Across all projects',
      icon: TrendingUp,
      color: 'text-[#075B72]',
      bgColor: 'bg-[#CAEDF1]',
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

      {/* Projects Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Projects Overview</CardTitle>
          <CardDescription>Strategic view of all construction projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => {
              const budgetUsage = (project.spent / project.budget) * 100;
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'active':
                    return 'bg-green-100 text-green-700';
                  case 'planning':
                    return 'bg-blue-100 text-blue-700';
                  case 'on_hold':
                    return 'bg-yellow-100 text-yellow-700';
                  default:
                    return 'bg-gray-100 text-gray-700';
                }
              };

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
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Progress</p>
                      <p className="text-sm text-[#075B7A]">{project.progress}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Budget</p>
                      <p className="text-sm text-[#148ABB]">
                        ${(project.budget / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Spent</p>
                      <p className="text-sm text-gray-900">
                        ${(project.spent / 1000000).toFixed(1)}M ({budgetUsage.toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
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

      {/* Budget Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Budget Distribution</CardTitle>
            <CardDescription>Allocation across projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map((project) => {
                const percentage = (project.budget / totalBudget) * 100;
                return (
                  <div key={project.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{project.name}</span>
                      <span className="text-sm text-[#075B7A]">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#148ABB] h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>Strategic recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm">Harbor Point Tower nearing 70% budget utilization</p>
                  <p className="text-xs text-gray-600 mt-1">Consider reviewing budget allocation</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm">Riverside Complex on track for Q3 milestones</p>
                  <p className="text-xs text-gray-600 mt-1">Excellent progress this quarter</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FolderKanban className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm">Tech Park Phase 2 ready for review</p>
                  <p className="text-xs text-gray-600 mt-1">Planning phase requires approval</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
