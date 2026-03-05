import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { EmailService } from '../core/email.service';

@Controller('companies')
export class CompaniesController {
  constructor(
    private companiesService: CompaniesService,
    private usersService: UsersService,
    private activityLogsService: ActivityLogsService,
    private emailService: EmailService,
  ) {}

  private getRequestMeta(req: any) {
    return {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.['user-agent'] || undefined,
      performedBy: req.user?.sub,
    };
  }

  /* ==========================================
      ✅ Create Company (Super Admin Only)
  ========================================== */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createCompany(
    @Request() req: any,
    @Body() body: CreateCompanyDto,
  ) {
    const user = req.user;

    // Verify Super Admin role
    if (user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only Super Admin can create companies');
    }

    // Validate manager is DIRECTOR role if provided
    if (body.managerUserId) {
      const manager = await this.usersService.getUserById(body.managerUserId);

      if (!manager) {
        throw new BadRequestException('Manager user not found');
      }

      if (manager.role !== 'DIRECTOR') {
        throw new BadRequestException(
          'Only users with DIRECTOR role can be assigned as company manager',
        );
      }
    }

    // Use mongoId for ownerUserId (the Super Admin's MongoDB _id)
    const company = await this.companiesService.createCompany(body, user.mongoId);

    await this.activityLogsService.logActivity({
      userId: user.mongoId || user.sub,
      username: user.preferred_username || user.username || user.email || 'super_admin',
      action: 'COMPANY_CREATED',
      description: `Company ${company.name} created by Super Admin`,
      details: {
        companyId: company.id,
        companyName: company.name,
        managerUserId: company.managerUserId || null,
        contactEmail: company.contactEmail || null,
        status: company.status,
      },
      status: 'SUCCESS',
      ...this.getRequestMeta(req),
    });

    return company;
  }

  /* ==========================================
      📋 Get All Companies
  ========================================== */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllCompanies(@Request() req: any) {
    const user = req.user;

    // Only Super Admin can view all companies
    if (user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only Super Admin can view all companies');
    }

    const companies = await this.companiesService.getAllCompanies();
    return { data: companies };
  }

  /* ==========================================
      � Get DIRECTOR Users Only (for manager selection)
      NOTE: This MUST come before @Get(':id') route
  ========================================== */
  @UseGuards(JwtAuthGuard)
  @Get('managers/available')
  async getAvailableDirectors(@Request() req: any) {
    const user = req.user;

    // Only Super Admin can view all managers
    if (user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException(
        'Only Super Admin can view available managers',
      );
    }

    // Get all users with DIRECTOR role
    const allUsers = await this.usersService.getAllUsers();
    const directors = allUsers.filter((u: any) => u.role === 'DIRECTOR');

    return {
      data: directors.map((director: any) => ({
        id: director._id,
        username: director.username,
        email: director.email,
        firstName: director.firstName,
        lastName: director.lastName,
        role: director.role,
        isEmailVerified: director.isEmailVerified,
      })),
      count: directors.length,
    };
  }

  /* ==========================================
      Get PROJECT_MANAGER Users Only (for PM selection)
      NOTE: This MUST come before @Get(':id') route
  ========================================== */
  @UseGuards(JwtAuthGuard)
  @Get('project-managers/available')
  async getAvailableProjectManagers(@Request() req: any) {
    const user = req.user;

    // Only DIRECTOR can view available project managers
    if (user.role !== 'DIRECTOR') {
      throw new BadRequestException(
        'Only DIRECTOR can view available project managers',
      );
    }

    // Get all users with PROJECT_MANAGER role
    const allUsers = await this.usersService.getAllUsers();
    const projectManagers = allUsers.filter((u: any) => u.role === 'PROJECT_MANAGER');

    return {
      data: projectManagers.map((pm: any) => ({
        id: pm._id,
        username: pm.username,
        email: pm.email,
        firstName: pm.firstName,
        lastName: pm.lastName,
        role: pm.role,
        isEmailVerified: pm.isEmailVerified,
      })),
      count: projectManagers.length,
    };
  }

  /* ==========================================
      🏢 Get Current Director Assigned Company
      NOTE: This MUST come before @Get(':id') route
  ========================================== */
  @UseGuards(JwtAuthGuard)
  @Get('my-company')
  async getMyCompany(@Request() req: any) {
    const user = req.user;

    if (user.role !== 'DIRECTOR') {
      throw new BadRequestException('Only DIRECTOR can access assigned company');
    }

    const companies = await this.companiesService.getCompaniesByManager(user.mongoId);

    return {
      data: companies[0] || null,
    };
  }

  /* ==========================================
      �🔍 Get Company by ID
  ========================================== */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getCompanyById(@Param('id') id: string) {
    return this.companiesService.getCompanyById(id);
  }

  /* ==========================================
      ✏️ Update Company
  ========================================== */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCompany(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: UpdateCompanyDto,
  ) {
    const user = req.user;

    // Verify Super Admin role
    if (user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only Super Admin can update companies');
    }

    // Get current company to check if manager is being changed
    const currentCompany = await this.companiesService.getCompanyById(id);
    const isManagerBeingAssigned =
      body.managerUserId && body.managerUserId !== currentCompany.managerUserId;

    // Validate new manager is DIRECTOR role if provided
    if (body.managerUserId) {
      const manager = await this.usersService.getUserById(body.managerUserId);

      if (!manager) {
        throw new BadRequestException('Manager user not found');
      }

      if (manager.role !== 'DIRECTOR') {
        throw new BadRequestException(
          'Only users with DIRECTOR role can be assigned as company manager',
        );
      }
    }

    const updatedCompany = await this.companiesService.updateCompany(id, body);

    // Send email notification if director is being assigned
    if (isManagerBeingAssigned && body.managerUserId) {
      try {
        const director = await this.usersService.getUserById(body.managerUserId);
        if (director && director.email) {
          await this.emailService.sendDirectorAssignmentNotification(
            director.email,
            director.firstName && director.lastName
              ? `${director.firstName} ${director.lastName}`
              : director.username || director.email,
            updatedCompany,
          );
        }
      } catch (emailError) {
        // Log error but don't fail the request
        console.error('Failed to send director assignment email:', emailError);
      }
    }

    await this.activityLogsService.logActivity({
      userId: user.mongoId || user.sub,
      username: user.preferred_username || user.username || user.email || 'super_admin',
      action: 'COMPANY_UPDATED',
      description: `Company ${updatedCompany.name} updated by Super Admin`,
      details: {
        companyId: updatedCompany.id,
        companyName: updatedCompany.name,
        updatedFields: Object.keys(body),
        updates: body,
        directorAssigned: isManagerBeingAssigned,
      },
      status: 'SUCCESS',
      ...this.getRequestMeta(req),
    });

    return updatedCompany;
  }

  /* ==========================================
      🗑️ Delete Company
  ========================================== */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteCompany(@Param('id') id: string, @Request() req: any) {
    const user = req.user;

    // Verify Super Admin role
    if (user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only Super Admin can delete companies');
    }

    const company = await this.companiesService.getCompanyById(id);
    await this.companiesService.deleteCompany(id);

    await this.activityLogsService.logActivity({
      userId: user.mongoId || user.sub,
      username: user.preferred_username || user.username || user.email || 'super_admin',
      action: 'COMPANY_DELETED',
      description: `Company ${company.name} archived by Super Admin`,
      details: {
        companyId: company.id,
        companyName: company.name,
        newStatus: 'SUSPENDED',
      },
      status: 'SUCCESS',
      ...this.getRequestMeta(req),
    });

    return { message: 'Company deleted successfully' };
  }

  /* ==========================================
      Assign Project Manager to Company (DIRECTOR Only)
  ========================================== */
  @UseGuards(JwtAuthGuard)
  @Post(':id/assign-project-manager')
  async assignProjectManager(
    @Param('id') companyId: string,
    @Request() req: any,
    @Body() body: { projectManagerId: string },
  ) {
    const user = req.user;

    // Verify user is DIRECTOR
    if (user.role !== 'DIRECTOR') {
      throw new BadRequestException('Only DIRECTOR can assign project managers');
    }

    // Verify the director manages this company
    const companies = await this.companiesService.getCompaniesByManager(user.mongoId);
    const isManagerOfCompany = companies.some((c) => c.id === companyId);

    if (!isManagerOfCompany) {
      throw new BadRequestException('You can only assign project managers to your own company');
    }

    // Validate project manager exists and has correct role
    if (body.projectManagerId) {
      const projectManager = await this.usersService.getUserById(body.projectManagerId);

      if (!projectManager) {
        throw new BadRequestException('Project Manager user not found');
      }

      if (projectManager.role !== 'PROJECT_MANAGER') {
        throw new BadRequestException(
          'Only users with PROJECT_MANAGER role can be assigned',
        );
      }
    }

    const updatedCompany = await this.companiesService.assignProjectManager(
      companyId,
      body.projectManagerId,
    );

    await this.activityLogsService.logActivity({
      userId: user.mongoId || user.sub,
      username: user.preferred_username || user.username || user.email || 'director',
      action: 'PM_ASSIGNED',
      description: `Project Manager assigned to ${updatedCompany.name}`,
      details: {
        companyId: updatedCompany.id,
        companyName: updatedCompany.name,
        projectManagerId: body.projectManagerId,
      },
      status: 'SUCCESS',
      ...this.getRequestMeta(req),
    });

    return {
      message: 'Project Manager assigned successfully',
      data: updatedCompany,
    };
  }
}
