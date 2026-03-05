// src/activity-logs/activity-logs.controller.ts
import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLog } from './activity-log.schema';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(
    private activityLogsService: ActivityLogsService,
    @InjectModel('ActivityLog') private activityLogModel: Model<ActivityLog>,
  ) {}

  /**
   * Get all activity logs (SUPER_ADMIN only)
   * Query params:
   * - skip: number (pagination)
   * - limit: number (items per page)
   * - userId: string (filter by user)
   * - action: string (filter by action type)
   * - status: string (filter by status)
   * - startDate: ISO date string
   * - endDate: ISO date string
   */
  @Get('all')
  async getAllActivityLogs(@Req() req: any, @Query() query: any) {
    // ✅ Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can view all activity logs',
      );
    }

    try {
      const skip = parseInt(query.skip) || 0;
      const limit = Math.min(parseInt(query.limit) || 50, 100); // Max 100

      const filters: any = {};
      if (query.userId) filters.userId = query.userId;
      if (query.action) filters.action = query.action;
      if (query.status) filters.status = query.status;
      if (query.startDate) filters.startDate = new Date(query.startDate);
      if (query.endDate) filters.endDate = new Date(query.endDate);

      const { logs, total } = await this.activityLogsService.getAllActivityLogs(
        skip,
        limit,
        filters,
      );

      return {
        message: 'Activity logs retrieved successfully',
        pagination: {
          skip,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        logs,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch activity logs: ${error.message}`,
      );
    }
  }

  /**
   * Get activity logs for current user
   */
  @Get('me')
  async getMyActivityLogs(@Req() req: any, @Query() query: any) {
    try {
      const skip = parseInt(query.skip) || 0;
      const limit = Math.min(parseInt(query.limit) || 50, 100);

      // Get username from JWT token (works for all users)
      const username = req.user?.preferred_username || req.user?.sub;
      
      if (!username) {
        throw new Error('Could not identify user from token');
      }

      console.log('📋 Fetching activity logs for user:', { username, skip, limit });

      // Query by username which is consistent across login/logging
      const logs = await this.activityLogModel
        .find({ username })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.activityLogModel.countDocuments({ username });

      console.log('✅ Activity logs fetched:', { username, found: logs.length, total });

      return {
        message: 'Your activity logs retrieved successfully',
        pagination: {
          skip,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        logs,
      };
    } catch (error: any) {
      console.error('❌ Error fetching activity logs:', error.message);
      throw new BadRequestException(
        `Failed to fetch activity logs: ${error.message}`,
      );
    }
  }

  /**
   * Get login history for current user
   */
  @Get('me/login-history')
  async getMyLoginHistory(@Req() req: any, @Query() query: any) {
    try {
      const limit = Math.min(parseInt(query.limit) || 20, 100);
      const userId = req.user.sub;

      const logs = await this.activityLogsService.getUserLoginHistory(
        userId,
        limit,
      );

      return {
        message: 'Login history retrieved successfully',
        logs,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch login history: ${error.message}`,
      );
    }
  }

  /**
   * Get activity logs for a specific user (SUPER_ADMIN only)
   */
  @Get('user/:userId')
  async getUserActivityLogs(
    @Param('userId') userId: string,
    @Req() req: any,
    @Query() query: any,
  ) {
    // ✅ Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can view user activity logs',
      );
    }

    try {
      const skip = parseInt(query.skip) || 0;
      const limit = Math.min(parseInt(query.limit) || 50, 100);

      const { logs, total } = await this.activityLogsService.getUserActivityLogs(
        userId,
        skip,
        limit,
      );

      return {
        message: 'User activity logs retrieved successfully',
        pagination: {
          skip,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        logs,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch user activity logs: ${error.message}`,
      );
    }
  }

  /**
   * Get activity summary (SUPER_ADMIN only)
   */
  @Get('summary')
  async getActivitySummary(@Req() req: any, @Query() query: any) {
    // ✅ Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can view activity summary',
      );
    }

    try {
      const days = parseInt(query.days) || 30;
      const summary = await this.activityLogsService.getActivitySummary(days);

      return {
        message: 'Activity summary retrieved successfully',
        period: `Last ${days} days`,
        summary,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch activity summary: ${error.message}`,
      );
    }
  }

  /**
   * Get recent activity (SUPER_ADMIN only)
   */
  @Get('recent')
  async getRecentActivity(@Req() req: any, @Query() query: any) {
    // ✅ Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can view recent activity',
      );
    }

    try {
      const limit = Math.min(parseInt(query.limit) || 20, 100);
      const logs = await this.activityLogsService.getRecentActivity(limit);

      return {
        message: 'Recent activity retrieved successfully',
        logs,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch recent activity: ${error.message}`,
      );
    }
  }
}
