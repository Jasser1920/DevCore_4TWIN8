// src/activity-logs/activity-log.schema.ts
import { Schema, Document } from 'mongoose';

export const ActivityLogSchema = new Schema({
  userId: { 
    type: String, 
    required: true,  // Keycloak User ID
    index: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  action: {
    type: String,
    enum: [
      'USER_LOGIN',
      'USER_LOGOUT',
      'PASSWORD_CHANGED',
      'PASSWORD_RESET',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'COMPANY_CREATED',
      'COMPANY_UPDATED',
      'COMPANY_DELETED',
      'PM_ASSIGNED',
      'PM_UNASSIGNED',
      'EMAIL_VERIFIED',
      'DEVICE_REGISTERED',
      'DEVICE_REMOVED',
      'PROFILE_UPDATED',
      'ROLE_CHANGED',
      'STRATEGIC_VISION_CREATED',
      'STRATEGIC_VISION_UPDATED',
      'STRATEGIC_VISION_APPROVED',
      'STRATEGIC_VISION_REJECTED',
      'PROJECT_CREATED',
      'PROJECT_UPDATED',
      'PROJECT_SUBMITTED',
      'PROJECT_RESUBMITTED',
      'PROJECT_APPROVED',
      'PROJECT_REJECTED',
      'PROJECT_STARTED',
      'PROJECT_CLIENT_ASSIGNED',
      'MILESTONE_CREATED',
      'MILESTONE_SUBMITTED',
      'MILESTONE_RESUBMITTED',
      'MILESTONE_APPROVED_BY_CLIENT',
      'MILESTONE_REJECTED_BY_CLIENT',
      'MILESTONE_APPROVED_BY_PM',
      'MILESTONE_REJECTED_BY_PM',
      'MILESTONE_APPROVED_BY_DIRECTOR',
      'MILESTONE_REJECTED_BY_DIRECTOR',
    ],
    required: true,
    index: true
  },
  description: { type: String },
  details: { 
    type: Schema.Types.Mixed,  // Can store any additional info
    default: {} 
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'INFO'],
    default: 'SUCCESS'
  },
  performedBy: { 
    type: String,  // For actions performed by other users (e.g., admin deleted user)
    nullable: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
});

// Create TTL index to auto-delete logs after 90 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export interface ActivityLog extends Document {
  userId: string;
  username: string;
  action: string;
  description?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'INFO';
  performedBy?: string;
  timestamp: Date;
  createdAt: Date;
}
