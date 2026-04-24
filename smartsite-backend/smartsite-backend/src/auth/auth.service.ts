import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../core/email.service';
import { UsersService } from '../users/users.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private emailService: EmailService,
    private usersService: UsersService,
    private activityLogsService: ActivityLogsService,
  ) {}

  /* =======================================================
      🔑 GET ADMIN TOKEN (Keycloak Admin API)
  ======================================================= */
  async getAdminToken(): Promise<string> {
    const url = `${this.config.get<string>('KEYCLOAK_URL')}/realms/master/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', 'admin-cli');
    params.append('username', this.config.get<string>('KEYCLOAK_ADMIN_USERNAME')!);
    params.append('password', this.config.get<string>('KEYCLOAK_ADMIN_PASSWORD')!);

    const response = await axios.post(url, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return response.data.access_token;
  }

  /* =======================================================
      🔐 LOGIN
  ======================================================= */
  private async verifyCaptchaToken(captchaToken: string, ipAddress?: string): Promise<void> {
    const captchaSecret = this.config.get<string>('RECAPTCHA_SECRET_KEY');

    if (!captchaSecret) {
      throw new BadRequestException('CAPTCHA is not configured on the server');
    }

    if (!captchaToken) {
      throw new BadRequestException('Please complete CAPTCHA verification');
    }

    const params = new URLSearchParams();
    params.append('secret', captchaSecret);
    params.append('response', captchaToken);
    if (ipAddress) {
      params.append('remoteip', ipAddress);
    }

    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    if (!response.data?.success) {
      throw new BadRequestException('CAPTCHA verification failed. Please try again.');
    }
  }

  async login(
    username: string,
    password: string,
    captchaToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const normalizedUsername = (username || '').trim().replace(/^['\"]+|['\"]+$/g, '');

      // Only verify CAPTCHA if token is provided (skip for internal calls like updatePassword)
      if (captchaToken) {
        await this.verifyCaptchaToken(captchaToken, ipAddress);
      }

      // Check if user's email is verified before allowing login
      // Skip verification for SUPER_ADMIN users
      
      // ✅ LOOKUP USER BY USERNAME OR EMAIL
      // The login can use either username or email, so we need to check both
      let user = await this.usersService.getUserByUsername(normalizedUsername);
      
      // If not found by username, try to find by email
      if (!user && normalizedUsername.includes('@')) {
        console.log('🔍 Username contains @, trying to lookup by email:', normalizedUsername);
        user = await this.usersService.getUserByEmail(normalizedUsername.toLowerCase());
      }
      
      // ✅ EMAIL VERIFICATION CHECK
      // This check must happen BEFORE Keycloak authentication
      // Rule: All users except SUPER_ADMIN must verify email before login
      console.log('🔐 LOGIN CHECK - User lookup:', {
        identifier: normalizedUsername,
        userExists: !!user,
        userUsername: user?.username,
        userEmail: user?.email,
        isEmailVerified: user?.isEmailVerified,
        role: user?.role,
      });

      if (user) {
        // ✅ Case 1: User exists in MongoDB
        // CHECK EMAIL VERIFICATION (MongoDB + Keycloak)
        const isNonAdminUser = user.role !== 'SUPER_ADMIN';
        const isEmailNotVerifiedInDb = !user.isEmailVerified;
        
        console.log('🔍 EMAIL VERIFICATION CHECK:', {
          loginIdentifier: normalizedUsername,
          foundUsername: user.username,
          foundEmail: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isNonAdminUser,
          isEmailNotVerifiedInDb,
          WILL_BLOCK: isEmailNotVerifiedInDb && isNonAdminUser,
        });
        
        if (isEmailNotVerifiedInDb && isNonAdminUser) {
          const errorMsg = '❌ Please verify your email address before logging in. Check your email for the verification link.';
          console.error('🚫 BLOCKING LOGIN - Email not verified for non-admin user:', {
            loginIdentifier: normalizedUsername,
            foundUsername: user.username,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
          });
          
          // Log failed login attempt
          try {
            await this.activityLogsService.logActivity({
              userId: user._id.toString(),
              username: user.username,
              action: 'USER_LOGIN',
              description: 'Login attempt - email not verified (MongoDB check)',
              status: 'FAILED',
              ipAddress,
              userAgent,
            });
          } catch (logError) {
            console.error('Failed to log activity:', logError);
          }
          
          throw new BadRequestException(errorMsg);
        }
      } else {
        // ⚠️ Case 2: User doesn't exist in MongoDB
        // This is a security issue - user can't be verified if not in DB
        // Don't allow login for non-admin users created outside the system
        console.warn(`⚠️ User not found in MongoDB for login identifier: ${normalizedUsername}`);
        console.warn('ℹ️ Allowing Keycloak to handle auth - user might exist outside MongoDB');
        // Note: We'll let this continue to Keycloak auth for now
        // If user is legitimate Keycloak user, they'll authenticate
        // Then we can create MongoDB record or handle accordingly
      }

      const url = `${this.config.get<string>('KEYCLOAK_URL')}/realms/${this.config.get<string>('REALM')}/protocol/openid-connect/token`;

      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', this.config.get<string>('CLIENT_ID')!);
      params.append('client_secret', this.config.get<string>('CLIENT_SECRET')!);
      params.append('username', normalizedUsername);
      params.append('password', password);

      const response = await axios.post(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // Log successful login (with fallback userId if user doesn't exist in MongoDB yet)
      const userId = user?._id.toString() || `user-${normalizedUsername}`;
      const actualUsername = user?.username || normalizedUsername; // Use actual username from DB if available
      console.log('✅ LOGGED IN SUCCESSFULLY:', { userId, actualUsername, loginIdentifier: normalizedUsername, ipAddress });
      await this.activityLogsService.logActivity({
        userId,
        username: actualUsername,
        action: 'USER_LOGIN',
        description: `User ${actualUsername} logged in successfully`,
        status: 'SUCCESS',
        ipAddress,
        userAgent,
      });

      return response.data;
    } catch (error: any) {
      console.error('🔴 LOGIN ERROR CAUGHT:', {
        message: error.message,
        statusCode: error.statusCode || error.status,
        response: error.response?.data,
        isErrorInstance: error instanceof BadRequestException,
      });
      
      // If it's already a BadRequestException, re-throw it WITH the message
      if (error instanceof BadRequestException) {
        console.error('🔴 Rethrowing BadRequestException with message');
        throw error;
      }
      
      // If server returned 400 status, it has an error message we should pass through
      if (error.status === 400 || error.statusCode === 400) {
        console.error('🔴 Got 400 error from server, rethrowing');
        throw error;
      }
      
      console.error('🔴 Throwing generic BadRequestException');
      throw new BadRequestException(
        error.response?.data?.error_description || error.message || 'Login failed'
      );
    }
  }

  /* =======================================================
      � REFRESH ACCESS TOKEN
  ======================================================= */
  async refreshToken(refreshToken: string) {
    try {
      const url = `${this.config.get<string>('KEYCLOAK_URL')}/realms/${this.config.get<string>('REALM')}/protocol/openid-connect/token`;

      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', this.config.get<string>('CLIENT_ID')!);
      params.append('client_secret', this.config.get<string>('CLIENT_SECRET')!);
      params.append('refresh_token', refreshToken);

      const response = await axios.post(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return response.data;
    } catch (error: any) {
      console.log('TOKEN REFRESH ERROR:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.error_description || 'Failed to refresh token',
      );
    }
  }

  /* =======================================================
      🚪 LOGOUT
  ======================================================= */
  async logout(refreshToken: string, userId?: string, username?: string) {
    const url = `${this.config.get<string>('KEYCLOAK_URL')}/realms/${this.config.get<string>('REALM')}/protocol/openid-connect/logout`;

    const params = new URLSearchParams();
    params.append('client_id', this.config.get<string>('CLIENT_ID')!);
    params.append('client_secret', this.config.get<string>('CLIENT_SECRET')!);
    params.append('refresh_token', refreshToken);

    await axios.post(url, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // Log logout activity
    if (userId && username) {
      console.log('🔐 Logging logout activity for user:', { userId, username });
      await this.activityLogsService.logActivity({
        userId,
        username,
        action: 'USER_LOGOUT',
        description: `User ${username} logged out`,
        status: 'SUCCESS',
      });
    } else {
      console.warn('⚠️ Logout: Missing userId or username for logging', { userId, username });
    }

    return { message: 'Logout successful ✅' };
  }

  /* =======================================================
      � GENERATE RANDOM PASSWORD
  ======================================================= */
  private generatePassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@$!%*?&';
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /* =======================================================
      📧 FORGOT PASSWORD (AUTO-GENERATE PASSWORD)
  ======================================================= */
  async forgotPassword(email: string) {
    const adminToken = await this.getAdminToken();

    // 1️⃣ Find user by email
    const usersUrl = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/users?email=${email}`;

    try {
      const usersRes = await axios.get(usersUrl, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const user = usersRes.data[0];
      if (!user) {
        throw new Error('User not found with this email');
      }

      // 2️⃣ Generate new password
      const newPassword = this.generatePassword();

      // 3️⃣ Set new password in Keycloak
      await this.setUserPassword(user.id, newPassword, adminToken);

      // 4️⃣ Send email with new password
      try {
        await this.emailService.sendPasswordResetEmail(
          email,
          newPassword,
          user.username || user.email,
        );
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }

      // 5️⃣ Log password reset activity
      const keycloakUsername = user.username || user.email;
      console.log('🔐 Logging password reset activity for:', { username: keycloakUsername, email });
      
      await this.activityLogsService.logActivity({
        userId: user.id, // Keycloak user ID
        username: keycloakUsername,
        action: 'PASSWORD_RESET',
        description: `Password reset requested for user ${keycloakUsername}`,
        status: 'SUCCESS',
      });

      return { 
        message: '✅ Password reset successfully! Check your email for your new password.',
        info: 'A temporary password has been sent to your email. Please change it after logging in.'
      };
    } catch (error: any) {
      console.error('Forgot password error:', error.message);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /* =======================================================
      🔑 CHANGE PASSWORD (Keycloak Account Console)
  ======================================================= */
  async changePassword() {
    return {
      message: 'Redirect user to Keycloak account console',
      url: `${this.config.get<string>('KEYCLOAK_URL')}/realms/${this.config.get<string>('REALM')}/account`,
    };
  }

  /* =======================================================
      🔐 UPDATE PASSWORD (with current password verification)
  ======================================================= */
  async updatePassword(username: string, currentPassword: string, newPassword: string) {
    try {
      // 1️⃣ Verify current password by attempting login
      await this.login(username, currentPassword);

      // 2️⃣ Get admin token to update password
      const adminToken = await this.getAdminToken();

      // 3️⃣ Find user by username
      const usersUrl = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/users?username=${username}`;
      const usersRes = await axios.get(usersUrl, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const user = usersRes.data[0];
      if (!user) {
        throw new Error('User not found');
      }

      // 4️⃣ Validate new password strength
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      if (!/[a-z]/.test(newPassword)) {
        throw new Error('Password must contain lowercase letters');
      }
      if (!/[A-Z]/.test(newPassword)) {
        throw new Error('Password must contain uppercase letters');
      }
      if (!/\d/.test(newPassword)) {
        throw new Error('Password must contain numbers');
      }
      if (!/[@$!%*?&]/.test(newPassword)) {
        throw new Error('Password must contain special characters (@$!%*?&)');
      }

      // 5️⃣ Set new password
      await this.setUserPassword(user.id, newPassword, adminToken);

      // 6️⃣ Log password change activity (always log, regardless of MongoDB user)
      console.log('🔐 Logging password change for user:', username);
      await this.activityLogsService.logActivity({
        userId: user.id, // Keycloak user ID
        username: username,
        action: 'PASSWORD_CHANGED',
        description: `User ${username} changed their password`,
        status: 'SUCCESS',
      });

      return {
        message: '✅ Password updated successfully!',
      };
    } catch (error: any) {
      console.error('Update password error:', error.message);
      if (error.status === 400 || error.statusCode === 400) {
        throw new BadRequestException('Current password is incorrect');
      }
      throw new BadRequestException(error.message || 'Failed to update password');
    }
  }

  async getKeycloakUserByUsername(username: string, adminToken: string) {
    const url = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/users?username=${username}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    return response.data[0] || null;
  }

  async createKeycloakUser(userData: any, adminToken: string) {
  const url = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/users`;

  const response = await axios.post(
    url,
    {
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: userData.enabled,
      emailVerified: false,
    },
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );

  // Extract user ID from location header
  const userId = response.headers.location.split('/').pop();
  return { id: userId, ...userData };
}

async setUserPassword(userId: string, password: string, adminToken: string) {
  const url = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/users/${userId}/reset-password`;

  await axios.put(
    url,
    {
      type: 'password',
      value: password,
      temporary: false,
    },
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
}

async assignRole(userId: string, roleName: string, adminToken: string) {
  // First get the role ID
  const rolesUrl = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/roles?search=${roleName}`;

  const rolesRes = await axios.get(rolesUrl, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (rolesRes.data.length === 0) {
    throw new Error(`Role ${roleName} not found`);
  }

  const role = rolesRes.data[0];

  // Assign role to user
  const assignUrl = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/users/${userId}/role-mappings/realm`;

  await axios.post(
    assignUrl,
    [{ id: role.id, name: role.name }],
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );
}

async deleteKeycloakUser(userId: string, adminToken: string) {
  const url = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/users/${userId}`;

  await axios.delete(url, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
}

async markEmailAsVerifiedInKeycloak(keycloakId: string, adminToken: string) {
  const url = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/users/${keycloakId}`;

  try {
    await axios.put(
      url,
      {
        emailVerified: true,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    console.log('✅ Email marked as verified in Keycloak for user:', keycloakId);
  } catch (error: any) {
    console.error('Failed to update emailVerified in Keycloak:', error.message);
    // Don't throw - continue even if this fails
  }
}

  async removeRole(userId: string, roleName: string, adminToken: string) {
    // First get the role ID
    const rolesUrl = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/roles?search=${roleName}`;

    const rolesRes = await axios.get(rolesUrl, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (rolesRes.data.length === 0) {
      // Role doesn't exist, so nothing to remove
      return;
    }

    const role = rolesRes.data[0];

    // Remove role from user
    const removeUrl = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/users/${userId}/role-mappings/realm`;

    try {
      await axios.delete(
        removeUrl,
        {
          data: [{ id: role.id, name: role.name }],
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
    } catch (error: any) {
      console.error(`Failed to remove role ${roleName}:`, error.message);
      // Don't throw - continue even if this fails
    }
  }
}
