import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLogData } from '../activity-logs/activity-logs.service';
import { Notification, NotificationRole } from './notification.entity';
import { Project } from '../projects/project.entity';
import { Milestone } from '../projects/milestone.entity';
import { Company } from '../companies/company.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Milestone)
    private readonly milestonesRepository: Repository<Milestone>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  private readonly supportedRoles: NotificationRole[] = [
    'SUPER_ADMIN',
    'DIRECTOR',
    'PROJECT_MANAGER',
    'CLIENT',
  ];

  private readonly recipientsByAction: Record<string, NotificationRole[]> = {
    USER_CREATED: ['SUPER_ADMIN'],
    USER_UPDATED: ['SUPER_ADMIN'],
    USER_DELETED: ['SUPER_ADMIN'],
    COMPANY_CREATED: ['SUPER_ADMIN'],
    COMPANY_UPDATED: ['SUPER_ADMIN'],
    COMPANY_DELETED: ['SUPER_ADMIN'],
    DELETION_REQUESTED: ['SUPER_ADMIN'],

    PM_ASSIGNED: ['DIRECTOR', 'PROJECT_MANAGER', 'SUPER_ADMIN'],
    PM_UNASSIGNED: ['DIRECTOR', 'PROJECT_MANAGER', 'SUPER_ADMIN'],
    PROJECT_SUBMITTED: ['DIRECTOR'],
    PROJECT_RESUBMITTED: ['DIRECTOR'],
    STRATEGIC_VISION_CREATED: ['DIRECTOR'],
    STRATEGIC_VISION_UPDATED: ['DIRECTOR'],

    // Cross-role project lifecycle events
    PROJECT_APPROVED: ['DIRECTOR', 'PROJECT_MANAGER', 'SUPER_ADMIN', 'CLIENT'],
    PROJECT_REJECTED: ['DIRECTOR', 'PROJECT_MANAGER', 'SUPER_ADMIN', 'CLIENT'],
    PROJECT_STARTED: ['DIRECTOR', 'PROJECT_MANAGER', 'SUPER_ADMIN', 'CLIENT'],

    // Milestone decisions
    MILESTONE_APPROVED_BY_CLIENT: ['PROJECT_MANAGER'],
    MILESTONE_REJECTED_BY_CLIENT: ['PROJECT_MANAGER'],
    MILESTONE_APPROVED_BY_PM: ['DIRECTOR', 'PROJECT_MANAGER', 'SUPER_ADMIN'],
    MILESTONE_REJECTED_BY_PM: ['DIRECTOR', 'PROJECT_MANAGER', 'SUPER_ADMIN'],
    MILESTONE_APPROVED_BY_DIRECTOR: ['PROJECT_MANAGER', 'SUPER_ADMIN'],
    MILESTONE_REJECTED_BY_DIRECTOR: ['PROJECT_MANAGER', 'SUPER_ADMIN'],
    PROJECT_CLIENT_ASSIGNED: ['PROJECT_MANAGER', 'CLIENT'],
  };

  private readonly titleByAction: Record<string, string> = {
    USER_CREATED: 'New User Created',
    USER_UPDATED: 'User Updated',
    USER_DELETED: 'User Deleted',
    COMPANY_CREATED: 'Company Created',
    COMPANY_UPDATED: 'Company Updated',
    COMPANY_DELETED: 'Company Deleted',
    DELETION_REQUESTED: 'Account Deletion Requested',

    PM_ASSIGNED: 'Project Manager Assigned',
    PM_UNASSIGNED: 'Project Manager Unassigned',
    PROJECT_SUBMITTED: 'Project Submitted For Validation',
    PROJECT_RESUBMITTED: 'Project Resubmitted For Validation',
    STRATEGIC_VISION_CREATED: 'Strategic Vision Submitted',
    STRATEGIC_VISION_UPDATED: 'Strategic Vision Updated',

    // Cross-role project lifecycle events
    PROJECT_APPROVED: 'Project Approved',
    PROJECT_REJECTED: 'Project Rejected',
    PROJECT_STARTED: 'Project Started',

    // Milestone decisions
    MILESTONE_APPROVED_BY_CLIENT: 'Milestone Approved By Client',
    MILESTONE_REJECTED_BY_CLIENT: 'Milestone Rejected By Client',
    MILESTONE_APPROVED_BY_PM: 'Milestone Approved By Project Manager',
    MILESTONE_REJECTED_BY_PM: 'Milestone Rejected By Project Manager',
    MILESTONE_APPROVED_BY_DIRECTOR: 'Milestone Approved By Director',
    MILESTONE_REJECTED_BY_DIRECTOR: 'Milestone Rejected By Director',
    PROJECT_CLIENT_ASSIGNED: 'Client Assigned To Project',
    MILESTONE_SUBMITTED: 'Milestone Submitted For Client Validation',
    MILESTONE_RESUBMITTED: 'Milestone Resubmitted For Client Validation',
  };

  isSupportedRole(role?: string): role is NotificationRole {
    if (!role) return false;
    return this.supportedRoles.includes(role as NotificationRole);
  }

  private async resolveRoleTargets(
    action: string,
    activity: ActivityLogData,
  ): Promise<Partial<Record<NotificationRole, string[]>>> {
    const details = activity.details || {};
    const roleTargets: Partial<Record<NotificationRole, string[]>> = {};

    if (
      [
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'COMPANY_CREATED',
        'COMPANY_UPDATED',
        'COMPANY_DELETED',
      ].includes(action)
    ) {
      // SUPER_ADMIN operations are targeted to the acting admin.
      roleTargets.SUPER_ADMIN = activity.performedBy ? [activity.performedBy] : [];
      return roleTargets;
    }

    if (action === 'DELETION_REQUESTED') {
      // Optional future hook for explicit assignment of the responsible admin.
      const assignedAdminUserId =
        (details.assignedAdminUserId as string | undefined) ||
        (details.assignedToAdminId as string | undefined);

      roleTargets.SUPER_ADMIN = assignedAdminUserId ? [assignedAdminUserId] : [];
      return roleTargets;
    }

    if (
      [
        'PROJECT_APPROVED',
        'PROJECT_REJECTED',
        'PROJECT_STARTED',
        'PROJECT_CLIENT_ASSIGNED',
      ].includes(action)
    ) {
      // Cross-role project lifecycle notifications
      const projectId = details.projectId as string | undefined;
      if (!projectId) return roleTargets;

      const project = await this.projectsRepository.findOne({
        where: { id: projectId },
        relations: ['company'],
      });

      if (!project) return roleTargets;

      // PROJECT_MANAGER gets the PM assigned to the project
      if (project.projectManagerId) {
        roleTargets.PROJECT_MANAGER = [project.projectManagerId];
      }

      // DIRECTOR gets the director assigned to the project or company manager
      const directorId = (project as any).directorId || project.company?.managerUserId;
      if (directorId) {
        roleTargets.DIRECTOR = [directorId];
      }

      // SUPER_ADMIN gets the company owner
      if (project.company?.ownerUserId) {
        roleTargets.SUPER_ADMIN = [project.company.ownerUserId];
      }

      if (project.clientUserId) {
        roleTargets.CLIENT = [project.clientUserId];
      }

      return roleTargets;
    }

    if (['PROJECT_SUBMITTED', 'PROJECT_RESUBMITTED'].includes(action)) {
      const projectId = details.projectId as string | undefined;
      if (!projectId) return roleTargets;
      const project = await this.projectsRepository.findOne({ where: { id: projectId } });
      roleTargets.DIRECTOR = project?.directorId ? [project.directorId] : [];
      return roleTargets;
    }

    if ([
      'MILESTONE_APPROVED_BY_PM',
      'MILESTONE_REJECTED_BY_PM',
      'MILESTONE_APPROVED_BY_DIRECTOR',
      'MILESTONE_REJECTED_BY_DIRECTOR',
    ].includes(action)) {
      // Cross-role milestone decision notifications
      const milestoneId = details.milestoneId as string | undefined;
      if (!milestoneId) return roleTargets;

      const milestone = await this.milestonesRepository.findOne({
        where: { id: milestoneId },
      });
      if (!milestone) return roleTargets;

      const project = await this.projectsRepository.findOne({
        where: { id: milestone.projectId },
        relations: ['company'],
      });
      if (!project) return roleTargets;

      // For PM/DIRECTOR decisions: all three roles get notified
      if (['MILESTONE_APPROVED_BY_PM', 'MILESTONE_REJECTED_BY_PM'].includes(action)) {
        if (project.projectManagerId) {
          roleTargets.PROJECT_MANAGER = [project.projectManagerId];
        }

        const directorId = (project as any).directorId || project.company?.managerUserId;
        if (directorId) {
          roleTargets.DIRECTOR = [directorId];
        }

        if (project.company?.ownerUserId) {
          roleTargets.SUPER_ADMIN = [project.company.ownerUserId];
        }
      }

      // For DIRECTOR decisions: PM and SUPER_ADMIN get notified
      if (['MILESTONE_APPROVED_BY_DIRECTOR', 'MILESTONE_REJECTED_BY_DIRECTOR'].includes(action)) {
        if (project.projectManagerId) {
          roleTargets.PROJECT_MANAGER = [project.projectManagerId];
        }

        if (project.company?.ownerUserId) {
          roleTargets.SUPER_ADMIN = [project.company.ownerUserId];
        }
      }

      return roleTargets;
    }

    if (['MILESTONE_APPROVED_BY_CLIENT', 'MILESTONE_REJECTED_BY_CLIENT'].includes(action)) {
      const milestoneId = details.milestoneId as string | undefined;
      if (!milestoneId) return roleTargets;

      const milestone = await this.milestonesRepository.findOne({ where: { id: milestoneId } });
      if (!milestone) return roleTargets;

      const project = await this.projectsRepository.findOne({ where: { id: milestone.projectId } });
      roleTargets.PROJECT_MANAGER = project?.projectManagerId ? [project.projectManagerId] : [];
      return roleTargets;
    }

    if (['MILESTONE_SUBMITTED', 'MILESTONE_RESUBMITTED'].includes(action)) {
      const milestoneId = details.milestoneId as string | undefined;
      if (!milestoneId) return roleTargets;

      const milestone = await this.milestonesRepository.findOne({ where: { id: milestoneId } });
      if (!milestone) return roleTargets;

      const project = await this.projectsRepository.findOne({ where: { id: milestone.projectId } });
      if (project?.clientUserId) {
        roleTargets.CLIENT = [project.clientUserId];
      }

      return roleTargets;
    }

    if (['STRATEGIC_VISION_CREATED', 'STRATEGIC_VISION_UPDATED'].includes(action)) {
      const companyId = details.companyId as string | undefined;
      if (!companyId) return roleTargets;

      const company = await this.companiesRepository.findOne({ where: { id: companyId } });
      roleTargets.DIRECTOR = company?.managerUserId ? [company.managerUserId] : [];
      return roleTargets;
    }

    if (['PM_ASSIGNED', 'PM_UNASSIGNED'].includes(action)) {
      const companyId = details.companyId as string | undefined;
      const company = companyId
        ? await this.companiesRepository.findOne({ where: { id: companyId } })
        : null;

      const pmTarget =
        (details.assignedProjectManagerId as string | undefined) ||
        (details.removedProjectManagerId as string | undefined);

      roleTargets.DIRECTOR = company?.managerUserId ? [company.managerUserId] : [];
      roleTargets.PROJECT_MANAGER = pmTarget ? [pmTarget] : [];
      roleTargets.SUPER_ADMIN = company?.ownerUserId ? [company.ownerUserId] : [];
      return roleTargets;
    }

    return roleTargets;
  }

  async createFromActivity(activity: ActivityLogData): Promise<void> {
    const recipients = this.recipientsByAction[activity.action] || [];
    if (!recipients.length) {
      return;
    }

    const title = this.titleByAction[activity.action] || activity.action.replace(/_/g, ' ');
    const message = activity.description || title;

    const roleTargets = await this.resolveRoleTargets(activity.action, activity);
    const records: Notification[] = [];

    for (const role of recipients) {
      const targetUserIds = roleTargets[role] || [];

      if (targetUserIds.length) {
        for (const recipientUserId of targetUserIds) {
          records.push(
            this.notificationsRepository.create({
              recipientRole: role,
              recipientUserId,
              title,
              message,
              action: activity.action,
              metadata: {
                details: activity.details || {},
                status: activity.status || 'SUCCESS',
                performedBy: activity.performedBy || null,
                sourceUserId: activity.userId,
                sourceUsername: activity.username,
              },
              isRead: false,
            }),
          );
        }
      } else {
        records.push(
          this.notificationsRepository.create({
            recipientRole: role,
            title,
            message,
            action: activity.action,
            metadata: {
              details: activity.details || {},
              status: activity.status || 'SUCCESS',
              performedBy: activity.performedBy || null,
              sourceUserId: activity.userId,
              sourceUsername: activity.username,
            },
            isRead: false,
          }),
        );
      }

      // SUPER_ADMIN notifications should be user-targeted only.
      if (role === 'SUPER_ADMIN') {
        continue;
      }
    }

    await this.notificationsRepository.save(records);
  }

  async getNotificationsForRole(
    role: string,
    userId: string | undefined,
    page: number,
    limit: number,
    unreadOnly: boolean,
  ) {
    if (!this.isSupportedRole(role)) {
      throw new ForbiddenException('Notifications are available only for SUPER_ADMIN, DIRECTOR, PROJECT_MANAGER, and CLIENT');
    }

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(Math.max(1, limit || 20), 100);

    const query = this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.recipientRole = :role', { role });

    if (userId) {
      query.andWhere('(notification.recipientUserId IS NULL OR notification.recipientUserId = :userId)', {
        userId,
      });
    } else {
      query.andWhere('notification.recipientUserId IS NULL');
    }

    if (unreadOnly) {
      query.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    query
      .orderBy('notification.createdAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  async getUnreadCount(role: string, userId: string | undefined) {
    if (!this.isSupportedRole(role)) {
      return { unread: 0 };
    }

    const query = this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.recipientRole = :role', { role })
      .andWhere('notification.isRead = :isRead', { isRead: false });

    if (userId) {
      query.andWhere('(notification.recipientUserId IS NULL OR notification.recipientUserId = :userId)', {
        userId,
      });
    } else {
      query.andWhere('notification.recipientUserId IS NULL');
    }

    const unread = await query.getCount();

    return { unread };
  }

  async markAsRead(role: string, userId: string | undefined, id: string) {
    if (!this.isSupportedRole(role)) {
      throw new ForbiddenException('Notifications are not enabled for this role');
    }

    const notification = await this.notificationsRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.recipientRole !== role) {
      throw new ForbiddenException('You can only mark your own role notifications');
    }

    if (notification.recipientUserId && notification.recipientUserId !== userId) {
      throw new ForbiddenException('You can only mark your own notifications');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }

    return notification;
  }

  async markAllAsRead(role: string, userId: string | undefined) {
    if (!this.isSupportedRole(role)) {
      throw new ForbiddenException('Notifications are not enabled for this role');
    }

    if (userId) {
      await this.notificationsRepository
        .createQueryBuilder()
        .update(Notification)
        .set({ isRead: true, readAt: new Date() })
        .where('recipientRole = :role', { role })
        .andWhere('isRead = :isRead', { isRead: false })
        .andWhere('(recipientUserId IS NULL OR recipientUserId = :userId)', { userId })
        .execute();

      return { message: 'All notifications marked as read' };
    }

    await this.notificationsRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('recipientRole = :role', { role })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();

    return { message: 'All notifications marked as read' };
  }
}
