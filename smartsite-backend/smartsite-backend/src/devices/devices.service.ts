import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device } from './device.schema';
import * as crypto from 'crypto';

@Injectable()
export class DevicesService {
  constructor(@InjectModel('Device') private deviceModel: Model<Device>) {}

  /**
   * Register or update a trusted device
   */
  async registerDevice(
    userId: string,
    deviceFingerprint: string,
    deviceName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Device> {
    // Generate unique device ID
    const deviceId = crypto
      .createHash('sha256')
      .update(`${userId}-${deviceFingerprint}`)
      .digest('hex');

    // Check if device already exists
    const existingDevice = await this.deviceModel.findOne({ deviceId });

    if (existingDevice) {
      // Update last used date
      existingDevice.lastUsed = new Date();
      existingDevice.ipAddress = ipAddress;
      existingDevice.userAgent = userAgent;
      return existingDevice.save();
    }

    // Create new device
    const newDevice = new this.deviceModel({
      userId,
      deviceId,
      deviceName,
      deviceFingerprint,
      ipAddress,
      userAgent,
      trusted: true,
    });

    return newDevice.save();
  }

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    const deviceId = crypto
      .createHash('sha256')
      .update(`${userId}-${deviceFingerprint}`)
      .digest('hex');

    const device = await this.deviceModel.findOne({ deviceId, userId, trusted: true });
    return !!device;
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string): Promise<Device[]> {
    return this.deviceModel
      .find({ userId })
      .sort({ lastUsed: -1 })
      .exec();
  }

  /**
   * Remove a device (untrust)
   */
  async removeDevice(userId: string, deviceId: string): Promise<boolean> {
    const result = await this.deviceModel.deleteOne({ userId, deviceId });
    return result.deletedCount > 0;
  }

  /**
   * Update device name
   */
  async updateDeviceName(userId: string, deviceId: string, deviceName: string): Promise<Device | null> {
    return this.deviceModel.findOneAndUpdate(
      { userId, deviceId },
      { deviceName },
      { new: true },
    );
  }

  /**
   * Remove all devices for a user
   */
  async removeAllDevices(userId: string): Promise<number> {
    const result = await this.deviceModel.deleteMany({ userId });
    return result.deletedCount;
  }
}
