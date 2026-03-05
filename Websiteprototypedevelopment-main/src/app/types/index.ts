export type UserRole = 'super_admin' | 'director' | 'project_manager' | 'qhse_manager' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  createdAt: string;
  activeProjects: number;
  totalUsers: number;
}

export interface Project {
  id: string;
  name: string;
  companyId: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  location: string;
  managerId: string;
}

export interface Site {
  id: string;
  name: string;
  projectId: string;
  status: 'active' | 'completed' | 'delayed';
  progress: number;
  lastInspection: string;
  issues: number;
}

export interface SafetyInspection {
  id: string;
  siteId: string;
  date: string;
  inspector: string;
  status: 'passed' | 'warning' | 'failed';
  issues: string[];
  notes: string;
}

export interface Alert {
  id: string;
  type: 'delay' | 'safety' | 'budget' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  siteId?: string;
  projectId?: string;
  timestamp: string;
  read: boolean;
}

export interface PhotoUpload {
  id: string;
  siteId: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  aiAnalysis?: {
    progress: number;
    safetyIssues: string[];
    ppe_compliance: boolean;
  };
}
