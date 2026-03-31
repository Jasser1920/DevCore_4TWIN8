import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ValidateProjectDto } from './dto/validate-project.dto';
import { ProjectStatus } from './project.entity';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { SubmitMilestoneDto } from './dto/submit-milestone.dto';
import { ClientValidateMilestoneDto } from './dto/client-validate-milestone.dto';
import { AssignClientDto } from './dto/assign-client.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  private requestMeta(req: any) {
    return {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.['user-agent'] || undefined,
    };
  }

  @Post()
  async createProject(@Req() req: any, @Body() body: CreateProjectDto) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can create projects');
    }

    return this.projectsService.createProject(req.user, body, this.requestMeta(req));
  }

  @Put(':id')
  async updateProject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
  ) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can update projects');
    }

    return this.projectsService.updateProject(id, req.user, body, this.requestMeta(req));
  }

  @Post(':id/submit')
  async submitProject(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can submit projects');
    }

    return this.projectsService.submitProject(id, req.user, this.requestMeta(req), false);
  }

  @Post(':id/resubmit')
  async resubmitProject(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can resubmit projects');
    }

    return this.projectsService.submitProject(id, req.user, this.requestMeta(req), true);
  }

  @Get('my-projects')
  async getMyProjects(@Req() req: any) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can view own projects');
    }

    return this.projectsService.getMyProjects(req.user);
  }

  @Get(':id/feedback')
  async getProjectFeedback(@Req() req: any, @Param('id') id: string) {
    return this.projectsService.getProjectFeedback(id, req.user);
  }

  @Post(':id/milestones')
  async createMilestone(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: CreateMilestoneDto,
  ) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can create milestones');
    }

    return this.projectsService.createMilestone(id, req.user, body, this.requestMeta(req));
  }

  @Get(':id/milestones')
  async getProjectMilestones(@Req() req: any, @Param('id') id: string) {
    return this.projectsService.getProjectMilestones(id, req.user);
  }

  @Post('milestones/:id/submit')
  async submitMilestone(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: SubmitMilestoneDto,
  ) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can submit milestones');
    }

    return this.projectsService.submitMilestone(id, req.user, body, this.requestMeta(req), false);
  }

  @Post('milestones/:id/resubmit')
  async resubmitMilestone(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: SubmitMilestoneDto,
  ) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can resubmit milestones');
    }

    return this.projectsService.submitMilestone(id, req.user, body, this.requestMeta(req), true);
  }

  @Get('client/milestones/validation-queue')
  async getClientMilestoneValidationQueue(@Req() req: any) {
    if (req.user.role !== 'CLIENT') {
      throw new ForbiddenException('Only CLIENT can access milestone validation queue');
    }

    return this.projectsService.getClientMilestoneValidationQueue(req.user);
  }

  @Post('client/milestones/:id/validate')
  async validateMilestoneByClient(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ClientValidateMilestoneDto,
  ) {
    if (req.user.role !== 'CLIENT') {
      throw new ForbiddenException('Only CLIENT can validate milestones');
    }

    return this.projectsService.validateMilestoneByClient(id, req.user, body, this.requestMeta(req));
  }

  @Get('client/projects')
  async getClientProjects(@Req() req: any) {
    if (req.user.role !== 'CLIENT') {
      throw new ForbiddenException('Only CLIENT can access client projects');
    }

    return this.projectsService.getClientProjects(req.user);
  }

  @Get('director/validation-queue')
  async getValidationQueue(@Req() req: any) {
    if (req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only DIRECTOR can access validation queue');
    }

    return this.projectsService.getDirectorValidationQueue(req.user);
  }

  @Get('director/clients/available')
  async getDirectorAvailableClients(@Req() req: any) {
    if (req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only DIRECTOR can access available clients');
    }

    return this.projectsService.getDirectorAvailableClients(req.user);
  }

  @Post('director/:id/assign-client')
  async assignClientToProject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: AssignClientDto,
  ) {
    if (req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only DIRECTOR can assign project client');
    }

    return this.projectsService.assignClientToProject(
      id,
      req.user,
      body,
      this.requestMeta(req),
    );
  }

  @Get('director/active-overview')
  async getDirectorActiveOverview(
    @Req() req: any,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
    @Query('status') statusRaw?: string,
    @Query('risk') riskRaw?: string,
    @Query('search') searchRaw?: string,
    @Query('sortBy') sortByRaw?: string,
    @Query('sortOrder') sortOrderRaw?: string,
  ) {
    if (req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only DIRECTOR can access project overview');
    }

    const page = Math.max(1, Number(pageRaw) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(pageSizeRaw) || 10));

    let status: ProjectStatus | undefined;
    if (statusRaw) {
      if (![ProjectStatus.APPROVED, ProjectStatus.ACTIVE].includes(statusRaw as ProjectStatus)) {
        throw new BadRequestException('Invalid status filter');
      }
      status = statusRaw as ProjectStatus;
    }

    let risk: 'LOW' | 'MEDIUM' | 'HIGH' | undefined;
    if (riskRaw) {
      const normalizedRisk = riskRaw.toUpperCase();
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(normalizedRisk)) {
        throw new BadRequestException('Invalid risk filter');
      }
      risk = normalizedRisk as 'LOW' | 'MEDIUM' | 'HIGH';
    }

    const sortBy = (sortByRaw || 'lastUpdatedAt') as
      | 'lastUpdatedAt'
      | 'risk'
      | 'budgetConsumptionPercent';
    if (!['lastUpdatedAt', 'risk', 'budgetConsumptionPercent'].includes(sortBy)) {
      throw new BadRequestException('Invalid sortBy value');
    }

    const sortOrder = (sortOrderRaw || 'desc').toLowerCase() as 'asc' | 'desc';
    if (!['asc', 'desc'].includes(sortOrder)) {
      throw new BadRequestException('Invalid sortOrder value');
    }

    return this.projectsService.getDirectorActiveProjectsOverview(req.user, {
      page,
      pageSize,
      status,
      risk,
      search: searchRaw,
      sortBy,
      sortOrder,
    });
  }

  @Get('director/:id/financial-kpis')
  async getDirectorProjectFinancialKpis(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only DIRECTOR can access project financial KPIs');
    }

    return this.projectsService.getDirectorProjectFinancialKpis(id, req.user);
  }

  @Post('director/:id/validate')
  async validateProject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ValidateProjectDto,
  ) {
    if (req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only DIRECTOR can validate projects');
    }

    return this.projectsService.validateProject(id, req.user, body, this.requestMeta(req));
  }

  @Post('director/:id/start')
  async startProject(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only DIRECTOR can start projects');
    }

    return this.projectsService.startProject(id, req.user, this.requestMeta(req));
  }
}
