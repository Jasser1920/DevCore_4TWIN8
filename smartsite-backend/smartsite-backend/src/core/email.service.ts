import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    // Initialize Gmail transport
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get<string>('GMAIL_USER'),
        pass: this.config.get<string>('GMAIL_PASSWORD'),
      },
    });
  }

  /* ========================================
      📧 Send Welcome Email to New User
  ======================================== */
  async sendWelcomeEmail(to: string, userData: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to SmartSite! 👋</h2>
        
        <p>Hello <strong>${userData.firstName} ${userData.lastName}</strong>,</p>
        
        <p>Your account has been successfully created. Here are your login credentials:</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Login URL:</strong> <a href="http://localhost:5173">http://localhost:5173</a></p>
          <p><strong>Username:</strong> <code>${userData.username}</code></p>
          <p><strong>Password:</strong> <code>${userData.password}</code></p>
          <p><strong>Role:</strong> <code>${userData.role}</code></p>
        </div>
        
        <p style="color: #d32f2f; font-weight: bold;">⚠️ Please change your password on first login!</p>
        
        <p>If you did not request this account, please contact the administrator.</p>
        
        <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #666;">
          <p>SmartSite Team</p>
          <p><em>This is an automated email. Please do not reply.</em></p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.get<string>('GMAIL_USER'),
      to,
      subject: '🎉 Welcome to SmartSite - Your Account is Ready!',
      html: htmlContent,
    });
  }

  /* ========================================
      ✉️ Send Email Verification Link
  ======================================== */
  async sendEmailVerificationLink(
    to: string,
    userName: string,
    verificationToken: string,
    credentials?: {
      username: string;
      password: string;
    },
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(to)}`;
    
    const htmlContent = `
      <div style="margin: 0; padding: 0; background-color: #f4f9fb; font-family: Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
          <div style="background: linear-gradient(135deg, #075B7A, #148ABB); color: #ffffff; border-radius: 14px 14px 0 0; padding: 24px;">
            <p style="margin: 0; font-size: 13px; opacity: 0.9; letter-spacing: 0.5px;">SMARTSITE</p>
            <h1 style="margin: 8px 0 0 0; font-size: 24px;">Verify your email</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.95;">Secure access for your SmartSite workspace</p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #d7eef5; border-top: none; border-radius: 0 0 14px 14px; padding: 24px;">
            <p style="margin: 0 0 12px 0; color: #1f2937;">Hello <strong>${userName}</strong>,</p>
            <p style="margin: 0 0 18px 0; color: #4b5563; line-height: 1.6;">
              Your SmartSite account has been created. Please verify your email first, then login using the credentials below.
            </p>

            <div style="text-align: center; margin: 22px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background-color: #148ABB; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
                Verify Email Address
              </a>
            </div>

            <div style="background-color: #ecf8fb; border: 1px solid #caedf1; border-radius: 10px; padding: 16px; margin: 0 0 16px 0;">
              <p style="margin: 0; color: #075B7A; font-weight: 700;">Important</p>
              <p style="margin: 8px 0 0 0; color: #374151; line-height: 1.5;">You cannot login until your email is verified.</p>
            </div>

            ${credentials ? `
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 0 0 16px 0;">
              <p style="margin: 0 0 10px 0; color: #111827; font-weight: 700;">Login credentials</p>
              <p style="margin: 0 0 8px 0; color: #374151;"><strong>Username:</strong> <span style="font-family: monospace;">${credentials.username}</span></p>
              <p style="margin: 0 0 8px 0; color: #374151;"><strong>Password:</strong> <span style="font-family: monospace;">${credentials.password}</span></p>
              <p style="margin: 0; color: #374151;"><strong>Website:</strong> <a href="${frontendUrl}" style="color: #148ABB; text-decoration: none;">${frontendUrl}</a></p>
            </div>
            ` : ''}

            <div style="margin: 0 0 16px 0;">
              <p style="margin: 0 0 8px 0; color: #111827; font-weight: 700;">Quick steps</p>
              <ol style="margin: 0; padding-left: 18px; color: #4b5563; line-height: 1.6;">
                <li>Click the Verify Email Address button</li>
                <li>Open SmartSite and login with your username and password</li>
              </ol>
            </div>

            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">Verification link expires in 24 hours.</p>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">If the button does not work, use this link:</p>
            <p style="margin: 0; padding: 10px; background-color: #f3f4f6; border-radius: 8px; word-break: break-all; color: #4b5563; font-size: 12px;">
              ${verificationUrl}
            </p>

            <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p style="margin: 0 0 6px 0;">SmartSite Team</p>
              <p style="margin: 0;"><em>This is an automated email. Please do not reply.</em></p>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.get<string>('GMAIL_USER'),
      to,
      subject: '📧 SmartSite - Verify Your Email Address',
      html: htmlContent,
    });
  }

  /* ========================================
      🔐 Send Password Reset Email with New Password
  ======================================== */
  async sendPasswordResetEmail(to: string, newPassword: string, userName: string): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Successfully 🔐</h2>
        
        <p>Hello <strong>${userName}</strong>,</p>
        
        <p>Your password has been reset. Here is your new temporary password:</p>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>New Password:</strong> <code style="font-size: 16px; font-weight: bold;">${newPassword}</code></p>
        </div>
        
        <p><strong>Login URL:</strong> <a href="http://localhost:5173">http://localhost:5173</a></p>
        
        <p style="color: #d32f2f; font-weight: bold;">⚠️ Please change this password when you log in for security!</p>
        
        <div style="background-color: #e3f2fd; padding: 12px; border-radius: 5px; margin: 15px 0;">
          <h3>How to login:</h3>
          <ol>
            <li>Go to <a href="http://localhost:5173">SmartSite Console</a></li>
            <li>Use your username and this new password</li>
            <li>Change your password immediately</li>
          </ol>
        </div>
        
        <p>If you did not request a password reset, please contact the administrator immediately.</p>
        
        <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #666;">
          <p>SmartSite Team</p>
          <p><em>This is an automated email. Please do not reply.</em></p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.get<string>('GMAIL_USER'),
      to,
      subject: '🔐 SmartSite - Your Password Has Been Reset',
      html: htmlContent,
    });
  }

  /* ========================================
      🗑️ Account Deletion Request Notice
  ======================================== */
  async sendAccountDeletionNotice(to: string, username: string, deletionDate: Date): Promise<void> {
    const deletionDateFormatted = new Date(deletionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to bottom right, #CAEDF1, #148ABB); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0;">Account Deletion Requested</h2>
        </div>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>Your account deletion request has been received and confirmed.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #856404;">⚠️ Important Information</h3>
          <p><strong>Your account will be permanently deleted on:</strong> <strong style="font-size: 18px; color: #d32f2f;">${deletionDateFormatted}</strong></p>
          <p>You have 30 days to cancel this request. After this date, all your data will be permanently removed and cannot be recovered.</p>
        </div>
        
        <p><strong>What happens next:</strong></p>
        <ul style="line-height: 1.8;">
          <li>You can still log in and use your account during this period</li>
          <li>You can cancel the deletion request anytime from your account settings</li>
          <li>If you don't cancel, your account will be automatically deleted on ${deletionDateFormatted}</li>
          <li>All your data will be permanently removed</li>
        </ul>
        
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2e7d32;">✅ How to Cancel Deletion</h3>
          <ol style="line-height: 1.8;">
            <li>Log in to your SmartSite account</li>
            <li>Go to Profile Settings</li>
            <li>Click "Cancel Account Deletion"</li>
            <li>Confirm cancellation</li>
          </ol>
        </div>
        
        <p>If this was a mistake or you have any questions, please contact our support team immediately.</p>
        
        <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #666;">
          <p><strong>SmartSite Team</strong></p>
          <p><em>This is an automated email. Please do not reply.</em></p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.get<string>('GMAIL_USER'),
      to,
      subject: '⚠️ SmartSite - Account Deletion Request Confirmed',
      html: htmlContent,
    });
  }

  /* ========================================
      ✅ Account Deletion Cancellation Notice
  ======================================== */
  async sendDeletionCancellationNotice(to: string, username: string): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to bottom right, #CAEDF1, #148ABB); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0;">Deletion Request Cancelled</h2>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <svg style="height: 60px; width: 60px;" fill="none" stroke="#4CAF50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        
        <p>Hello <strong>${username}</strong>,</p>
        
        <p>Your account deletion request has been successfully <strong>cancelled</strong>.</p>
        
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color: #2e7d32;">✅ Your Account is Safe</h3>
          <p>Your account is now <strong>active</strong> and will not be deleted. You can continue using SmartSite normally.</p>
        </div>
        
        <p><strong>What you should know:</strong></p>
        <ul style="line-height: 1.8;">
          <li>Your account remains fully functional</li>
          <li>All your data is secure and preserved</li>
          <li>You can request deletion again anytime if needed</li>
        </ul>
        
        <p>If you have any questions or concerns, please contact our support team.</p>
        
        <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #666;">
          <p><strong>SmartSite Team</strong></p>
          <p><em>This is an automated email. Please do not reply.</em></p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.get<string>('GMAIL_USER'),
      to,
      subject: '✅ SmartSite - Account Deletion Cancelled',
      html: htmlContent,
    });
  }

  /* ========================================
      🏢 Director Assigned to Company Notification
  ======================================== */
  async sendDirectorAssignmentNotification(
    to: string,
    directorName: string,
    company: any,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const companyName = company.name;
    const companyDescription = company.description || 'No description provided';
    const contactName = company.contactName || 'Not specified';
    const contactEmail = company.contactEmail || 'Not specified';
    const status = company.status || 'ACTIVE';
    const createdDate = new Date(company.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const htmlContent = `
      <div style="margin: 0; padding: 0; background-color: #f4f9fb; font-family: Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
          <div style="background: linear-gradient(135deg, #075B7A, #148ABB); color: #ffffff; border-radius: 14px 14px 0 0; padding: 24px;">
            <p style="margin: 0; font-size: 13px; opacity: 0.9; letter-spacing: 0.5px;">SMARTSITE</p>
            <h1 style="margin: 8px 0 0 0; font-size: 24px;">🎉 New Company Assignment</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.95;">You have been assigned as Director</p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #d7eef5; border-top: none; border-radius: 0 0 14px 14px; padding: 24px;">
            <p style="margin: 0 0 12px 0; color: #1f2937;">Hello <strong>${directorName}</strong>,</p>
            
            <p style="margin: 0 0 18px 0; color: #4b5563; line-height: 1.6;">
              Great news! You have been assigned as the Director of a new company. This is an exciting opportunity to manage and oversee operations for:
            </p>

            <div style="background-color: #ecf8fb; border: 1px solid #caedf1; border-radius: 10px; padding: 20px; margin: 22px 0;">
              <p style="margin: 0 0 12px 0; color: #075B7A; font-weight: 700; font-size: 16px;">📋 Company Details</p>
              
              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Company Name</p>
                <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 15px;">${companyName}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Company Description</p>
                <p style="margin: 0; color: #374151; font-size: 14px;">${companyDescription}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Status</p>
                <p style="margin: 0; color: #1f2937; font-size: 14px;">
                  <span style="display: inline-block; background-color: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px;">
                    ✓ ${status}
                  </span>
                </p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Contact Person</p>
                <p style="margin: 0; color: #374151; font-size: 14px;">${contactName}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Contact Email</p>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <a href="mailto:${contactEmail}" style="color: #148ABB; text-decoration: none;">${contactEmail}</a>
                </p>
              </div>

              <div style="margin-bottom: 0;">
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase;">Created Date</p>
                <p style="margin: 0; color: #374151; font-size: 14px;">${createdDate}</p>
              </div>
            </div>

            <p style="margin: 0 0 18px 0; color: #4b5563; line-height: 1.6;">
              Your responsibilities now include:
            </p>

            <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
              <li>Managing company operations and projects</li>
              <li>Assigning Project Managers to specific projects</li>
              <li>Monitoring company activity and performance</li>
              <li>Overseeing device management</li>
              <li>Reviewing activity logs and reports</li>
            </ul>

            <div style="text-align: center; margin: 22px 0;">
              <a href="${frontendUrl}/profile" style="display: inline-block; background-color: #148ABB; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
                Go to SmartSite Dashboard
              </a>
            </div>

            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 0 0 16px 0;">
              <p style="margin: 0 0 8px 0; color: #111827; font-weight: 700;">Next Steps</p>
              <ol style="margin: 0; padding-left: 18px; color: #4b5563; line-height: 1.8;">
                <li>Log in to your SmartSite dashboard</li>
                <li>Navigate to your company profile</li>
                <li>Start assigning Project Managers to your projects</li>
                <li>Review company settings and configurations</li>
              </ol>
            </div>

            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
              If you have any questions about your new role or need assistance, please contact the Super Admin.
            </p>

            <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p style="margin: 0 0 6px 0;"><strong>SmartSite Team</strong></p>
              <p style="margin: 0;"><em>This is an automated email. Please do not reply.</em></p>
            </div>
          </div>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.get<string>('GMAIL_USER'),
      to,
      subject: `🎉 SmartSite - You've been assigned to ${companyName}`,
      html: htmlContent,
    });
  }
}
