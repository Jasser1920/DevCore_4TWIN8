 
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
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { AssignQhseDto } from './dto/assign-qhse.dto';
import { SubmitQhseReportDto } from './dto/submit-qhse-report.dto';
import { ReviewQhseReportDto } from './dto/review-qhse-report.dto';
import { CreateQhseCorrectiveActionsDto } from './dto/create-qhse-corrective-actions.dto';
import { UpdateQhseCorrectiveActionDto } from './dto/update-qhse-corrective-action.dto';
import { RunQhseEscalationDto } from './dto/run-qhse-escalation.dto';
import { diskStorage } from 'multer';
import type { File as MulterFile } from 'multer';
import { basename, extname, join } from 'path';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { ApiUsageService } from '../common/api-usage.service';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'milestone-evidence');
const MAX_ATTACHMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

function ensureUploadsDir() {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

function safeUploadName(file: MulterFile) {
  const originalName = basename(file.originalname || 'attachment');
  const extension = extname(originalName) || '';
  const baseName = originalName.replace(extension, '').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'attachment';
  return `${Date.now()}-${randomUUID()}-${baseName}${extension}`;
}

function inferContentType(filename: string) {
  const extension = extname(filename).toLowerCase();
  switch (extension) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService,
              private readonly apiUsageService: ApiUsageService,
  
  ) {}

  private requestMeta(req: any) {
    return {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.['user-agent'] || undefined,
    };
  }
@Get('storage-usage')
async getStorageUsage(@Req() req: any) {
  if (req.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenException('Only Super Admin can view storage usage');
  }
  const usage = await this.projectsService.getStorageUsage();
  return usage;
}
  @Post()
  async createProject(@Req() req: any, @Body() body: CreateProjectDto) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can create projects');
    }

    return this.projectsService.createProject(req.user, body, this.requestMeta(req));
  }
@Get('growth')
async getGrowth(@Req() req: any) {
  if (req.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenException('Only Super Admin can view growth stats');
  }
  // Example: Replace with real calculation
  const growth = await this.projectsService.getGrowth();
  return { growth };
}
@Get('revenue-by-month')
async getRevenueByMonth(@Req() req: any) {
  if (req.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenException('Only Super Admin can view revenue stats');
  }
  // Example: Replace with real calculation logic
  return this.projectsService.getRevenueByMonth();
}
 @Get('api-usage')
  async getApiUsage(@Req() req: any, @Query('minutes') minutesRaw?: string) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admin can view API usage');
    }
    const minutes = Math.min(Math.max(Number(minutesRaw) || 60, 1), 1440); // up to 24h
    return this.apiUsageService.getUsageStats(minutes);
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

  @Post('ai/generate-project-description')
  async generateAiProjectDescription(@Req() req: any, @Body() body: { projectName: string }) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can generate AI descriptions');
    }
    return this.projectsService.generateAiProjectDescription(body.projectName);
  }

  @Post(':id/ai/generate-milestone-description')
  async generateAiMilestoneDescription(
    @Req() req: any, 
    @Param('id') id: string, 
    @Body() body: { milestoneName: string }
  ) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can generate AI descriptions');
    }
    return this.projectsService.generateAiMilestoneDescription(id, req.user, body.milestoneName);
  }

  @Post(':id/ai/generate-milestone-evidence-summary')
  async generateAiMilestoneEvidenceSummary(
    @Req() req: any, 
    @Param('id') id: string, 
    @Body() body: { milestoneName: string }
  ) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can generate AI evidence summaries');
    }
    return this.projectsService.generateAiMilestoneEvidenceSummary(id, req.user, body.milestoneName);
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

  @Post('milestones/uploads')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureUploadsDir();
          callback(null, UPLOADS_DIR);
        },
        filename: (_req, file, callback) => {
          callback(null, safeUploadName(file));
        },
      }),
      limits: {
        files: 10,
        fileSize: MAX_ATTACHMENT_FILE_SIZE_BYTES,
      },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.mimetype?.toLowerCase?.() || '')) {
          return callback(new BadRequestException('Only image and PDF files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadMilestoneAttachments(@Req() req: any, @UploadedFiles() files: MulterFile[]) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can upload milestone evidence');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    return {
      data: files.map((file) => `/projects/uploads/${file.filename}`),
    };
  }

  @Get('uploads/:filename')
  async getMilestoneAttachment(@Req() req: any, @Param('filename') filename: string) {
    const safeFilename = basename(filename);
    const hasAccess = await (this.projectsService as any).canUserAccessMilestoneAttachment(
      safeFilename,
      req.user,
    );
    if (!hasAccess) {
      throw new NotFoundException('Attachment not found');
    }

    const filePath = join(UPLOADS_DIR, safeFilename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Attachment not found');
    }

    return new StreamableFile(createReadStream(filePath), {
      type: inferContentType(filePath),
      disposition: `inline; filename="${safeFilename}"`,
    });
  }
 @UseGuards(JwtAuthGuard)
  @Get()
  async getProjectsCount(@Req() req: any) {
    // Only Super Admin can view all projects count
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admin can view all projects count');
    }
    const count = await this.projectsService.getProjectsCount();
    return { count };
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

  @Get('client/milestones/:id/decision-history')
  async getClientMilestoneDecisionHistory(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limitRaw?: string,
  ) {
    if (req.user.role !== 'CLIENT') {
      throw new ForbiddenException('Only CLIENT can access milestone decision history');
    }

    const limit = Math.min(Math.max(Number(limitRaw) || 20, 1), 100);
    return this.projectsService.getMilestoneDecisionHistoryForUser(id, req.user, limit);
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

  @Get('director/qhse-managers/available')
  async getDirectorAvailableQhseManagers(@Req() req: any) {
    if (req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only DIRECTOR can access available QHSE managers');
    }

    return this.projectsService.getDirectorAvailableQhseManagers(req.user);
  }

  @Post('director/:id/assign-qhse')
  async assignQhseToProject(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: AssignQhseDto,
  ) {
    if (req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only DIRECTOR can assign QHSE managers');
    }

    return this.projectsService.assignQhseToProject(id, req.user, body, this.requestMeta(req));
  }

  @Post('pm/:id/qhse-reports')
  async submitQhseSiteReport(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: SubmitQhseReportDto,
  ) {
    if (req.user.role !== 'PROJECT_MANAGER') {
      throw new ForbiddenException('Only PROJECT_MANAGER can submit QHSE reports');
    }

    return this.projectsService.submitQhseSiteReport(id, req.user, body, this.requestMeta(req));
  }

  @Get('qhse/assigned-sites')
  async getQhseAssignedSites(@Req() req: any) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can access assigned sites');
    }

    return this.projectsService.getQhseAssignedSites(req.user);
  }

  @Get('qhse/dashboard-stats')
  async getQhseDashboardStats(@Req() req: any) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can access dashboard stats');
    }

    return this.projectsService.getQhseDashboardStats(req.user);
  }

  @Post('qhse/analyze-image')
  async analyzeQhseImage(@Req() req: any, @Body() body: { attachmentUrl?: string }) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can analyze assigned site images');
    }

    return this.projectsService.analyzeQhseSiteImage(req.user, body?.attachmentUrl || '');
  }

  @Post('qhse/analyze-site-average')
  async analyzeQhseSiteAverage(@Req() req: any, @Body() body: { projectId?: string }) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can analyze assigned site averages');
    }

    return this.projectsService.analyzeQhseSiteAverage(req.user, body?.projectId || '');
  }

  @Post('qhse/send-safety-report')
  async sendQhseSiteSafetyReport(@Req() req: any, @Body() body: { projectId?: string }) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can email safety reports');
    }

    return this.projectsService.sendQhseSiteSafetyReport(
      req.user,
      body?.projectId || '',
      this.requestMeta(req),
    );
  }

  @Post('qhse/preview-safety-report')
  async previewQhseSiteSafetyReport(@Req() req: any, @Body() body: { projectId?: string }) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can preview safety reports');
    }

    return this.projectsService.previewQhseSiteSafetyReport(req.user, body?.projectId || '');
  }

  @Get('qhse/reports/queue')
  async getQhseReportQueue(@Req() req: any) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can access QHSE report queue');
    }

    return this.projectsService.getQhseReportQueue(req.user);
  }

  @Post('qhse/reports/:id/review')
  async reviewQhseReport(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ReviewQhseReportDto,
  ) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can review QHSE reports');
    }

    return this.projectsService.reviewQhseReport(id, req.user, body, this.requestMeta(req));
  }

  @Get('qhse/reports/:id/actions')
  async getQhseCorrectiveActionsForReport(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can access corrective actions');
    }

    return this.projectsService.getQhseCorrectiveActionsForReport(id, req.user);
  }

  @Post('qhse/reports/:id/actions')
  async createQhseCorrectiveActions(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: CreateQhseCorrectiveActionsDto,
  ) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can create corrective actions');
    }

    return this.projectsService.createQhseCorrectiveActions(id, req.user, body, this.requestMeta(req));
  }

  @Put('qhse/actions/:id')
  async updateQhseCorrectiveAction(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateQhseCorrectiveActionDto,
  ) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can update corrective actions');
    }

    return this.projectsService.updateQhseCorrectiveAction(id, req.user, body, this.requestMeta(req));
  }

  @Post('qhse/actions/escalations/run')
  async runQhseEscalationPolicy(@Req() req: any, @Body() body: RunQhseEscalationDto) {
    if (req.user.role !== 'QHSE_MANAGER') {
      throw new ForbiddenException('Only QHSE_MANAGER can run escalation policy');
    }

    return this.projectsService.runQhseEscalationPolicy(req.user, body, this.requestMeta(req));
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

  @Get('director/construction-sites-map')
  async getDirectorConstructionSitesMap(
    @Req() req: any,
    @Query('projectManagerId') projectManagerId?: string,
  ) {
    if (req.user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only DIRECTOR can access construction sites map');
    }

    return this.projectsService.getDirectorConstructionSitesMap(req.user, projectManagerId);
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
  @Get(':id/planning-analysis')
  async getPlanningAnalysis(@Param('id') projectId: string, @Req() req: any) {
    return this.projectsService.calculateProjectPlanningAnalysis(projectId, req.user);
  }

  @Get(':id/planning-ai-audit')
  async getPlanningAiAudit(@Param('id') projectId: string, @Req() req: any) {
    return this.projectsService.getAiPlanningAudit(projectId, req.user);
  }
}
