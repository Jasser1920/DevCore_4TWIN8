// src/core/init.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InitService implements OnModuleInit {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.initializeSuperAdmin();
    } catch (error) {
      console.error('Error initializing super admin:', error);
    }
  }

  private async initializeSuperAdmin() {
    const superAdminUsername = this.config.get('SUPER_ADMIN_USERNAME', 'admin');
    const superAdminEmail = this.config.get('SUPER_ADMIN_EMAIL', 'admin@smartsite.com');
    const superAdminPassword = this.config.get('SUPER_ADMIN_PASSWORD');

    if (!superAdminPassword) {
      console.warn('⚠️  SUPER_ADMIN_PASSWORD not set in environment');
      return;
    }

    try {
      // Check if super admin already exists
      const exists = await this.usersService.getUserByUsername(superAdminUsername);
      if (exists) {
        console.log('✅ Super admin already exists');
        return;
      }

      // Create user in Keycloak
      const adminToken = await this.authService.getAdminToken();
      const keycloakUser = await this.authService.createKeycloakUser(
        {
          username: superAdminUsername,
          email: superAdminEmail,
          firstName: 'Super',
          lastName: 'Admin',
          enabled: true,
        },
        adminToken,
      );

      // Set password
      await this.authService.setUserPassword(
        keycloakUser.id,
        superAdminPassword,
        adminToken,
      );

      // Assign SUPER_ADMIN role
      await this.authService.assignRole(
        keycloakUser.id,
        'SUPER_ADMIN',
        adminToken,
      );

      // Save to MongoDB
      await this.usersService.createUser({
        keycloakId: keycloakUser.id,
        username: superAdminUsername,
        email: superAdminEmail,
        role: 'SUPER_ADMIN',
      });

      console.log('✅ Super admin created successfully');
    } catch (error: any) {
      console.error('Error creating super admin:', error.message);
    }
  }
}