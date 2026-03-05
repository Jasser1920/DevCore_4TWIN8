import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../core/email.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateUserDto } from './create-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private emailService: EmailService,
    private activityLogsService: ActivityLogsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req) {
    return {
      message: 'User authenticated successfully 🎉',
      user: req.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createUser(
    @Req() req: any,
    @Body() body: CreateUserDto,
  ) {
    // ✅ Step 1: Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can create users',
      );
    }

    try {
      // ✅ Step 2: Create user in Keycloak
      const adminToken = await this.authService.getAdminToken();
      const keycloakUser = await this.authService.createKeycloakUser(
        {
          username: body.username,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          enabled: true,
        },
        adminToken,
      );

      // ✅ Step 3: Set password in Keycloak
      await this.authService.setUserPassword(
        keycloakUser.id,
        body.password,
        adminToken,
      );

      // ✅ Step 4: Assign role in Keycloak
      await this.authService.assignRole(
        keycloakUser.id,
        body.role,
        adminToken,
      );

      // ✅ Step 5: Generate email verification token
      const { token: verificationToken, expireDate: tokenExpireDate } = this.usersService.generateVerificationToken();

      // ✅ Step 6: Save to MongoDB with verification token
      const user = await this.usersService.createUser({
        keycloakId: keycloakUser.id,
        username: body.username,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpire: tokenExpireDate,
        createdBy: req.user.sub, // Track who created this user
      });

      // ✅ Step 7: Send Email Verification Link
      try {
        await this.emailService.sendEmailVerificationLink(
          body.email,
          body.firstName,
          verificationToken,
          {
            username: body.username,
            password: body.password,
          },
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Log error but continue
      }

      // ✅ Step 8: Log user creation activity
      await this.activityLogsService.logActivity({
        userId: user._id.toString(),
        username: user.username,
        action: 'USER_CREATED',
        description: `User ${user.username} created by ${req.user.preferred_username || 'admin'}`,
        details: {
          email: body.email,
          role: body.role,
          firstName: body.firstName,
          lastName: body.lastName,
        },
        status: 'SUCCESS',
        performedBy: req.user.sub,
      });

      return {
        message: '✅ User created successfully! Please check email for verification link.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          keycloakId: user.keycloakId,
          isEmailVerified: user.isEmailVerified,
        },
      };
    } catch (error: any) {
      console.error('Error creating user:', error.message);
      throw new BadRequestException(
        `Failed to create user: ${error.message}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async getAllUsers(@Req() req: any) {
    // ✅ Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can list all users',
      );
    }

    try {
      const users = await this.usersService.getAllUsers();
      return {
        message: 'Users retrieved successfully',
        users: users.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          keycloakId: user.keycloakId,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        })),
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch users: ${error.message}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('diagnose/:username')
  async diagnoseUser(@Req() req: any, @Param('username') username: string) {
    // ✅ Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can diagnose users',
      );
    }

    try {
      const user = await this.usersService.getUserByUsername(username);
      
      if (!user) {
        return {
          message: '⚠️ User not found in MongoDB',
          username,
          found: false,
        };
      }

      return {
        message: '✅ User found in MongoDB',
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          keycloakId: user.keycloakId,
          isEmailVerified: user.isEmailVerified,
          hasVerificationToken: !!user.emailVerificationToken,
          verificationTokenExpire: user.emailVerificationTokenExpire,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        diagnosis: {
          canLogin: user.role === 'SUPER_ADMIN' || user.isEmailVerified,
          reason: user.role === 'SUPER_ADMIN' 
            ? 'SUPER_ADMIN - Can login without email verification'
            : user.isEmailVerified 
            ? 'Email verified - Can login'
            : 'Email NOT verified - BLOCKED from login',
        },
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to diagnose user: ${error.message}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('diagnose-all')
  async diagnoseAllUsers(@Req() req: any) {
    // ✅ Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can diagnose users',
      );
    }

    try {
      const users = await this.usersService.getAllUsers();
      
      const unverifiedUsers = users.filter(user => !user.isEmailVerified && user.role !== 'SUPER_ADMIN');
      const verifiedUsers = users.filter(user => user.isEmailVerified);
      const adminUsers = users.filter(user => user.role === 'SUPER_ADMIN');
      
      return {
        message: '✅ All users diagnosed',
        statistics: {
          totalUsers: users.length,
          adminUsers: adminUsers.length,
          verifiedUsers: verifiedUsers.length,
          unverifiedUsers: unverifiedUsers.length,
        },
        unverifiedUsersList: unverifiedUsers.map(user => ({
          username: user.username,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        })),
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to diagnose users: ${error.message}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@Req() req: any, @Body() updateData: any) {
    try {
      const userId = req.user.mongoId;
      
      // Don't allow changing role or keycloakId through profile update
      const { role, keycloakId, ...allowedUpdates } = updateData;
      
      const updatedUser = await this.usersService.updateUser(userId, allowedUpdates);
      
      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      // Log profile update activity
      await this.activityLogsService.logActivity({
        userId: updatedUser._id.toString(),
        username: updatedUser.username,
        action: 'PROFILE_UPDATED',
        description: `User ${updatedUser.username} updated their profile`,
        details: allowedUpdates,
        status: 'SUCCESS',
      });

      return {
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to update profile: ${error.message}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateUser(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    // ✅ Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can update users',
      );
    }

    try {
      // ✅ Step 1: Get the current user to check if role is changing
      const currentUser = await this.usersService.getUserById(id);

      if (!currentUser) {
        throw new NotFoundException('User not found');
      }

      // ✅ Step 2: Update the database
      const updatedUser = await this.usersService.updateUser(id, updateData);

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      // ✅ Step 3: If role is being changed, sync with Keycloak
      if (updateData.role && updateData.role !== currentUser.role && currentUser.keycloakId) {
        try {
          const adminToken = await this.authService.getAdminToken();

          // Remove old role from Keycloak
          await this.authService.removeRole(
            currentUser.keycloakId,
            currentUser.role,
            adminToken,
          );

          // Assign new role to Keycloak
          await this.authService.assignRole(
            currentUser.keycloakId,
            updateData.role,
            adminToken,
          );

          console.log(
            `✅ Role updated in Keycloak: ${currentUser.username} ${currentUser.role} → ${updateData.role}`,
          );
        } catch (keycloakError: any) {
          console.error('Failed to update role in Keycloak:', keycloakError.message);
          throw new BadRequestException(
            `Failed to update role in Keycloak: ${keycloakError.message}`,
          );
        }
      }

      // ✅ Step 4: Log user update activity
      await this.activityLogsService.logActivity({
        userId: updatedUser._id.toString(),
        username: updatedUser.username,
        action: 'USER_UPDATED',
        description: `User ${updatedUser.username} updated by ${req.user.preferred_username || 'admin'}`,
        details: updateData,
        status: 'SUCCESS',
        performedBy: req.user.sub,
      });

      return {
        message: 'User updated successfully',
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to update user: ${error.message}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    // ✅ Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can delete users',
      );
    }

    try {
      const user = await this.usersService.getUserById(id);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // ✅ Delete from MongoDB
      await this.usersService.deleteUser(id);

      // ✅ Delete from Keycloak
      try {
        const adminToken = await this.authService.getAdminToken();
        await this.authService.deleteKeycloakUser(user.keycloakId, adminToken);
      } catch (keycloakError) {
        console.error('Failed to delete from Keycloak:', keycloakError);
        // Continue even if Keycloak deletion fails
      }

      // Log user deletion activity
      await this.activityLogsService.logActivity({
        userId: user._id.toString(),
        username: user.username,
        action: 'USER_DELETED',
        description: `User ${user.username} deleted by ${req.user.preferred_username || 'admin'}`,
        details: {
          email: user.email,
          role: user.role,
        },
        status: 'SUCCESS',
        performedBy: req.user.sub,
      });

      return {
        message: 'User deleted successfully',
        deletedUser: {
          id: user._id,
          username: user.username,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to delete user: ${error.message}`,
      );
    }
  }

  /* ========================================
      📧 RESEND VERIFICATION EMAIL
  ======================================== */
  @UseGuards(JwtAuthGuard)
  @Post('resend-verification-email')
  async resendVerificationEmail(@Req() req: any) {
    try {
      const email = req.user.email;
      
      // Check if can resend
      const { canResend, waitSeconds } = await this.usersService.canResendVerificationEmail(email);
      if (!canResend) {
        throw new BadRequestException(
          `Please wait ${waitSeconds} seconds before requesting another email`
        );
      }

      // Get user
      const user = await this.usersService.getUserByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Generate new verification token
      const { token: verificationToken, expireDate: tokenExpireDate } = this.usersService.generateVerificationToken();
      
      // Update user with new token
      await this.usersService.updateUser(user._id.toString(), {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpire: tokenExpireDate,
        lastVerificationEmailSentAt: new Date(),
      });

      // Send verification email
      await this.emailService.sendEmailVerificationLink(email, user.username, verificationToken);

      // Log activity
      await this.activityLogsService.logActivity({
        userId: user._id.toString(),
        username: user.username,
        action: 'VERIFICATION_EMAIL_RESENT',
        description: `Verification email resent to ${email}`,
        status: 'SUCCESS',
        performedBy: req.user.sub,
      });

      return {
        message: 'Verification email sent successfully',
        email: email,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /* ========================================
      🗑️ REQUEST ACCOUNT DELETION
  ======================================== */
  @UseGuards(JwtAuthGuard)
  @Post('request-deletion')
  async requestAccountDeletion(
    @Req() req: any,
    @Body() body: { reason?: string }
  ) {
    try {
      const userId = req.user.sub;
      const email = req.user.email;

      // Find user in MongoDB
      const user = await this.usersService.getUserByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Request deletion
      const updatedUser = await this.usersService.requestAccountDeletion(
        user._id.toString(),
        body.reason
      );

      if (!updatedUser) {
        throw new BadRequestException('Failed to request account deletion');
      }

      // Send deletion confirmation email
      await this.emailService.sendAccountDeletionNotice(
        email,
        user.username,
        updatedUser.deletionScheduledFor!
      );

      // Log activity
      await this.activityLogsService.logActivity({
        userId: user._id.toString(),
        username: user.username,
        action: 'DELETION_REQUESTED',
        description: `User requested account deletion. Scheduled for ${updatedUser.deletionScheduledFor}`,
        details: {
          reason: body.reason || 'Not provided',
          scheduledFor: updatedUser.deletionScheduledFor,
        },
        status: 'SUCCESS',
        performedBy: userId,
      });

      return {
        message: 'Account deletion requested',
        scheduledFor: updatedUser.deletionScheduledFor,
        daysRemaining: 30,
        note: 'Your account will be permanently deleted in 30 days. You can cancel this request anytime.',
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /* ========================================
      ❌ CANCEL ACCOUNT DELETION
  ======================================== */
  @UseGuards(JwtAuthGuard)
  @Post('cancel-deletion')
  async cancelAccountDeletion(@Req() req: any) {
    try {
      const email = req.user.email;

      // Find user in MongoDB
      const user = await this.usersService.getUserByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if deletion is pending
      const deletionStatus = await this.usersService.getDeletionStatus(user._id.toString());
      if (!deletionStatus.hasPendingDeletion) {
        throw new BadRequestException('No pending deletion request found');
      }

      // Cancel deletion
      const updatedUser = await this.usersService.cancelAccountDeletion(user._id.toString());

      // Send cancellation confirmation email
      await this.emailService.sendDeletionCancellationNotice(email, user.username);

      // Log activity
      await this.activityLogsService.logActivity({
        userId: user._id.toString(),
        username: user.username,
        action: 'DELETION_CANCELLED',
        description: `User cancelled account deletion request`,
        status: 'SUCCESS',
        performedBy: req.user.sub,
      });

      return {
        message: 'Account deletion request cancelled',
        status: 'active',
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /* ========================================
      ℹ️ GET DELETION STATUS
  ======================================== */
  @UseGuards(JwtAuthGuard)
  @Get('deletion-status')
  async getDeletionStatus(@Req() req: any) {
    try {
      const email = req.user.email;

      // Find user in MongoDB
      const user = await this.usersService.getUserByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.usersService.getDeletionStatus(user._id.toString());
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}












