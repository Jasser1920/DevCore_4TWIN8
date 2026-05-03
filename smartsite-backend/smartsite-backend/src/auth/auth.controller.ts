import { Body, Controller, Post, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './forgot-password.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  // LOGIN
  @Post('login')
  login(@Req() req: any, @Body() body: { username: string; password: string; captchaToken: string }) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(body.username, body.password, body.captchaToken, ipAddress, userAgent);
  }

  // REFRESH TOKEN
  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  // LOGOUT
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: any, @Body() body: { refreshToken: string }) {
    const userId = req.user?.sub; // Keycloak user ID
    const username = req.user?.preferred_username;
    return this.authService.logout(body.refreshToken, userId, username);
  }

  // FORGOT PASSWORD
  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  // CHANGE PASSWORD
  @Post('change-password')
  changePassword() {
    return this.authService.changePassword();
  }

  // UPDATE PASSWORD (with current password verification)
  @Post('update-password')
  async updatePassword(
    @Body() body: { currentPassword: string; newPassword: string; username: string },
  ) {
    return this.authService.updatePassword(
      body.username,
      body.currentPassword,
      body.newPassword,
    );
  }

  // VERIFY EMAIL
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Query('email') email: string) {
    try {
      // ✅ Step 1: Verify token and update MongoDB
      const user = await this.usersService.verifyEmailToken(email, token);
      
      // ✅ Step 2: Update Keycloak to mark email as verified
      try {
        const adminToken = await this.authService.getAdminToken();
        await this.authService.markEmailAsVerifiedInKeycloak(user.keycloakId, adminToken);
      } catch (keycloakError) {
        console.error('⚠️ Failed to update Keycloak emailVerified status:', keycloakError);
        // Continue - MongoDB is already updated, which is what we use for login check
      }
      
      return {
        message: '✅ Email verified successfully! You can now login.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      };
    } catch (error: any) {
      return {
        message: '❌ Email verification failed',
        error: error.message,
      };
    }
  }
}
