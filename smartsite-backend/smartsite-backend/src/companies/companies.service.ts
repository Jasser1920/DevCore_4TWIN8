import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Company, CompanyStatus } from './company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  private async purgeExpiredSuspendedCompanies(): Promise<void> {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    await this.companyRepository.delete({
      status: CompanyStatus.SUSPENDED,
      updatedAt: LessThanOrEqual(threeDaysAgo),
    });
  }

  /* ==========================================
      Create Company (Super Admin Only)
  ========================================== */
  async createCompany(
    data: {
      name: string;
      description?: string;
      managerUserId?: string;
      contactEmail?: string;
      contactName?: string;
    },
    superAdminUserId: string,
  ): Promise<Company> {
    // Validate company name is unique
    const existingCompany = await this.companyRepository.findOne({
      where: { name: data.name },
    });

    if (existingCompany) {
      throw new BadRequestException('Company name already exists');
    }

    // Create company
    const company = this.companyRepository.create({
      name: data.name,
      description: data.description,
      ownerUserId: superAdminUserId,
      managerUserId: data.managerUserId,
      contactEmail: data.contactEmail,
      contactName: data.contactName,
      status: CompanyStatus.ACTIVE,
    });

    return this.companyRepository.save(company);
  }

  /* ==========================================
      Get All Companies
  ========================================== */
  async getAllCompanies(): Promise<Company[]> {
    await this.purgeExpiredSuspendedCompanies();

    return this.companyRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /* ==========================================
      Get Company by ID
  ========================================== */
  async getCompanyById(id: string): Promise<Company> {
    await this.purgeExpiredSuspendedCompanies();

    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  /* ==========================================
      Update Company
  ========================================== */
  async updateCompany(
    id: string,
    data: {
      name?: string;
      description?: string;
      managerUserId?: string;
      contactEmail?: string;
      contactName?: string;
      status?: CompanyStatus;
    },
  ): Promise<Company> {
    const company = await this.getCompanyById(id);

    // Check if new name is unique
    if (data.name && data.name !== company.name) {
      const existingCompany = await this.companyRepository.findOne({
        where: { name: data.name },
      });

      if (existingCompany) {
        throw new BadRequestException('Company name already exists');
      }
    }

    Object.assign(company, data);
    return this.companyRepository.save(company);
  }

  /* ==========================================
      Assign Manager to Company (DIRECTOR Only)
  ========================================== */
  async assignManager(companyId: string, managerUserId: string): Promise<Company> {
    const company = await this.getCompanyById(companyId);

    company.managerUserId = managerUserId;
    return this.companyRepository.save(company);
  }

  /* ==========================================
      Assign Project Manager to Company (DIRECTOR Only)
  ========================================== */
  async assignProjectManager(companyId: string, projectManagerId: string): Promise<Company> {
    const company = await this.getCompanyById(companyId);

    company.projectManagerId = projectManagerId;
    return this.companyRepository.save(company);
  }

  /* ==========================================
      Delete/Archive Company
  ========================================== */
  async deleteCompany(id: string): Promise<void> {
    const company = await this.getCompanyById(id);
    company.status = CompanyStatus.SUSPENDED;
    await this.companyRepository.save(company);
  }

  /* ==========================================
      Get Company by Manager User ID
  ========================================== */
  async getCompaniesByManager(managerUserId: string): Promise<Company[]> {
    await this.purgeExpiredSuspendedCompanies();

    return this.companyRepository.find({
      where: { managerUserId },
      order: { createdAt: 'DESC' },
    });
  }
}
