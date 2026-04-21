import { Controller, Get, Patch, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private getRequesterId(req: any): string | undefined {
    if (req.user?.role === 'SUPER_ADMIN') {
      return req.user?.sub;
    }

    return req.user?.mongoId || req.user?.sub;
  }

  @Get('me')
  async getMine(
    @Req() req: any,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('unreadOnly') unreadOnlyRaw?: string,
  ) {
    const page = Number(pageRaw || 1);
    const limit = Number(limitRaw || 20);
    const unreadOnly = unreadOnlyRaw === 'true';

    const data = await this.notificationsService.getNotificationsForRole(
      req.user.role,
      this.getRequesterId(req),
      page,
      limit,
      unreadOnly,
    );

    return {
      message: 'Notifications fetched successfully',
      ...data,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.role, this.getRequesterId(req));
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const item = await this.notificationsService.markAsRead(req.user.role, this.getRequesterId(req), id);
    return {
      message: 'Notification marked as read',
      item,
    };
  }

  @Post('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.role, this.getRequesterId(req));
  }
}
