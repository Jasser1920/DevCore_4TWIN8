import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private config: ConfigService) {}

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
  async login(username: string, password: string) {
    try {
      const url = `${this.config.get<string>('KEYCLOAK_URL')}/realms/${this.config.get<string>('REALM')}/protocol/openid-connect/token`;

      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', this.config.get<string>('CLIENT_ID')!);
      params.append('client_secret', this.config.get<string>('CLIENT_SECRET')!);
      params.append('username', username);
      params.append('password', password);

      const response = await axios.post(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return response.data;
    } catch (error: any) {
      console.log('KEYCLOAK LOGIN ERROR:', error.response?.data);
      throw new Error(JSON.stringify(error.response?.data));
    }
  }

  /* =======================================================
      🚪 LOGOUT (FIXED)
  ======================================================= */
  async logout(refreshToken: string) {
    const url = `${this.config.get<string>('KEYCLOAK_URL')}/realms/${this.config.get<string>('REALM')}/protocol/openid-connect/logout`;

    const params = new URLSearchParams();
    params.append('client_id', this.config.get<string>('CLIENT_ID')!);
    params.append('client_secret', this.config.get<string>('CLIENT_SECRET')!);
    params.append('refresh_token', refreshToken);

    await axios.post(url, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return { message: 'Logout successful ✅' };
  }

  /* =======================================================
      📧 FORGOT PASSWORD (FIXED - requires redirect_uri)
  ======================================================= */
  async forgotPassword(email: string) {
    const adminToken = await this.getAdminToken();

    // 1️⃣ Find user by email
    const usersUrl = `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}/users?email=${email}`;

    const usersRes = await axios.get(usersUrl, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const user = usersRes.data[0];
    if (!user) throw new Error('User not found');

    // ⚠️ MUST configure this in Keycloak client settings:
    // Valid Redirect URI -> http://localhost:4200/*
    const redirectUri = 'http://localhost:4200';

    // 2️⃣ Send reset email
    const resetUrl =
      `${this.config.get<string>('KEYCLOAK_URL')}/admin/realms/${this.config.get<string>('REALM')}` +
      `/users/${user.id}/execute-actions-email?redirect_uri=${redirectUri}&client_id=${this.config.get<string>('CLIENT_ID')}`;

    await axios.put(
      resetUrl,
      ['UPDATE_PASSWORD'],
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return { message: 'Password reset email sent 📧' };
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
}
