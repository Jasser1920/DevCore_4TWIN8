import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { mockInspections, mockSites } from '../../data/mockData';

export const QHSEDashboard: React.FC = () => {
  const totalInspections = mockInspections.length;
  const passedInspections = mockInspections.filter(i => i.status === 'passed').length;
  const failedInspections = mockInspections.filter(i => i.status === 'failed').length;
  const warningInspections = mockInspections.filter(i => i.status === 'warning').length;

  const stats = [
    {
      title: 'Total Inspections',
      value: totalInspections,
      description: 'This month',
      icon: FileText,
      color: 'text-[#075B7A]',
      bgColor: 'bg-[#CAEDF1]',
    },
    {
      title: 'Passed',
      value: passedInspections,
      description: `${Math.round((passedInspections / totalInspections) * 100)}% success rate`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Warnings',
      value: warningInspections,
      description: 'Require follow-up',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Failed',
      value: failedInspections,
      description: 'Immediate action needed',
      icon: XCircle,
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

      {/* Recent Inspections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Safety Inspections</CardTitle>
          <CardDescription>Latest site safety assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockInspections.map((inspection) => {
              const site = mockSites.find(s => s.id === inspection.siteId);
              const getStatusConfig = (status: string) => {
                switch (status) {
                  case 'passed':
                    return {
                      color: 'bg-green-100 border-green-200 text-green-700',
                      icon: CheckCircle,
                      iconColor: 'text-green-600',
                    };
                  case 'warning':
                    return {
                      color: 'bg-orange-100 border-orange-200 text-orange-700',
                      icon: AlertTriangle,
                      iconColor: 'text-orange-600',
                    };
                  case 'failed':
                    return {
                      color: 'bg-red-100 border-red-200 text-red-700',
                      icon: XCircle,
                      iconColor: 'text-red-600',
                    };
                  default:
                    return {
                      color: 'bg-gray-100 border-gray-200 text-gray-700',
                      icon: FileText,
                      iconColor: 'text-gray-600',
                    };
                }
              };

              const config = getStatusConfig(inspection.status);
              const StatusIcon = config.icon;

              return (
                <div
                  key={inspection.id}
                  className={`p-4 border rounded-lg ${config.color}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <StatusIcon className={`h-5 w-5 ${config.iconColor} mt-0.5`} />
                      <div>
                        <h3 className="text-sm mb-1">{site?.name}</h3>
                        <p className="text-xs opacity-80">
                          Inspected by {inspection.inspector} on{' '}
                          {new Date(inspection.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-white/50">
                      {inspection.status.toUpperCase()}
                    </span>
                  </div>
                  {inspection.issues.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs mb-2">Issues Found:</p>
                      <ul className="space-y-1">
                        {inspection.issues.map((issue, idx) => (
                          <li key={idx} className="text-xs opacity-90 ml-4">
                            • {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs opacity-80 italic">{inspection.notes}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Safety KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Safety KPIs</CardTitle>
            <CardDescription>Key safety metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">PPE Compliance</span>
                  <span className="text-sm text-green-600">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Safety Training Completion</span>
                  <span className="text-sm text-[#148ABB]">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#148ABB] h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Incident Response Time</span>
                  <span className="text-sm text-[#075B7A]">&lt; 15 min</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#075B7A] h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Equipment Maintenance</span>
                  <span className="text-sm text-green-600">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Safety Alerts</CardTitle>
            <CardDescription>Automated safety detections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">Missing PPE Detected</p>
                  <p className="text-xs text-red-600 mt-1">3 workers without helmets - Site 5</p>
                  <p className="text-xs text-red-500 mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-700">Unsecured Equipment</p>
                  <p className="text-xs text-orange-600 mt-1">Scaffolding issue - Site 2</p>
                  <p className="text-xs text-orange-500 mt-1">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-green-700">Full Compliance Verified</p>
                  <p className="text-xs text-green-600 mt-1">All safety protocols met - Site 3</p>
                  <p className="text-xs text-green-500 mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
