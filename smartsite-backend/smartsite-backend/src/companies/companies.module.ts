import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './company.entity';
import { UsersModule } from '../users/users.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { EmailService } from '../core/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), UsersModule, ActivityLogsModule],
  providers: [CompaniesService, EmailService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}
