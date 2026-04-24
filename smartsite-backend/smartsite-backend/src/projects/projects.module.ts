import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './project.entity';
import { ProjectValidationHistory } from './project-validation-history.entity';
import { Company } from '../companies/company.entity';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { UsersModule } from '../users/users.module';
import { StrategicVision } from '../strategic-vision/strategic-vision.entity';
import { Milestone } from './milestone.entity';
import { QhseSiteReport } from './qhse-site-report.entity';
import { QhseCorrectiveAction } from './qhse-corrective-action.entity';
import { ApiUsageService } from '../common/api-usage.service';
import { EmailService } from '../core/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectValidationHistory, Company, StrategicVision, Milestone]),
    TypeOrmModule.forFeature([QhseSiteReport, QhseCorrectiveAction]),
    ActivityLogsModule,
    UsersModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ApiUsageService, EmailService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
