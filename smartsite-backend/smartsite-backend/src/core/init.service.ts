// src/core/init.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

interface UserConfig {
  username: string;
  email: string;
  password?: string;
  role:
    | 'SUPER_ADMIN'
    | 'DIRECTOR'
    | 'PROJECT_MANAGER'
    | 'QHSE_MANAGER'
    | 'CLIENT';
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
      console.log('Initializing system users...');
      const adminToken = await this.authService.getAdminToken();
      await this.initializeSuperAdmin(adminToken);
      await this.initializeRoleBasedUsers(adminToken);
      console.log('System initialization completed');
    } catch (error) {
      console.error('Error initializing system:', error);
    }
  }

  private async initializeSuperAdmin(adminToken: string) {
    const superAdminPassword = this.config.get<string>('SUPER_ADMIN_PASSWORD');

    if (!superAdminPassword) {
      console.warn('SUPER_ADMIN_PASSWORD not set in environment');
      return;
    }

    try {
      await this.ensureSystemUser(
        {
          username: this.config.get('SUPER_ADMIN_USERNAME', 'admin'),
          email: this.config.get('SUPER_ADMIN_EMAIL', 'admin@smartsite.com'),
          password: superAdminPassword,
          role: 'SUPER_ADMIN',
          firstName: 'Super',
          lastName: 'Admin',
        },
        adminToken,
      );
    } catch (error: any) {
      console.error('Error creating super admin:', error.message);
    }
  }

  private async initializeRoleBasedUsers(adminToken: string) {
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
        password: this.config.get(
          'PROJECT_MANAGER_PASSWORD',
          'ProjectManager@123',
        ),
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

    for (const userConfig of userConfigs) {
      try {
        await this.ensureSystemUser(userConfig, adminToken);
      } catch (error: any) {
        console.error(`Error creating ${userConfig.role} user:`, error.message);
      }
    }
  }

  private async ensureSystemUser(userConfig: UserConfig, adminToken: string) {
    const mongoUserByUsername = await this.usersService.getUserByUsername(
      userConfig.username,
    );
    const mongoUserByEmail = await this.usersService.getUserByEmail(
      userConfig.email,
    );
    const mongoUser = mongoUserByUsername || mongoUserByEmail;

    let keycloakUser = await this.authService.findKeycloakUserByUsername(
      userConfig.username,
      adminToken,
    );

    if (!keycloakUser) {
      keycloakUser = await this.authService.findKeycloakUserByEmail(
        userConfig.email,
        adminToken,
      );
    }

    let wasCreatedInKeycloak = false;

    if (!keycloakUser) {
      keycloakUser = await this.authService.createKeycloakUser(
        {
          username: userConfig.username,
          email: userConfig.email,
          firstName: userConfig.firstName,
          lastName: userConfig.lastName,
          enabled: true,
        },
        adminToken,
      );
      wasCreatedInKeycloak = true;
    } else {
      await this.authService.updateKeycloakUser(
        keycloakUser.id,
        {
          username: userConfig.username,
          email: userConfig.email,
          firstName: userConfig.firstName,
          lastName: userConfig.lastName,
          enabled: true,
        },
        adminToken,
      );
    }

    if (!keycloakUser) {
      throw new Error(`Unable to resolve Keycloak user for ${userConfig.username}`);
    }

    if (wasCreatedInKeycloak && userConfig.password) {
      await this.authService.setUserPassword(
        keycloakUser.id,
        userConfig.password,
        adminToken,
      );
    }

    await this.authService.assignRole(
      keycloakUser.id,
      userConfig.role,
      adminToken,
    );

    const userPayload = {
      keycloakId: keycloakUser.id,
      username: userConfig.username,
      email: userConfig.email,
      firstName: userConfig.firstName,
      lastName: userConfig.lastName,
      role: userConfig.role,
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpire: null,
    };

    if (mongoUser) {
      await this.usersService.updateUserById(mongoUser.id, userPayload);
      console.log(`${userConfig.role} user synced: ${userConfig.username}`);
      return;
    }

    const mongoUserByKeycloakId = await this.usersService.getUserByKeycloakId(
      keycloakUser.id,
    );

    if (mongoUserByKeycloakId) {
      await this.usersService.updateUserById(mongoUserByKeycloakId.id, userPayload);
      console.log(
        `${userConfig.role} user linked by Keycloak ID: ${userConfig.username}`,
      );
      return;
    }

    await this.usersService.createUser(userPayload);
    console.log(`${userConfig.role} user created successfully: ${userConfig.username}`);
  }
}
