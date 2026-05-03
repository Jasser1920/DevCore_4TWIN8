import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import axios from 'axios';
import { Project } from '../projects/project.entity';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.schema';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly aiBaseUrl = process.env.AI_API_URL || 'http://localhost:8000';

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectModel('User')
    private readonly userModel: Model<User>,
  ) {}

  async sendMessageToAI(message: string, user: any): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      let systemContext = `[CURRENT USER]\nRole: ${user?.role || 'UNKNOWN'}\nEmail: ${user?.email || 'Unknown'}\n[/CURRENT USER]\n\n[SYSTEM CONTEXT - LIVE DATABASE STATS]\n`;

      if (user?.role === 'SUPER_ADMIN') {
        const usersCount = await this.userModel.countDocuments();
        const companiesCount = await this.companyRepository.count();
        const activeProjectsCount = await this.projectRepository.count({ where: { status: 'ACTIVE' as any } });
        
        const projects = await this.projectRepository.find({ select: ['name', 'status', 'budgetPlanned'], take: 10 });
        const projectsSummary = projects.map(p => `- ${p.name} (Status: ${p.status}, Budget: ${p.budgetPlanned || 'N/A'})`).join('\n');

        const usersList = await this.userModel.find({}, 'email role createdAt').limit(20);
        const usersSummary = usersList.map(u => `- Email: ${u.email}, Role: ${u.role}, Created: ${u.createdAt?.toISOString().split('T')[0]}`).join('\n');

        systemContext += `Total Users Registered: ${usersCount}\nTotal Companies: ${companiesCount}\nTotal Active Projects: ${activeProjectsCount}\n\nRecent Projects Overview:\n${projectsSummary}\n\nRegistered Users Overview (Top 20):\n${usersSummary}\n`;
      } 
      else if (user?.role === 'DIRECTOR') {
        const activeProjectsCount = await this.projectRepository.count({ where: { status: 'ACTIVE' as any } });
        const projects = await this.projectRepository.find({ select: ['name', 'status', 'budgetPlanned'], take: 20 });
        const projectsSummary = projects.length > 0 
          ? projects.map(p => `- ${p.name} (Status: ${p.status}, Budget: ${p.budgetPlanned || 'N/A'})`).join('\n')
          : "No projects found.";
        
        systemContext += `Total Active Projects: ${activeProjectsCount}\n\nProjects Overview:\n${projectsSummary}\n\nNOTE: You do not have permission to view User or Company lists.\n`;
      }
      else if (user?.role === 'PROJECT_MANAGER') {
        const projects = await this.projectRepository.find({ where: { projectManagerId: user.sub }, select: ['name', 'status', 'budgetPlanned'] });
        const projectsSummary = projects.length > 0 
          ? projects.map(p => `- ${p.name} (Status: ${p.status}, Budget: ${p.budgetPlanned || 'N/A'})`).join('\n')
          : "No assigned projects.";
        
        systemContext += `Your Assigned Projects:\n${projectsSummary}\n\nNOTE: You do not have permission to view global project counts, Users, or Companies.\n`;
      }
      else if (user?.role === 'QHSE_MANAGER') {
        const projects = await this.projectRepository.find({ where: { qhseManagerId: user.sub }, select: ['name', 'status'] });
        const projectsSummary = projects.length > 0 
          ? projects.map(p => `- ${p.name} (Status: ${p.status})`).join('\n')
          : "No assigned sites.";
        
        systemContext += `Your Assigned Sites:\n${projectsSummary}\n\nNOTE: You do not have permission to view financial budgets, Users, or Companies.\n`;
      }
      else if (user?.role === 'CLIENT') {
        const projects = await this.projectRepository.find({ where: { clientUserId: user.sub }, select: ['name', 'status'] });
        const projectsSummary = projects.length > 0 
          ? projects.map(p => `- ${p.name} (Status: ${p.status})`).join('\n')
          : "No assigned projects.";
        
        systemContext += `Your Client Projects:\n${projectsSummary}\n\nNOTE: You do not have permission to view other users, companies, or internal project data.\n`;
      }
      else {
        systemContext += `You have limited access. No data provided.\n`;
      }

      systemContext += `[/SYSTEM CONTEXT]\n\nUser Question: ${message}`;

      // 2. Send enhanced prompt to Python AI Server
      const { data } = await axios.post(`${this.aiBaseUrl}/chat`, {
        message: systemContext,
      });

      if (data.success) {
        return { success: true, response: data.response };
      } else {
        return { success: false, error: 'AI Server returned an error' };
      }
    } catch (error: any) {
      this.logger.error(`Failed to send message to AI: ${error.message}`);
      return { success: false, error: 'Could not connect to the AI service' };
    }
  }
}
