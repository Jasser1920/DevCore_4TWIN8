// src/activity-logs/activity-logs.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLog } from './activity-log.schema';
import { NotificationsService } from '../notifications/notifications.service';

export interface ActivityLogData {
  userId: string;
  username: string;
  action: string;
  description?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status?: 'SUCCESS' | 'FAILED' | 'INFO';
  performedBy?: string;
}

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectModel('ActivityLog') private activityLogModel: Model<ActivityLog>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Log an activity
   */
  async logActivity(data: ActivityLogData): Promise<ActivityLog | null> {
    const logEntry = new this.activityLogModel({
      userId: data.userId,
      username: data.username,
      action: data.action,
      description: data.description || '',
      details: data.details || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      status: data.status || 'SUCCESS',
      performedBy: data.performedBy || null,
      timestamp: new Date(),
    });

    try {
      const saved = await logEntry.save();

      // Create role-based notifications from selected activity actions.
      await this.notificationsService.createFromActivity(data);

      return saved;
    } catch (error) {
      console.error('Failed to save activity log:', error);
      // Don't throw - logging shouldn't break the main operation
      return null;
    }
  }

  /**
   * Get all activity logs (for super admin)
   */
  async getAllActivityLogs(
    skip: number = 0,
    limit: number = 50,
    filters?: {
      userId?: string;
      action?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{ logs: ActivityLog[]; total: number }> {
    const query: any = {};

    if (filters?.userId) {
      query.userId = filters.userId;
    }
    if (filters?.action) {
      query.action = filters.action;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters?.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters?.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }

    const logs = await this.activityLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.activityLogModel.countDocuments(query);

    return { logs, total };
  }

  /**
   * Get activity logs for a specific user
   */
  async getUserActivityLogs(
    userId: string,
    skip: number = 0,
    limit: number = 50,
  ): Promise<{ logs: ActivityLog[]; total: number }> {
    const logs = await this.activityLogModel
      .find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.activityLogModel.countDocuments({ userId });

    return { logs, total };
  }

  /**
   * Get activity logs by action type
   */
  async getActivityLogsByAction(
    action: string,
    skip: number = 0,
    limit: number = 50,
  ): Promise<{ logs: ActivityLog[]; total: number }> {
    const logs = await this.activityLogModel
      .find({ action })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.activityLogModel.countDocuments({ action });

    return { logs, total };
  }

  async getMilestoneDecisionHistory(
    milestoneId: string,
    limit: number = 20,
  ): Promise<ActivityLog[]> {
    const safeLimit = Math.min(Math.max(limit || 20, 1), 100);

    return this.activityLogModel
      .find({
        action: { $in: ['MILESTONE_APPROVED_BY_CLIENT', 'MILESTONE_REJECTED_BY_CLIENT'] },
        'details.milestoneId': milestoneId,
      })
      .sort({ timestamp: -1 })
      .limit(safeLimit);
  }

  /**
   * Get recent activity logs (for dashboard)
   */
  async getRecentActivity(limit: number = 20): Promise<ActivityLog[]> {
    return this.activityLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Get activity summary (count by action type)
   */
  async getActivitySummary(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const summary = await this.activityLogModel.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return summary;
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const summary = await this.activityLogModel.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return summary;
  }

  /**
   * Get login activity for a user
   */
  async getUserLoginHistory(
    userId: string,
    limit: number = 20,
  ): Promise<ActivityLog[]> {
    return this.activityLogModel
      .find({ userId, action: 'USER_LOGIN' })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Clear activity logs older than specified days
   */
  async clearOldLogs(days: number = 90): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.activityLogModel.deleteMany({
      timestamp: { $lt: cutoffDate },
    });
  }
}
