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

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectValidationHistory, Company, StrategicVision, Milestone]),
    ActivityLogsModule,
    UsersModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
