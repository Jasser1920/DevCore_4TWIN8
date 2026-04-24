// src/core/init.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

interface UserConfig {
  username: string;
  email: string;
  password: string;
  role: 'DIRECTOR' | 'PROJECT_MANAGER' | 'QHSE_MANAGER' | 'CLIENT';
  firstName: string;
  lastName: string;
}

@Injectable()
export class InitService implements OnModuleInit {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      console.log('🚀 Initializing system users...');
      await this.initializeSuperAdmin();
      await this.initializeRoleBasedUsers();
      console.log('✅ System initialization completed');
    } catch (error) {
      console.error('❌ Error initializing system:', error);
    }
  }

  /* ==========================================
      Initialize Super Admin
  ========================================== */
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
      let keycloakUserId: string;

      try {
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
        keycloakUserId = keycloakUser.id;
        
        // Set password if newly created
        await this.authService.setUserPassword(
          keycloakUserId,
          superAdminPassword,
          adminToken,
        );
      } catch (error: any) {
        if (error.response?.status === 409) {
          console.log('ℹ️ Super admin already exists in Keycloak, fetching ID...');
          const existingUser = await this.authService.getKeycloakUserByUsername(superAdminUsername, adminToken);
          if (!existingUser) throw new Error('Could not find existing super admin in Keycloak');
          keycloakUserId = existingUser.id;
        } else {
          throw error;
        }
      }

      // Assign SUPER_ADMIN role
      await this.authService.assignRole(
        keycloakUserId,
        'SUPER_ADMIN',
        adminToken,
      );

      // Save to MongoDB
      // Note: SUPER_ADMIN bypasses email verification requirement
      await this.usersService.createUser({
        keycloakId: keycloakUserId,
        username: superAdminUsername,
        email: superAdminEmail,
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpire: null,
      });

      console.log('✅ Super admin created successfully');
    } catch (error: any) {
      console.error('❌ Error creating super admin:', error.message);
    }
  }

  /* ==========================================
      Initialize Users with Each Role
  ========================================== */
  private async initializeRoleBasedUsers() {
    const userConfigs: UserConfig[] = [
      {
        username: this.config.get('DIRECTOR_USERNAME', 'director'),
        email: this.config.get('DIRECTOR_EMAIL', 'director@smartsite.com'),
        password: this.config.get('DIRECTOR_PASSWORD', 'Director@123'),
        role: 'DIRECTOR',
        firstName: 'Director',
        lastName: 'User',
      },
      {
        username: this.config.get('PROJECT_MANAGER_USERNAME', 'project_manager'),
        email: this.config.get('PROJECT_MANAGER_EMAIL', 'pm@smartsite.com'),
        password: this.config.get('PROJECT_MANAGER_PASSWORD', 'ProjectManager@123'),
        role: 'PROJECT_MANAGER',
        firstName: 'Project',
        lastName: 'Manager',
      },
      {
        username: this.config.get('QHSE_MANAGER_USERNAME', 'qhse_manager'),
        email: this.config.get('QHSE_MANAGER_EMAIL', 'qhse@smartsite.com'),
        password: this.config.get('QHSE_MANAGER_PASSWORD', 'QhseManager@123'),
        role: 'QHSE_MANAGER',
        firstName: 'QHSE',
        lastName: 'Manager',
      },
      {
        username: this.config.get('CLIENT_USERNAME', 'client'),
        email: this.config.get('CLIENT_EMAIL', 'client@smartsite.com'),
        password: this.config.get('CLIENT_PASSWORD', 'Client@123'),
        role: 'CLIENT',
        firstName: 'Client',
        lastName: 'User',
      },
    ];

    const adminToken = await this.authService.getAdminToken();

    for (const userConfig of userConfigs) {
      try {
        // Check if user already exists
        const exists = await this.usersService.getUserByUsername(userConfig.username);
        if (exists) {
          console.log(`✅ ${userConfig.role} user already exists: ${userConfig.username}`);
          continue;
        }

        // Create user in Keycloak
        let keycloakUserId: string;
        try {
          const keycloakUser = await this.authService.createKeycloakUser(
            {
              username: userConfig.username,
              email: userConfig.email,
              firstName: userConfig.firstName,
              lastName: userConfig.lastName,
              enabled: true,
            },
            adminToken,
          );
          keycloakUserId = keycloakUser.id;

          // Set password
          await this.authService.setUserPassword(
            keycloakUserId,
            userConfig.password,
            adminToken,
          );
        } catch (error: any) {
          if (error.response?.status === 409) {
            console.log(`ℹ️ ${userConfig.role} user already exists in Keycloak: ${userConfig.username}`);
            const existingUser = await this.authService.getKeycloakUserByUsername(userConfig.username, adminToken);
            if (!existingUser) throw new Error(`Could not find existing ${userConfig.role} user in Keycloak`);
            keycloakUserId = existingUser.id;
          } else {
            throw error;
          }
        }

        // Assign role
        await this.authService.assignRole(
          keycloakUserId,
          userConfig.role,
          adminToken,
        );

        // Save to MongoDB
        await this.usersService.createUser({
          keycloakId: keycloakUserId,
          username: userConfig.username,
          email: userConfig.email,
          firstName: userConfig.firstName,
          lastName: userConfig.lastName,
          role: userConfig.role,
          isEmailVerified: true, // For demo purposes, auto-verify
          emailVerificationToken: null,
          emailVerificationTokenExpire: null,
        });

        console.log(`✅ ${userConfig.role} user created successfully: ${userConfig.username}`);
      } catch (error: any) {
        console.error(`❌ Error creating ${userConfig.role} user:`, error.message);
      }
    }
  }
}