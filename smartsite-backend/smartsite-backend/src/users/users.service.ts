// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  async createUser(userData: any) {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async getUserByUsername(username: string) {
    return this.userModel.findOne({ username });
  }

  async getUserByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async getUserByKeycloakId(keycloakId: string) {
    return this.userModel.findOne({ keycloakId });
  }

  async getUserById(id: string) {
    return this.userModel.findById(id);
  }

  async updateUser(id: string, updateData: any) {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async updateUserById(id: string, updateData: any) {
    return this.userModel.findOneAndUpdate({ _id: id }, updateData, {
      new: true,
    });
  }

  async deleteUser(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }

  async getAllUsers() {
    return this.userModel.find().sort({ createdAt: -1 });
  }

  /* ========================================
      🔐 Generate Email Verification Token
  ======================================== */
  generateVerificationToken(): { token: string; expireDate: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 24); // 24 hours
    
    return { token, expireDate };
  }

  /* ========================================
      ✅ Verify Email Token
  ======================================== */
  async verifyEmailToken(email: string, token: string) {
    const user = await this.userModel.findOne({ email });
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    if (user.emailVerificationToken !== token) {
      throw new Error('Invalid verification token');
    }

    if (user.emailVerificationTokenExpire && new Date() > user.emailVerificationTokenExpire) {
      throw new Error('Verification token has expired');
    }

    // Update user to mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpire = null;
    
    return user.save();
  }

  /* ========================================
      📧 Resend Verification Email
  ======================================== */
  async canResendVerificationEmail(email: string): Promise<{ canResend: boolean; waitSeconds?: number }> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    if (!user.lastVerificationEmailSentAt) {
      return { canResend: true };
    }

    const now = new Date();
    const lastSentTime = new Date(user.lastVerificationEmailSentAt);
    const secondsElapsed = Math.floor((now.getTime() - lastSentTime.getTime()) / 1000);
    const cooldownSeconds = 60; // 1 minute between resends

    if (secondsElapsed < cooldownSeconds) {
      return { canResend: false, waitSeconds: cooldownSeconds - secondsElapsed };
    }

    return { canResend: true };
  }

  async updateVerificationEmailSentTime(email: string) {
    return this.userModel.findOneAndUpdate(
      { email },
      { lastVerificationEmailSentAt: new Date() },
      { new: true }
    );
  }

  /* ========================================
      🗑️ Request Account Deletion
  ======================================== */
  async requestAccountDeletion(userId: string, reason?: string) {
    const deletionScheduledFor = new Date();
    deletionScheduledFor.setDate(deletionScheduledFor.getDate() + 30); // 30 days from now

    return this.userModel.findByIdAndUpdate(
      userId,
      {
        deletionRequestedAt: new Date(),
        deletionScheduledFor,
        deletionReason: reason || null,
      },
      { new: true }
    );
  }

  /* ========================================
      ❌ Cancel Account Deletion
  ======================================== */
  async cancelAccountDeletion(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        deletionRequestedAt: null,
        deletionScheduledFor: null,
        deletionReason: null,
      },
      { new: true }
    );
  }

  /* ========================================
      Check Deletion Status
  ======================================== */
  async getDeletionStatus(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.deletionRequestedAt) {
      return { hasPendingDeletion: false };
    }

    const now = new Date();
    const daysUntilDeletion = Math.ceil(
      (new Date(user.deletionScheduledFor!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      hasPendingDeletion: true,
      requestedAt: user.deletionRequestedAt,
      scheduledFor: user.deletionScheduledFor,
      daysRemaining: Math.max(0, daysUntilDeletion),
      reason: user.deletionReason,
    };
  }
}
