import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FolderKanban, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { mockProjects } from '../../data/mockData';

export const ClientDashboard: React.FC = () => {
  const myProjects = mockProjects.filter(p => p.companyId === '1').slice(0, 2);
  const avgProgress = Math.round(
    myProjects.reduce((sum, p) => sum + p.progress, 0) / myProjects.length
  );

  const stats = [
    {
      title: 'My Projects',
      value: myProjects.length,
      description: 'Active investments',
      icon: FolderKanban,
      color: 'text-[#075B7A]',
      bgColor: 'bg-[#CAEDF1]',
    },
    {
      title: 'Avg Progress',
      value: `${avgProgress}%`,
      description: 'Across all projects',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Milestones',
      value: 8,
      description: '3 pending approval',
      icon: CheckCircle,
      color: 'text-[#148ABB]',
      bgColor: 'bg-[#CAEDF1]',
    },
    {
      title: 'Next Visit',
      value: 'Feb 15',
      description: 'Harbor Point Tower',
      icon: Calendar,
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
          <CardTitle>My Projects</CardTitle>
          <CardDescription>Your construction project investments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myProjects.map((project) => {
              const budgetUsage = (project.spent / project.budget) * 100;
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
                      On Track
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
                      <p className="text-xs text-gray-500">Completion</p>
                      <p className="text-sm text-gray-900">
                        {new Date(project.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Construction Progress</span>
                      <span className="text-[#075B7A]">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#075B7A] h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-gray-500">Budget Utilization</span>
                      <span className="text-[#148ABB]">{budgetUsage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#148ABB] h-2 rounded-full"
                        style={{ width: `${budgetUsage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>Latest project notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-green-700">Milestone Completed</p>
                  <p className="text-xs text-green-600 mt-1">
                    Harbor Point - Foundation work finished ahead of schedule
                  </p>
                  <p className="text-xs text-green-500 mt-1">2 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-700">Site Visit Scheduled</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Upcoming walkthrough on February 15, 2026
                  </p>
                  <p className="text-xs text-blue-500 mt-1">3 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#CAEDF1] border border-[#62DEF1] rounded-lg">
                <TrendingUp className="h-5 w-5 text-[#075B7A] mt-0.5" />
                <div>
                  <p className="text-sm text-[#075B7A]">Progress Report Available</p>
                  <p className="text-xs text-[#075B72] mt-1">
                    January 2026 monthly report ready for review
                  </p>
                  <p className="text-xs text-[#075B7A] mt-1">5 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Milestones</CardTitle>
            <CardDescription>Awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border border-[#148ABB] bg-[#CAEDF1]/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm">Structural Framework - Level 10</h4>
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                    Pending
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Harbor Point Tower</p>
                <button className="text-xs text-[#148ABB] hover:underline">
                  Review & Approve →
                </button>
              </div>
              <div className="p-3 border border-[#148ABB] bg-[#CAEDF1]/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm">Foundation Completion</h4>
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                    Pending
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Riverside Complex</p>
                <button className="text-xs text-[#148ABB] hover:underline">
                  Review & Approve →
                </button>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm">Planning Phase Review</h4>
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                    Pending
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Tech Park Phase 2</p>
                <button className="text-xs text-[#148ABB] hover:underline">
                  Review & Approve →
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
