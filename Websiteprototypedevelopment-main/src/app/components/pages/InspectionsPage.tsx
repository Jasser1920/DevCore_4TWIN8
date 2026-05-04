import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { CheckCircle, XCircle, AlertTriangle, Plus, FileText } from 'lucide-react';
import { mockInspections, mockSites } from '../../data/mockData';

export const InspectionsPage: React.FC = () => {
  const [inspections, setInspections] = useState(mockInspections);
  const [isOpen, setIsOpen] = useState(false);
  const [newInspection, setNewInspection] = useState({
    siteId: '',
    status: 'passed' as 'passed' | 'warning' | 'failed',
    notes: '',
  });

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const site = mockSites.find(s => s.id === newInspection.siteId);
    const inspection = {
      id: String(inspections.length + 1),
      siteId: newInspection.siteId,
      date: new Date().toISOString().split('T')[0],
      inspector: 'David Martinez',
      status: newInspection.status,
      issues: [],
      notes: newInspection.notes,
    };
    setInspections([inspection, ...inspections]);
    setNewInspection({ siteId: '', status: 'passed', notes: '' });
    setIsOpen(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'passed':
        return {
          color: 'bg-green-100 border-green-200 text-green-700',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          label: 'PASSED',
        };
      case 'warning':
        return {
          color: 'bg-orange-100 border-orange-200 text-orange-700',
          icon: AlertTriangle,
          iconColor: 'text-orange-600',
          label: 'WARNING',
        };
      case 'failed':
        return {
          color: 'bg-red-100 border-red-200 text-red-700',
          icon: XCircle,
          iconColor: 'text-red-600',
          label: 'FAILED',
        };
      default:
        return {
          color: 'bg-gray-100 border-gray-200 text-gray-700',
          icon: FileText,
          iconColor: 'text-gray-600',
          label: 'UNKNOWN',
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Safety Inspections</h2>
          <p className="text-sm text-gray-500 mt-1">
            Conduct and manage QHSE safety inspections across all sites
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#075B7A] hover:bg-[#064d66]">
              <Plus className="h-4 w-4 mr-2" />
              New Inspection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Safety Inspection</DialogTitle>
              <DialogDescription>
                Log a new safety inspection for a construction site
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInspection} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site">Select Site</Label>
                <Select
                  value={newInspection.siteId}
                  onValueChange={(value) => setNewInspection({ ...newInspection, siteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a site" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Inspection Status</Label>
                <Select
                  value={newInspection.status}
                  onValueChange={(value: 'passed' | 'warning' | 'failed') =>
                    setNewInspection({ ...newInspection, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Inspection Notes</Label>
                <Textarea
                  id="notes"
                  value={newInspection.notes}
                  onChange={(e) => setNewInspection({ ...newInspection, notes: e.target.value })}
                  placeholder="Enter inspection notes, observations, and recommendations..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#075B7A] hover:bg-[#064d66]">
                  Submit Inspection
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Passed</CardTitle>
            <div className="bg-green-50 p-2 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">
              {inspections.filter(i => i.status === 'passed').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">All safety protocols met</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Warnings</CardTitle>
            <div className="bg-orange-50 p-2 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-orange-600">
              {inspections.filter(i => i.status === 'warning').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Require follow-up action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Failed</CardTitle>
            <div className="bg-red-50 p-2 rounded-lg">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-600">
              {inspections.filter(i => i.status === 'failed').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Critical issues identified</p>
          </CardContent>
        </Card>
      </div>

      {/* Inspections List */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection History</CardTitle>
          <CardDescription>Recent safety inspections and their outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inspections.map((inspection) => {
              const site = mockSites.find(s => s.id === inspection.siteId);
              const config = getStatusConfig(inspection.status);
              const StatusIcon = config.icon;

              return (
                <div key={inspection.id} className={`p-4 border rounded-lg ${config.color}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <StatusIcon className={`h-5 w-5 ${config.iconColor} mt-0.5`} />
                      <div className="flex-1">
                        <h3 className="text-sm mb-1">{site?.name}</h3>
                        <p className="text-xs opacity-80">
                          Inspected by {inspection.inspector} on{' '}
                          {new Date(inspection.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-white/50">{config.label}</span>
                  </div>

                  {inspection.issues.length > 0 && (
                    <div className="mb-3 p-3 bg-white/30 rounded">
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

                  <div className="p-3 bg-white/30 rounded">
                    <p className="text-xs mb-1">Inspector Notes:</p>
                    <p className="text-xs opacity-90 italic">{inspection.notes}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
