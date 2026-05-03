// src/users/user.schema.ts
import { Schema, Document } from 'mongoose';

export const UserSchema = new Schema({
  keycloakId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'QHSE_MANAGER', 'CLIENT'],
    default: 'CLIENT',
  },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, nullable: true },
  emailVerificationTokenExpire: { type: Date, nullable: true },
  
  // Email verification resend tracking
  lastVerificationEmailSentAt: { type: Date, nullable: true },
  
  // Account deletion request
  deletionRequestedAt: { type: Date, nullable: true },
  deletionScheduledFor: { type: Date, nullable: true },
  deletionReason: { type: String, nullable: true },
  
  createdBy: { type: String }, // Super admin who created this user
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export interface User extends Document {
  keycloakId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'SUPER_ADMIN' | 'DIRECTOR' | 'PROJECT_MANAGER' | 'QHSE_MANAGER' | 'CLIENT';
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationTokenExpire?: Date | null;
  lastVerificationEmailSentAt?: Date | null;
  deletionRequestedAt?: Date | null;
  deletionScheduledFor?: Date | null;
  deletionReason?: string | null;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}