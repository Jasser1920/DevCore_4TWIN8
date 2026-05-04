import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from '../core/email.service';
import { User, UserSchema } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    ActivityLogsModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  providers: [JwtStrategy, AuthService, EmailService, UsersService],
  exports: [PassportModule, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
