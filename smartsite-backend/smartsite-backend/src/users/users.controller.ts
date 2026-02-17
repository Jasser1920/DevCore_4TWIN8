import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
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
    @Body()
    body: {
      username: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: 'SUPER_ADMIN' | 'DIRECTOR' | 'PROJECT_MANAGER' | 'QHSE_MANAGER' | 'CLIENT';
    },
  ) {
    // ✅ Step 1: Verify requester is SUPER_ADMIN
    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException(
        '❌ Only super admin can create users',
      );
    }

    // ✅ Step 2: Validate input
    if (
      !body.username ||
      !body.email ||
      !body.password ||
      !body.firstName ||
      !body.lastName ||
      !body.role
    ) {
      throw new BadRequestException('Missing required fields');
    }

    if (!['SUPER_ADMIN', 'DIRECTOR', 'PROJECT_MANAGER', 'QHSE_MANAGER', 'CLIENT'].includes(body.role)) {
      throw new BadRequestException(
        'Invalid role. Must be SUPER_ADMIN, DIRECTOR, PROJECT_MANAGER, QHSE_MANAGER, or CLIENT',
      );
    }

    try {
      // ✅ Step 3: Create user in Keycloak
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

      // ✅ Step 4: Set password in Keycloak
      await this.authService.setUserPassword(
        keycloakUser.id,
        body.password,
        adminToken,
      );

      // ✅ Step 5: Assign role in Keycloak
      await this.authService.assignRole(
        keycloakUser.id,
        body.role,
        adminToken,
      );

      // ✅ Step 6: Save to MongoDB
      const user = await this.usersService.createUser({
        keycloakId: keycloakUser.id,
        username: body.username,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        createdBy: req.user.sub, // Track who created this user
      });

      return {
        message: '✅ User created successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          keycloakId: user.keycloakId,
        },
      };
    } catch (error: any) {
      console.error('Error creating user:', error.message);
      throw new BadRequestException(
        `Failed to create user: ${error.message}`,
      );
    }
  }
}












