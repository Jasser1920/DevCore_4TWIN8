import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import {
  ProjectValidationAction,
  ProjectValidationHistory,
} from './project-validation-history.entity';
import { Company } from '../companies/company.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ValidateProjectDto } from './dto/validate-project.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UsersService } from '../users/users.service';
import { StrategicVision, StrategicVisionStatus } from '../strategic-vision/strategic-vision.entity';
import { Milestone, MilestoneStatus } from './milestone.entity';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { SubmitMilestoneDto } from './dto/submit-milestone.dto';
import { ClientValidateMilestoneDto } from './dto/client-validate-milestone.dto';
import { AssignClientDto } from './dto/assign-client.dto';

type ProjectRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type ProjectOverviewSortBy = 'lastUpdatedAt' | 'risk' | 'budgetConsumptionPercent';
type SortOrder = 'asc' | 'desc';

const MAX_PM_ONGOING_PROJECTS = 3;

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(ProjectValidationHistory)
    private readonly historyRepo: Repository<ProjectValidationHistory>,
    @InjectRepository(Company)
    private readonly companiesRepo: Repository<Company>,
    @InjectRepository(StrategicVision)
    private readonly strategicVisionRepo: Repository<StrategicVision>,
    @InjectRepository(Milestone)
    private readonly milestonesRepo: Repository<Milestone>,
    private readonly activityLogsService: ActivityLogsService,
    private readonly usersService: UsersService,
  ) {}

  private async assertStrategicVisionApproved(companyId: string) {
    const vision = await this.strategicVisionRepo.findOne({ where: { companyId } });

    if (!vision || vision.status !== StrategicVisionStatus.APPROVED) {
      throw new BadRequestException(
        'Strategic vision must be approved before submitting projects for validation',
      );
    }
  }

  private async assertPmPipelineCapacity(projectManagerId: string) {
    const ongoingProjects = await this.projectsRepo.find({
      where: {
        projectManagerId,
        status: In([ProjectStatus.SUBMITTED_FOR_VALIDATION, ProjectStatus.ACTIVE]),
      },
    });

    if (ongoingProjects.length >= MAX_PM_ONGOING_PROJECTS) {
      throw new BadRequestException(
        `Project Manager can have at most ${MAX_PM_ONGOING_PROJECTS} ongoing projects (SUBMITTED_FOR_VALIDATION or ACTIVE)`,
      );
    }
  }

  private assertProjectDates(startDate: Date, endDate: Date) {
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }
  }

  private assertProjectBudgets(planned: number, consumed: number) {
    if (planned < 0 || consumed < 0) {
      throw new BadRequestException('Budget values must be non-negative');
    }

    if (consumed > planned) {
      throw new BadRequestException('Consumed budget cannot exceed planned budget');
    }
  }

  private async ensurePmCompany(mongoUserId: string): Promise<Company> {
    const companies = await this.companiesRepo.find();
    const company = companies.find((item) => {
      const ids = Array.isArray(item.projectManagerIds) ? item.projectManagerIds : [];
      const normalized = item.projectManagerId && !ids.includes(item.projectManagerId)
        ? [...ids, item.projectManagerId]
        : ids;
      return normalized.includes(mongoUserId);
    });

    if (!company) {
      throw new ForbiddenException('Project Manager is not assigned to a company');
    }

    return company;
  }

  private async ensureDirectorCompany(mongoUserId: string): Promise<Company> {
    const company = await this.companiesRepo.findOne({
      where: { managerUserId: mongoUserId },
    });

    if (!company) {
      throw new ForbiddenException('Director is not assigned to a company');
    }

    return company;
  }

  private async getClientScopedProjects(reqUser: any): Promise<Project[]> {
    const projects = await this.projectsRepo.find({
      where: { clientUserId: reqUser.mongoId },
      order: { updatedAt: 'DESC' },
    });

    return projects;
  }

  private assertMilestoneDate(plannedDate: Date) {
    if (Number.isNaN(plannedDate.getTime())) {
      throw new BadRequestException('Invalid planned milestone date');
    }
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  private calculateProgressPercent(project: Project): number {
    if (!project.startDate || !project.endDate) return 0;

    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;

    const now = Date.now();
    const elapsed = Math.min(Math.max(now - start, 0), end - start);
    const progress = (elapsed / (end - start)) * 100;

    return Number(progress.toFixed(2));
  }

  private calculateBudgetConsumptionPercent(planned: number, consumed: number): number {
    if (planned <= 0) return 0;
    const percent = (consumed / planned) * 100;
    return Number(Math.max(percent, 0).toFixed(2));
  }

  private calculateRiskLevel(
    status: ProjectStatus,
    budgetConsumptionPercent: number,
    progressPercent: number,
  ): ProjectRiskLevel {
    if (status === ProjectStatus.REJECTED) return 'HIGH';

    const delta = budgetConsumptionPercent - progressPercent;
    if (budgetConsumptionPercent >= 100 && progressPercent < 100) return 'HIGH';
    if (delta > 30) return 'HIGH';
    if (delta > 15) return 'MEDIUM';
    return 'LOW';
  }

  private buildOverviewRow(
    project: Project,
    pmDirectory: Map<string, { displayName: string; email: string }>,
    clientDirectory: Map<string, { displayName: string; email: string }>,
  ) {
    const budgetPlanned = this.toNumber(project.budgetPlanned);
    const budgetConsumed = this.toNumber(project.budgetConsumed);
    const budgetConsumptionPercent = this.calculateBudgetConsumptionPercent(
      budgetPlanned,
      budgetConsumed,
    );
    const progressPercent = this.calculateProgressPercent(project);
    const risk = this.calculateRiskLevel(
      project.status,
      budgetConsumptionPercent,
      progressPercent,
    );

    const pmProfile = pmDirectory.get(project.projectManagerId) || {
      displayName: 'Unknown PM',
      email: 'N/A',
    };
    const clientProfile = project.clientUserId
      ? clientDirectory.get(project.clientUserId) || {
          displayName: 'Unknown Client',
          email: 'N/A',
        }
      : null;

    return {
      id: project.id,
      name: project.name,
      code: project.code,
      status: project.status,
      projectManagerId: project.projectManagerId,
      projectManagerName: pmProfile.displayName,
      projectManagerEmail: pmProfile.email,
      clientUserId: project.clientUserId || null,
      clientName: clientProfile?.displayName || null,
      clientEmail: clientProfile?.email || null,
      budgetConsumptionPercent,
      progressPercent,
      risk,
      lastUpdatedAt: project.updatedAt,
      budgetPlanned,
      budgetConsumed,
      currency: project.currency || 'USD',
    };
  }

  private sortOverviewRows(
    rows: Array<ReturnType<ProjectsService['buildOverviewRow']>>,
    sortBy: ProjectOverviewSortBy,
    sortOrder: SortOrder,
  ) {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    const riskRank: Record<ProjectRiskLevel, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };

    rows.sort((a, b) => {
      if (sortBy === 'lastUpdatedAt') {
        const aTime = new Date(a.lastUpdatedAt).getTime();
        const bTime = new Date(b.lastUpdatedAt).getTime();
        return (aTime - bTime) * multiplier;
      }

      if (sortBy === 'budgetConsumptionPercent') {
        return (a.budgetConsumptionPercent - b.budgetConsumptionPercent) * multiplier;
      }

      return (riskRank[a.risk] - riskRank[b.risk]) * multiplier;
    });

    return rows;
  }

  private async addHistory(
    projectId: string,
    action: ProjectValidationAction,
    actorUserId: string,
    actorRole: string,
    comment?: string,
  ) {
    const entry = this.historyRepo.create({
      projectId,
      action,
      actorUserId,
      actorRole,
      comment: comment || '',
    });

    return this.historyRepo.save(entry);
  }

  private makeProjectCode(companyName: string, count: number): string {
    const prefix = companyName
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'PRJ';

    return `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
  }

  async createProject(reqUser: any, dto: CreateProjectDto, reqMeta: any) {
    const company = await this.ensurePmCompany(reqUser.mongoId);
    const existingCount = await this.projectsRepo.count({ where: { companyId: company.id } });

    const code = dto.code?.trim() || this.makeProjectCode(company.name, existingCount);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const budgetConsumed = dto.budgetConsumed || 0;

    this.assertProjectDates(startDate, endDate);
    this.assertProjectBudgets(dto.budgetPlanned, budgetConsumed);

    const project = this.projectsRepo.create({
      companyId: company.id,
      projectManagerId: reqUser.mongoId,
      directorId: company.managerUserId,
      name: dto.name.trim(),
      code,
      description: dto.description || '',
      budgetPlanned: dto.budgetPlanned,
      budgetConsumed,
      currency: dto.currency || 'USD',
      startDate,
      endDate,
      status: ProjectStatus.DRAFT,
    });

    const saved = await this.projectsRepo.save(project);

    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email,
      action: 'PROJECT_CREATED',
      description: `Project ${saved.name} created by Project Manager`,
      details: {
        projectId: saved.id,
        companyId: saved.companyId,
      },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
      performedBy: reqUser.sub,
      status: 'SUCCESS',
    });

    return saved;
  }

  async updateProject(projectId: string, reqUser: any, dto: UpdateProjectDto, reqMeta: any) {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.projectManagerId !== reqUser.mongoId) {
      throw new ForbiddenException('You can only update your own projects');
    }

    if (![ProjectStatus.DRAFT, ProjectStatus.REJECTED].includes(project.status)) {
      throw new BadRequestException('Only draft or rejected projects can be updated');
    }

    const nextStart = dto.startDate ? new Date(dto.startDate) : project.startDate;
    const nextEnd = dto.endDate ? new Date(dto.endDate) : project.endDate;
    const nextPlanned = dto.budgetPlanned ?? Number(project.budgetPlanned);
    const nextConsumed = dto.budgetConsumed ?? Number(project.budgetConsumed);

    this.assertProjectDates(nextStart, nextEnd);
    this.assertProjectBudgets(nextPlanned, nextConsumed);

    Object.assign(project, {
      ...dto,
      startDate: nextStart,
      endDate: nextEnd,
      latestValidationComment: dto ? project.latestValidationComment : project.latestValidationComment,
    });

    const saved = await this.projectsRepo.save(project);

    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email,
      action: 'PROJECT_UPDATED',
      description: `Project ${saved.name} updated by Project Manager`,
      details: {
        projectId: saved.id,
        updatedFields: Object.keys(dto),
      },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
      performedBy: reqUser.sub,
      status: 'SUCCESS',
    });

    return saved;
  }

  async submitProject(projectId: string, reqUser: any, reqMeta: any, isResubmit = false) {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.projectManagerId !== reqUser.mongoId) {
      throw new ForbiddenException('You can only submit your own projects');
    }

    const allowedStatus = isResubmit
      ? [ProjectStatus.REJECTED]
      : [ProjectStatus.DRAFT, ProjectStatus.REJECTED];

    if (!allowedStatus.includes(project.status)) {
      throw new BadRequestException(
        isResubmit
          ? 'Only rejected projects can be resubmitted'
          : 'Project cannot be submitted from current status',
      );
    }

    await this.assertStrategicVisionApproved(project.companyId);
    await this.assertPmPipelineCapacity(reqUser.mongoId);

    if (!project.name || !project.code || !project.startDate || !project.endDate) {
      throw new BadRequestException('Project is incomplete. Fill all required fields before submitting');
    }

    project.status = ProjectStatus.SUBMITTED_FOR_VALIDATION;
    project.submittedAt = new Date();
    const saved = await this.projectsRepo.save(project);

    await this.addHistory(
      saved.id,
      isResubmit ? ProjectValidationAction.RESUBMIT : ProjectValidationAction.SUBMIT,
      reqUser.sub,
      'PROJECT_MANAGER',
    );

    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email,
      action: isResubmit ? 'PROJECT_RESUBMITTED' : 'PROJECT_SUBMITTED',
      description: `Project ${saved.name} ${isResubmit ? 'resubmitted' : 'submitted'} for validation`,
      details: {
        projectId: saved.id,
      },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
      performedBy: reqUser.sub,
      status: 'SUCCESS',
    });

    return saved;
  }

  async getMyProjects(reqUser: any) {
    return this.projectsRepo.find({
      where: { projectManagerId: reqUser.mongoId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getDirectorValidationQueue(reqUser: any) {
    const company = await this.ensureDirectorCompany(reqUser.mongoId);
    return this.projectsRepo.find({
      where: {
        companyId: company.id,
        status: ProjectStatus.SUBMITTED_FOR_VALIDATION,
      },
      order: { submittedAt: 'ASC' },
    });
  }

  async getDirectorActiveProjectsOverview(
    reqUser: any,
    query: {
      page: number;
      pageSize: number;
      status?: ProjectStatus;
      risk?: ProjectRiskLevel;
      search?: string;
      sortBy: ProjectOverviewSortBy;
      sortOrder: SortOrder;
    },
  ) {
    const company = await this.ensureDirectorCompany(reqUser.mongoId);
    const projects = await this.projectsRepo.find({
      where: {
        companyId: company.id,
        status: In([ProjectStatus.APPROVED, ProjectStatus.ACTIVE]),
      },
      order: { updatedAt: 'DESC' },
    });

    const normalizedSearch = query.search?.trim().toLowerCase() || '';
    const allUsers = await this.usersService.getAllUsers();
    const pmDirectory = new Map<string, { displayName: string; email: string }>();
    const clientDirectory = new Map<string, { displayName: string; email: string }>();

    for (const user of allUsers) {
      if (user?.role !== 'PROJECT_MANAGER') continue;
      const id = user?._id?.toString?.();
      if (!id) continue;

      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      pmDirectory.set(id, {
        displayName: fullName || user.username || user.email || 'Unknown PM',
        email: user.email || 'N/A',
      });
    }

    for (const user of allUsers) {
      if (user?.role !== 'CLIENT') continue;
      const id = user?._id?.toString?.();
      if (!id) continue;

      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      clientDirectory.set(id, {
        displayName: fullName || user.username || user.email || 'Unknown Client',
        email: user.email || 'N/A',
      });
    }

    const filtered = this.sortOverviewRows(
      projects
      .map((project) => this.buildOverviewRow(project, pmDirectory, clientDirectory))
      .filter((row) => {
        if (query.status && row.status !== query.status) return false;
        if (query.risk && row.risk !== query.risk) return false;
        if (
          normalizedSearch &&
          !row.name.toLowerCase().includes(normalizedSearch) &&
          !row.code.toLowerCase().includes(normalizedSearch)
        ) {
          return false;
        }
        return true;
      }),
      query.sortBy,
      query.sortOrder,
    );

    const total = filtered.length;
    const page = Math.max(1, query.page);
    const pageSize = Math.max(1, query.pageSize);
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async getDirectorProjectFinancialKpis(projectId: string, reqUser: any) {
    const company = await this.ensureDirectorCompany(reqUser.mongoId);
    const project = await this.projectsRepo.findOne({
      where: {
        id: projectId,
        companyId: company.id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found for your company');
    }

    const plannedBudget = this.toNumber(project.budgetPlanned);
    const consumedBudget = this.toNumber(project.budgetConsumed);
    const burnRatePercent = this.calculateBudgetConsumptionPercent(
      plannedBudget,
      consumedBudget,
    );
    const varianceAmount = Number((plannedBudget - consumedBudget).toFixed(2));
    const variancePercent = plannedBudget > 0
      ? Number((((plannedBudget - consumedBudget) / plannedBudget) * 100).toFixed(2))
      : 0;

    return {
      projectId: project.id,
      projectName: project.name,
      currency: project.currency || 'USD',
      plannedBudget,
      consumedBudget,
      burnRatePercent,
      varianceAmount,
      variancePercent,
      status: project.status,
      updatedAt: project.updatedAt,
    };
  }

  async validateProject(projectId: string, reqUser: any, dto: ValidateProjectDto, reqMeta: any) {
    const company = await this.ensureDirectorCompany(reqUser.mongoId);
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.companyId !== company.id) {
      throw new ForbiddenException('You can only validate projects from your company');
    }

    if (project.status !== ProjectStatus.SUBMITTED_FOR_VALIDATION) {
      throw new BadRequestException('Project is not pending validation');
    }

    if (dto.decision === 'REJECT' && !dto.comment?.trim()) {
      throw new BadRequestException('Rejection comment is required');
    }

    const approved = dto.decision === 'APPROVE';
    project.status = approved ? ProjectStatus.APPROVED : ProjectStatus.REJECTED;
    project.latestValidationComment = dto.comment?.trim() || '';
    project.validatedAt = new Date();
    const saved = await this.projectsRepo.save(project);

    await this.addHistory(
      saved.id,
      approved ? ProjectValidationAction.APPROVE : ProjectValidationAction.REJECT,
      reqUser.sub,
      'DIRECTOR',
      dto.comment,
    );

    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email,
      action: approved ? 'PROJECT_APPROVED' : 'PROJECT_REJECTED',
      description: `Project ${saved.name} ${approved ? 'approved' : 'rejected'} by Director`,
      details: {
        projectId: saved.id,
        decision: dto.decision,
        comment: dto.comment || '',
      },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
      performedBy: reqUser.sub,
      status: 'SUCCESS',
    });

    return saved;
  }

  async getProjectFeedback(projectId: string, reqUser: any) {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isProjectManager = project.projectManagerId === reqUser.mongoId;
    const isDirector = project.directorId === reqUser.mongoId;
    if (!isProjectManager && !isDirector) {
      throw new ForbiddenException('You do not have access to this project feedback');
    }

    const history = await this.historyRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });

    return {
      project,
      latestValidationComment: project.latestValidationComment,
      history,
    };
  }

  async startProject(projectId: string, reqUser: any, reqMeta: any) {
    const company = await this.ensureDirectorCompany(reqUser.mongoId);
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.companyId !== company.id) {
      throw new ForbiddenException('You can only start projects from your company');
    }

    if (project.status !== ProjectStatus.APPROVED) {
      throw new BadRequestException('Only approved projects can be started');
    }

    // Validate project dates are valid
    if (new Date(project.endDate) <= new Date(project.startDate)) {
      throw new BadRequestException('Project end date must be after start date');
    }

    // Update project status to ACTIVE
    project.status = ProjectStatus.ACTIVE;
    const saved = await this.projectsRepo.save(project);

    // Add to validation history
    await this.addHistory(
      saved.id,
      ProjectValidationAction.SUBMIT, // Using SUBMIT as closest action for execution start
      reqUser.sub,
      'DIRECTOR',
      undefined,
    );

    // Log activity
    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email,
      action: 'PROJECT_STARTED',
      description: `Project ${saved.name} started by Director - execution phase initiated`,
      details: {
        projectId: saved.id,
        previousStatus: 'APPROVED',
        newStatus: 'ACTIVE',
      },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
      performedBy: reqUser.sub,
      status: 'SUCCESS',
    });

    return saved;
  }

  async createMilestone(projectId: string, reqUser: any, dto: CreateMilestoneDto, reqMeta: any) {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.projectManagerId !== reqUser.mongoId) {
      throw new ForbiddenException('You can only create milestones for your own projects');
    }

    const plannedDate = new Date(dto.plannedDate);
    this.assertMilestoneDate(plannedDate);

    const milestone = this.milestonesRepo.create({
      projectId: project.id,
      companyId: project.companyId,
      name: dto.name.trim(),
      description: dto.description?.trim() || '',
      plannedDate,
      createdByPmId: reqUser.mongoId,
      status: MilestoneStatus.PLANNED,
    });

    const saved = await this.milestonesRepo.save(milestone);

    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email,
      action: 'MILESTONE_CREATED',
      description: `Milestone ${saved.name} created for project ${project.name}`,
      details: {
        milestoneId: saved.id,
        projectId: project.id,
      },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
      performedBy: reqUser.sub,
      status: 'SUCCESS',
    });

    return saved;
  }

  async getProjectMilestones(projectId: string, reqUser: any) {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (reqUser.role === 'PROJECT_MANAGER') {
      if (project.projectManagerId !== reqUser.mongoId) {
        throw new ForbiddenException('You can only view milestones for your own projects');
      }
    } else if (reqUser.role === 'DIRECTOR') {
      const company = await this.ensureDirectorCompany(reqUser.mongoId);
      if (project.companyId !== company.id) {
        throw new ForbiddenException('You can only view milestones for your company projects');
      }
    } else if (reqUser.role === 'CLIENT') {
      if (project.clientUserId !== reqUser.mongoId) {
        throw new ForbiddenException('You can only view milestones for your assigned projects');
      }
    } else {
      throw new ForbiddenException('Role not allowed to view milestones');
    }

    return this.milestonesRepo.find({
      where: { projectId },
      order: { plannedDate: 'ASC', createdAt: 'ASC' },
    });
  }

  async submitMilestone(
    milestoneId: string,
    reqUser: any,
    dto: SubmitMilestoneDto,
    reqMeta: any,
    isResubmit = false,
  ) {
    const milestone = await this.milestonesRepo.findOne({ where: { id: milestoneId } });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const project = await this.projectsRepo.findOne({ where: { id: milestone.projectId } });
    if (!project) {
      throw new NotFoundException('Project not found for milestone');
    }

    if (project.projectManagerId !== reqUser.mongoId) {
      throw new ForbiddenException('You can only submit milestones for your own projects');
    }

    const allowed = isResubmit
      ? [MilestoneStatus.REJECTED_BY_CLIENT]
      : [MilestoneStatus.PLANNED, MilestoneStatus.REJECTED_BY_CLIENT];
    if (!allowed.includes(milestone.status)) {
      throw new BadRequestException(
        isResubmit
          ? 'Only rejected milestones can be resubmitted'
          : 'Milestone cannot be submitted from current status',
      );
    }

    milestone.evidenceSummary = dto.evidenceSummary?.trim() || milestone.evidenceSummary || '';
    milestone.submittedAt = new Date();
    milestone.status = isResubmit
      ? MilestoneStatus.RESUBMITTED_FOR_CLIENT_VALIDATION
      : MilestoneStatus.SUBMITTED_FOR_CLIENT_VALIDATION;

    const saved = await this.milestonesRepo.save(milestone);

    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email,
      action: isResubmit ? 'MILESTONE_RESUBMITTED' : 'MILESTONE_SUBMITTED',
      description: `Milestone ${saved.name} ${isResubmit ? 'resubmitted' : 'submitted'} for client validation`,
      details: {
        milestoneId: saved.id,
        projectId: project.id,
      },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
      performedBy: reqUser.sub,
      status: 'SUCCESS',
    });

    return saved;
  }

  async getClientMilestoneValidationQueue(reqUser: any) {
    const scopedProjects = await this.getClientScopedProjects(reqUser);
    const scopedProjectIds = scopedProjects.map((project) => project.id);
    if (!scopedProjectIds.length) {
      return [];
    }

    return this.milestonesRepo.find({
      where: {
        projectId: In(scopedProjectIds),
        status: In([
          MilestoneStatus.SUBMITTED_FOR_CLIENT_VALIDATION,
          MilestoneStatus.RESUBMITTED_FOR_CLIENT_VALIDATION,
        ]),
      },
      order: { submittedAt: 'ASC', plannedDate: 'ASC' },
    });
  }

  async validateMilestoneByClient(
    milestoneId: string,
    reqUser: any,
    dto: ClientValidateMilestoneDto,
    reqMeta: any,
  ) {
    const scopedProjects = await this.getClientScopedProjects(reqUser);
    const scopedProjectIds = new Set(scopedProjects.map((project) => project.id));
    const milestone = await this.milestonesRepo.findOne({ where: { id: milestoneId } });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (!scopedProjectIds.has(milestone.projectId)) {
      throw new ForbiddenException('You can only validate milestones for your assigned projects');
    }

    if (
      ![
        MilestoneStatus.SUBMITTED_FOR_CLIENT_VALIDATION,
        MilestoneStatus.RESUBMITTED_FOR_CLIENT_VALIDATION,
      ].includes(milestone.status)
    ) {
      throw new BadRequestException('Milestone is not waiting for client validation');
    }

    if (dto.decision === 'REJECT' && !dto.comment?.trim()) {
      throw new BadRequestException('Rejection comment is required');
    }

    const approved = dto.decision === 'APPROVE';
    milestone.status = approved
      ? MilestoneStatus.APPROVED_BY_CLIENT
      : MilestoneStatus.REJECTED_BY_CLIENT;
    milestone.clientValidationComment = dto.comment?.trim() || '';
    milestone.validatedAt = new Date();
    milestone.validatedByClientId = reqUser.mongoId;

    const saved = await this.milestonesRepo.save(milestone);

    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email,
      action: approved ? 'MILESTONE_APPROVED_BY_CLIENT' : 'MILESTONE_REJECTED_BY_CLIENT',
      description: `Milestone ${saved.name} ${approved ? 'approved' : 'rejected'} by client`,
      details: {
        milestoneId: saved.id,
        decision: dto.decision,
        comment: milestone.clientValidationComment,
      },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
      performedBy: reqUser.sub,
      status: 'SUCCESS',
    });

    return saved;
  }

  async getClientProjects(reqUser: any) {
    return this.getClientScopedProjects(reqUser);
  }

  async getDirectorAvailableClients(reqUser: any) {
    await this.ensureDirectorCompany(reqUser.mongoId);
    const allUsers = await this.usersService.getAllUsers();

    return allUsers
      .filter((user: any) => user?.role === 'CLIENT')
      .map((user: any) => ({
        id: user._id?.toString?.() || '',
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }))
      .filter((user: any) => !!user.id);
  }

  async assignClientToProject(
    projectId: string,
    reqUser: any,
    dto: AssignClientDto,
    reqMeta: any,
  ) {
    const company = await this.ensureDirectorCompany(reqUser.mongoId);
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.companyId !== company.id) {
      throw new ForbiddenException('You can only assign clients to your company projects');
    }

    const clientUser = await this.usersService.getUserById(dto.clientUserId);
    if (!clientUser || clientUser.role !== 'CLIENT') {
      throw new BadRequestException('Selected user is not a valid CLIENT');
    }

    project.clientUserId = dto.clientUserId;
    const saved = await this.projectsRepo.save(project);

    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email,
      action: 'PROJECT_CLIENT_ASSIGNED',
      description: `Client assigned to project ${saved.name}`,
      details: {
        projectId: saved.id,
        clientUserId: dto.clientUserId,
      },
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
      performedBy: reqUser.sub,
      status: 'SUCCESS',
    });

    return saved;
  }
}
