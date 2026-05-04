import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Building2, Plus, Users, FolderKanban } from 'lucide-react';
import { mockCompanies } from '../../data/mockData';

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState(mockCompanies);
  const [isOpen, setIsOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    contactEmail: '',
    contactName: '',
  });

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const company = {
      id: String(companies.length + 1),
      name: newCompany.name,
      createdAt: new Date().toISOString().split('T')[0],
      activeProjects: 0,
      totalUsers: 1,
    };
    setCompanies([...companies, company]);
    setNewCompany({ name: '', contactEmail: '', contactName: '' });
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Company Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage tenant companies on the platform
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#075B7A] hover:bg-[#064d66]">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
              <DialogDescription>
                Add a new tenant company to the SmartSite platform
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-name">Primary Contact Name</Label>
                <Input
                  id="contact-name"
                  value={newCompany.contactName}
                  onChange={(e) => setNewCompany({ ...newCompany, contactName: e.target.value })}
                  placeholder="Enter contact name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={newCompany.contactEmail}
                  onChange={(e) => setNewCompany({ ...newCompany, contactEmail: e.target.value })}
                  placeholder="contact@company.com"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#075B7A] hover:bg-[#064d66]">
                  Create Company
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="hover:border-[#148ABB] transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 bg-[#CAEDF1] rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-[#075B7A]" />
                </div>
              </div>
              <CardTitle className="mt-4">{company.name}</CardTitle>
              <CardDescription>
                Member since {new Date(company.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FolderKanban className="h-4 w-4" />
                    <span className="text-sm">Projects</span>
                  </div>
                  <span className="text-[#075B7A]">{company.activeProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Users</span>
                  </div>
                  <span className="text-[#148ABB]">{company.totalUsers}</span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Manage Company
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
