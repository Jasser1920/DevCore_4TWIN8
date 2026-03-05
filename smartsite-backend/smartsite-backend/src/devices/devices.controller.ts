import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  /**
   * Get all devices for the authenticated user
   */
  @Get()
  async getUserDevices(@Req() req: any) {
    const userId = req.user.sub; // Keycloak user ID from JWT
    return this.devicesService.getUserDevices(userId);
  }

  /**
   * Register a new device
   */
  @Post('register')
  async registerDevice(
    @Req() req: any,
    @Body() body: { deviceFingerprint: string; deviceName: string },
  ) {
    const userId = req.user.sub;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const device = await this.devicesService.registerDevice(
      userId,
      body.deviceFingerprint,
      body.deviceName,
      ipAddress,
      userAgent,
    );

    return {
      message: '✅ Device registered successfully',
      device,
    };
  }

  /**
   * Check if a device is trusted
   */
  @Post('check')
  async checkDevice(
    @Req() req: any,
    @Body() body: { deviceFingerprint: string },
  ) {
    const userId = req.user.sub;
    const isTrusted = await this.devicesService.isDeviceTrusted(userId, body.deviceFingerprint);

    return {
      trusted: isTrusted,
    };
  }

  /**
   * Remove a specific device
   */
  @Delete(':deviceId')
  async removeDevice(@Req() req: any, @Param('deviceId') deviceId: string) {
    const userId = req.user.sub;
    const removed = await this.devicesService.removeDevice(userId, deviceId);

    return {
      message: removed ? '✅ Device removed successfully' : '❌ Device not found',
      success: removed,
    };
  }

  /**
   * Remove all devices
   */
  @Delete()
  async removeAllDevices(@Req() req: any) {
    const userId = req.user.sub;
    const count = await this.devicesService.removeAllDevices(userId);

    return {
      message: `✅ ${count} device(s) removed successfully`,
      count,
    };
  }
}
