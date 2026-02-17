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
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}