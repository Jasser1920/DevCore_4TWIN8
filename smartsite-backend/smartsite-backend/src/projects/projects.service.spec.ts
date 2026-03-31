import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus } from './project.entity';
import { ProjectValidationHistory } from './project-validation-history.entity';
import { Company } from '../companies/company.entity';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UsersService } from '../users/users.service';
import { StrategicVision } from '../strategic-vision/strategic-vision.entity';
import { BadRequestException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepo: jest.Mocked<Repository<Project>>;
  let companiesRepo: jest.Mocked<Repository<Company>>;
  let strategicVisionRepo: jest.Mocked<Repository<StrategicVision>>;

  const activityLogsServiceMock = {
    logActivity: jest.fn(),
  };

  const usersServiceMock = {
    getAllUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProjectValidationHistory),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Company),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StrategicVision),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ActivityLogsService,
          useValue: activityLogsServiceMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectsRepo = module.get(getRepositoryToken(Project));
    companiesRepo = module.get(getRepositoryToken(Company));
    strategicVisionRepo = module.get(getRepositoryToken(StrategicVision));

    jest.clearAllMocks();
  });

  it('returns zero burn rate when planned budget is zero', async () => {
    companiesRepo.findOne.mockResolvedValue({ id: 'company-1' } as Company);
    projectsRepo.findOne.mockResolvedValue({
      id: 'project-1',
      companyId: 'company-1',
      name: 'Zero Planned',
      currency: 'USD',
      budgetPlanned: 0,
      budgetConsumed: 120,
      status: ProjectStatus.ACTIVE,
      updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    } as unknown as Project);

    const result = await service.getDirectorProjectFinancialKpis('project-1', {
      mongoId: 'director-1',
    });

    expect(result.plannedBudget).toBe(0);
    expect(result.consumedBudget).toBe(120);
    expect(result.burnRatePercent).toBe(0);
    expect(result.varianceAmount).toBe(-120);
    expect(result.variancePercent).toBe(0);
  });

  it('treats missing budget values as zero', async () => {
    companiesRepo.findOne.mockResolvedValue({ id: 'company-1' } as Company);
    projectsRepo.findOne.mockResolvedValue({
      id: 'project-2',
      companyId: 'company-1',
      name: 'Missing Budget',
      currency: 'USD',
      budgetPlanned: null,
      budgetConsumed: null,
      status: ProjectStatus.APPROVED,
      updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    } as unknown as Project);

    const result = await service.getDirectorProjectFinancialKpis('project-2', {
      mongoId: 'director-1',
    });

    expect(result.plannedBudget).toBe(0);
    expect(result.consumedBudget).toBe(0);
    expect(result.burnRatePercent).toBe(0);
    expect(result.varianceAmount).toBe(0);
    expect(result.variancePercent).toBe(0);
  });

  it('returns paginated overview with risk and core columns', async () => {
    companiesRepo.findOne.mockResolvedValue({ id: 'company-1' } as Company);
    usersServiceMock.getAllUsers.mockResolvedValue([
      {
        _id: 'pm-1',
        role: 'PROJECT_MANAGER',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@smartsite.com',
      },
      {
        _id: 'pm-2',
        role: 'PROJECT_MANAGER',
        firstName: 'Sara',
        lastName: 'Lane',
        email: 'sara@smartsite.com',
      },
    ]);
    projectsRepo.find.mockResolvedValue([
      {
        id: 'project-1',
        name: 'Tower A',
        code: 'TA-01',
        status: ProjectStatus.ACTIVE,
        projectManagerId: 'pm-1',
        budgetPlanned: 1000,
        budgetConsumed: 900,
        currency: 'USD',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
      },
      {
        id: 'project-2',
        name: 'Tower B',
        code: 'TB-01',
        status: ProjectStatus.APPROVED,
        projectManagerId: 'pm-2',
        budgetPlanned: 1000,
        budgetConsumed: 200,
        currency: 'USD',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        updatedAt: new Date('2026-03-21T00:00:00.000Z'),
      },
    ] as unknown as Project[]);

    const result = await service.getDirectorActiveProjectsOverview(
      { mongoId: 'director-1' },
      { page: 1, pageSize: 1, sortBy: 'lastUpdatedAt', sortOrder: 'desc' },
    );

    expect(result.pagination.total).toBe(2);
    expect(result.data.length).toBe(1);
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        status: expect.any(String),
        projectManagerId: expect.any(String),
        budgetConsumptionPercent: expect.any(Number),
        progressPercent: expect.any(Number),
        risk: expect.any(String),
        lastUpdatedAt: expect.any(Date),
      }),
    );
  });

  it('blocks submit when PM already has 3 ongoing projects', async () => {
    projectsRepo.findOne.mockResolvedValue({
      id: 'project-1',
      companyId: 'company-1',
      projectManagerId: 'pm-1',
      name: 'Draft Project',
      code: 'PRJ-001',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
      status: ProjectStatus.DRAFT,
    } as unknown as Project);

    strategicVisionRepo.findOne.mockResolvedValue({
      companyId: 'company-1',
      status: 'APPROVED',
    } as unknown as StrategicVision);

    projectsRepo.find.mockResolvedValue([
      { id: 'ongoing-1', status: ProjectStatus.ACTIVE },
      { id: 'ongoing-2', status: ProjectStatus.ACTIVE },
      { id: 'ongoing-3', status: ProjectStatus.SUBMITTED_FOR_VALIDATION },
    ] as unknown as Project[]);

    await expect(
      service.submitProject(
        'project-1',
        { mongoId: 'pm-1', sub: 'pm-sub-1' },
        { ipAddress: '127.0.0.1', userAgent: 'jest' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
