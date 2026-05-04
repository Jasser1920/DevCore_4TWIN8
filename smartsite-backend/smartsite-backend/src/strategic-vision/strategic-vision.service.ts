import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StrategicVision, StrategicVisionStatus } from './strategic-vision.entity';
import { CreateStrategicVisionDto, UpdateStrategicVisionDto, ValidateStrategicVisionDto } from './strategic-vision.dto';
import { Company } from '../companies/company.entity';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class StrategicVisionService {
  constructor(
    @InjectRepository(StrategicVision)
    private readonly strategicVisionRepository: Repository<StrategicVision>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  private isUserAssignedToCompany(user: any, company: Company): boolean {
    const pmIds = Array.isArray(company.projectManagerIds)
      ? [...company.projectManagerIds]
      : [];

    if (company.projectManagerId && !pmIds.includes(company.projectManagerId)) {
      pmIds.push(company.projectManagerId);
    }

    if (user.role === 'DIRECTOR') {
      return company.managerUserId === user.mongoId;
    }

    if (user.role === 'PROJECT_MANAGER') {
      return pmIds.includes(user.mongoId);
    }

    return false;
  }

  private assertVisionAccess(user: any, company: Company) {
    if (!['DIRECTOR', 'PROJECT_MANAGER'].includes(user.role)) {
      throw new ForbiddenException('Only Director or Project Manager can manage strategic vision');
    }

    if (!this.isUserAssignedToCompany(user, company)) {
      throw new ForbiddenException('You are not assigned to this company');
    }
  }

  private assertDirectorValidationAccess(user: any, company: Company) {
    if (user.role !== 'DIRECTOR') {
      throw new ForbiddenException('Only Director can validate strategic vision');
    }

    if (company.managerUserId !== user.mongoId) {
      throw new ForbiddenException('You can only validate strategic vision for your company');
    }
  }

  async createStrategicVision(
    companyId: string,
    dto: CreateStrategicVisionDto,
    reqUser: any,
    ipAddress: string,
    userAgent: string,
  ): Promise<StrategicVision> {
    // Validate company exists
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    this.assertVisionAccess(reqUser, company);

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const now = new Date();

    if (startDate < now) {
      throw new BadRequestException('Start date must be in the future');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Calculate duration in months
    const durationInMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    if (durationInMonths < 1 || durationInMonths > 60) {
      throw new BadRequestException('Project duration must be between 1 and 60 months');
    }

    // Validate budget
    if (dto.projectBudget <= 0) {
      throw new BadRequestException('Budget must be greater than 0');
    }

    // Check budget ceiling (max $10M)
    const MAX_BUDGET_CEILING = 10000000;
    const budgetCeiling = Math.min(dto.projectBudget * 1.2, MAX_BUDGET_CEILING);

    if (dto.projectBudget > budgetCeiling) {
      throw new BadRequestException(`Budget cannot exceed ceiling of $${budgetCeiling.toLocaleString()}`);
    }

    // Validate KPIs
    if (!dto.globalKPIs || dto.globalKPIs.length === 0) {
      throw new BadRequestException('At least one KPI is required');
    }

    dto.globalKPIs.forEach((kpi, index) => {
      if (!kpi.name || !kpi.unit || kpi.target === undefined) {
        throw new BadRequestException(`KPI ${index + 1}: name, unit, and target are required`);
      }
      if (kpi.target < 0) {
        throw new BadRequestException(`KPI ${index + 1}: target must be non-negative`);
      }
    });

    // Check if strategic vision already exists
    const existingVision = await this.strategicVisionRepository.findOne({
      where: { companyId },
    });

    if (existingVision && existingVision.status !== StrategicVisionStatus.REJECTED) {
      throw new BadRequestException('A strategic vision already exists for this company');
    }

    // Create new strategic vision
    const strategicVision = this.strategicVisionRepository.create({
      companyId,
      projectBudget: dto.projectBudget,
      currency: dto.currency || 'USD',
      startDate,
      endDate,
      globalKPIs: dto.globalKPIs,
      status: StrategicVisionStatus.PENDING_VALIDATION,
      directorUserId: reqUser.sub,
      budgetCeiling,
    });

    await this.strategicVisionRepository.save(strategicVision);

    // Log activity
    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email || 'user',
      action: 'STRATEGIC_VISION_CREATED',
      description: `Strategic vision created for ${company.name}`,
      details: {
        companyId,
        budget: strategicVision.projectBudget,
        durationMonths: durationInMonths,
        kpisCount: dto.globalKPIs.length,
      },
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return strategicVision;
  }

  async getStrategicVision(companyId: string): Promise<StrategicVision> {
    const vision = await this.strategicVisionRepository.findOne({
      where: { companyId },
      relations: ['company'],
    });

    if (!vision) {
      throw new NotFoundException('Strategic vision not found for this company');
    }

    return vision;
  }

  async updateStrategicVision(
    visionId: string,
    dto: UpdateStrategicVisionDto,
    reqUser: any,
    ipAddress: string,
    userAgent: string,
  ): Promise<StrategicVision> {
    const vision = await this.strategicVisionRepository.findOne({
      where: { id: visionId },
      relations: ['company'],
    });

    if (!vision) {
      throw new NotFoundException('Strategic vision not found');
    }

    this.assertVisionAccess(reqUser, vision.company);

    if (vision.status === StrategicVisionStatus.APPROVED) {
      throw new ForbiddenException('Cannot update an approved strategic vision');
    }

    // Validate new dates if provided
    if (dto.startDate || dto.endDate) {
      const startDate = new Date(dto.startDate || vision.startDate);
      const endDate = new Date(dto.endDate || vision.endDate);
      const now = new Date();

      if (startDate < now) {
        throw new BadRequestException('Start date must be in the future');
      }

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }

      const durationInMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
      if (durationInMonths < 1 || durationInMonths > 60) {
        throw new BadRequestException('Project duration must be between 1 and 60 months');
      }
    }

    // Validate budget if provided
    if (dto.projectBudget !== undefined) {
      if (dto.projectBudget <= 0) {
        throw new BadRequestException('Budget must be greater than 0');
      }

      const MAX_BUDGET_CEILING = 10000000;
      const budgetCeiling = Math.min(dto.projectBudget * 1.2, MAX_BUDGET_CEILING);

      if (dto.projectBudget > budgetCeiling) {
        throw new BadRequestException(`Budget cannot exceed ceiling of $${budgetCeiling.toLocaleString()}`);
      }

      vision.budgetCeiling = budgetCeiling;
    }

    // Validate KPIs if provided
    if (dto.globalKPIs) {
      if (dto.globalKPIs.length === 0) {
        throw new BadRequestException('At least one KPI is required');
      }

      dto.globalKPIs.forEach((kpi, index) => {
        if (!kpi.name || !kpi.unit || kpi.target === undefined) {
          throw new BadRequestException(`KPI ${index + 1}: name, unit, and target are required`);
        }
        if (kpi.target < 0) {
          throw new BadRequestException(`KPI ${index + 1}: target must be non-negative`);
        }
      });
    }

    // Update fields
    Object.assign(vision, {
      ...dto,
      status: StrategicVisionStatus.PENDING_VALIDATION, // Reset to PENDING when updated
    });

    await this.strategicVisionRepository.save(vision);

    // Log activity
    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email || 'user',
      action: 'STRATEGIC_VISION_UPDATED',
      description: `Strategic vision updated for ${vision.company.name}`,
      details: { visionId, changes: dto },
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return vision;
  }

  async validateStrategicVision(
    visionId: string,
    dto: ValidateStrategicVisionDto,
    reqUser: any,
    ipAddress: string,
    userAgent: string,
  ): Promise<StrategicVision> {
    const vision = await this.strategicVisionRepository.findOne({
      where: { id: visionId },
      relations: ['company'],
    });

    if (!vision) {
      throw new NotFoundException('Strategic vision not found');
    }

    this.assertDirectorValidationAccess(reqUser, vision.company);

    if (vision.status === StrategicVisionStatus.APPROVED) {
      throw new BadRequestException('Strategic vision is already approved');
    }

    const newStatus = dto.status === 'APPROVED' ? StrategicVisionStatus.APPROVED : StrategicVisionStatus.REJECTED;

    vision.status = newStatus;
    vision.validatedByUserId = reqUser.sub;
    vision.validationNotes = dto.validationNotes || '';
    vision.validatedAt = new Date();

    await this.strategicVisionRepository.save(vision);

    // Log activity
    await this.activityLogsService.logActivity({
      userId: reqUser.sub,
      username: reqUser.preferred_username || reqUser.username || reqUser.email || 'user',
      action: dto.status === 'APPROVED' ? 'STRATEGIC_VISION_APPROVED' : 'STRATEGIC_VISION_REJECTED',
      description: `Strategic vision ${dto.status.toLowerCase()} for ${vision.company.name}`,
      details: { visionId, notes: dto.validationNotes },
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return vision;
  }

  async getByCompanyId(companyId: string): Promise<StrategicVision | null> {
    return this.strategicVisionRepository.findOne({
      where: { companyId },
      relations: ['company'],
    });
  }
}
