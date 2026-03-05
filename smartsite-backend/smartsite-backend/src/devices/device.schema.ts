// src/devices/device.schema.ts
import { Schema, Document } from 'mongoose';

export const DeviceSchema = new Schema({
  userId: { type: String, required: true }, // Keycloak user ID
  deviceId: { type: String, required: true, unique: true }, // Unique device identifier
  deviceName: { type: String, required: true }, // Browser + OS info
  deviceFingerprint: { type: String, required: true }, // Browser fingerprint
  lastUsed: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  trusted: { type: Boolean, default: true },
  ipAddress: { type: String },
  userAgent: { type: String },
});

// Index for faster lookups
DeviceSchema.index({ userId: 1, deviceId: 1 });

export interface Device extends Document {
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceFingerprint: string;
  lastUsed: Date;
  createdAt: Date;
  trusted: boolean;
  ipAddress?: string;
  userAgent?: string;
}
