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
import { ConfigService } from '@nestjs/config';
import { Milestone, MilestoneStatus } from './milestone.entity';
import { QhseSiteReport } from './qhse-site-report.entity';
import { QhseCorrectiveAction } from './qhse-corrective-action.entity';
import { EmailService } from '../core/email.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepo: jest.Mocked<Repository<Project>>;
  let companiesRepo: jest.Mocked<Repository<Company>>;
  let strategicVisionRepo: jest.Mocked<Repository<StrategicVision>>;
  let milestonesRepo: jest.Mocked<Repository<Milestone>>;
  let qhseReportsRepo: jest.Mocked<Repository<QhseSiteReport>>;
  let qhseCorrectiveActionsRepo: jest.Mocked<Repository<QhseCorrectiveAction>>;

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
          provide: getRepositoryToken(Milestone),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(QhseSiteReport),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(QhseCorrectiveAction),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
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
        {
          provide: EmailService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectsRepo = module.get(getRepositoryToken(Project));
    companiesRepo = module.get(getRepositoryToken(Company));
    strategicVisionRepo = module.get(getRepositoryToken(StrategicVision));
    milestonesRepo = module.get(getRepositoryToken(Milestone));
    qhseReportsRepo = module.get(getRepositoryToken(QhseSiteReport));
    qhseCorrectiveActionsRepo = module.get(getRepositoryToken(QhseCorrectiveAction));

    jest.clearAllMocks();
    void qhseReportsRepo;
    void qhseCorrectiveActionsRepo;
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

  it('submits milestone with normalized attachments for PM', async () => {
    const milestone = {
      id: 'milestone-1',
      projectId: 'project-1',
      status: MilestoneStatus.PLANNED,
      evidenceSummary: '',
      evidenceAttachments: [],
    } as unknown as Milestone;

    milestonesRepo.findOne.mockResolvedValue(milestone);
    projectsRepo.findOne.mockResolvedValue({
      id: 'project-1',
      companyId: 'company-1',
      projectManagerId: 'pm-1',
      name: 'Project Alpha',
    } as unknown as Project);
    milestonesRepo.save.mockImplementation(async (value) => value as Milestone);

    const result = await service.submitMilestone(
      'milestone-1',
      { mongoId: 'pm-1', sub: 'pm-sub', preferred_username: 'pm' },
      {
        evidenceSummary: '  Evidence package ready  ',
        evidenceAttachments: [' /projects/uploads/a.pdf ', '', '/projects/uploads/b.png'],
      },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
      false,
    );

    expect(result.status).toBe(MilestoneStatus.SUBMITTED_FOR_CLIENT_VALIDATION);
    expect(result.evidenceSummary).toBe('Evidence package ready');
    expect(result.evidenceAttachments).toEqual(['/projects/uploads/a.pdf', '/projects/uploads/b.png']);
    expect(activityLogsServiceMock.logActivity).toHaveBeenCalled();
  });

  it('resubmits rejected milestone with new attachments for PM', async () => {
    const milestone = {
      id: 'milestone-2',
      projectId: 'project-2',
      status: MilestoneStatus.REJECTED_BY_CLIENT,
      evidenceSummary: 'old',
      evidenceAttachments: ['/projects/uploads/old.pdf'],
    } as unknown as Milestone;

    milestonesRepo.findOne.mockResolvedValue(milestone);
    projectsRepo.findOne.mockResolvedValue({
      id: 'project-2',
      companyId: 'company-1',
      projectManagerId: 'pm-1',
      name: 'Project Beta',
    } as unknown as Project);
    milestonesRepo.save.mockImplementation(async (value) => value as Milestone);

    const result = await service.submitMilestone(
      'milestone-2',
      { mongoId: 'pm-1', sub: 'pm-sub', preferred_username: 'pm' },
      {
        evidenceSummary: 'resubmitted proof',
        evidenceAttachments: ['/projects/uploads/new-proof.pdf'],
      },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
      true,
    );

    expect(result.status).toBe(MilestoneStatus.RESUBMITTED_FOR_CLIENT_VALIDATION);
    expect(result.evidenceAttachments).toEqual(['/projects/uploads/new-proof.pdf']);
    expect(activityLogsServiceMock.logActivity).toHaveBeenCalled();
  });

  it('returns client validation queue with attachment payloads', async () => {
    projectsRepo.find.mockResolvedValueOnce([
      { id: 'project-1', clientUserId: 'client-1' },
    ] as unknown as Project[]);

    milestonesRepo.find.mockResolvedValue([
      {
        id: 'milestone-1',
        projectId: 'project-1',
        status: MilestoneStatus.SUBMITTED_FOR_CLIENT_VALIDATION,
        evidenceAttachments: ['/projects/uploads/evidence-1.pdf'],
      },
    ] as unknown as Milestone[]);

    const queue = await service.getClientMilestoneValidationQueue({ mongoId: 'client-1' });

    expect(queue).toHaveLength(1);
    expect(queue[0].evidenceAttachments).toEqual(['/projects/uploads/evidence-1.pdf']);
  });

  it('denies attachment access for unauthorized users', async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        project: {
          projectManagerId: 'pm-owner',
          clientUserId: 'client-owner',
          companyId: 'company-1',
        },
      }),
    };

    milestonesRepo.createQueryBuilder.mockReturnValue(queryBuilder as any);

    const hasAccess = await service.canUserAccessMilestoneAttachment('evidence-1.pdf', {
      role: 'PROJECT_MANAGER',
      mongoId: 'pm-other',
    });

    expect(hasAccess).toBe(false);
  });

  it('denies attachment access when client assignment has changed', async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        project: {
          projectManagerId: 'pm-owner',
          clientUserId: 'client-new',
          companyId: 'company-1',
        },
      }),
    };

    milestonesRepo.createQueryBuilder.mockReturnValue(queryBuilder as any);

    const hasAccess = await service.canUserAccessMilestoneAttachment('evidence-1.pdf', {
      role: 'CLIENT',
      mongoId: 'client-old',
    });

    expect(hasAccess).toBe(false);
  });
});
