import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { CompaniesModule } from './companies/companies.module';
import { StrategicVisionModule } from './strategic-vision/strategic-vision.module';
import { Company } from './companies/company.entity';
import { StrategicVision } from './strategic-vision/strategic-vision.entity';
import { InitService } from './core/init.service';
import { ProjectsModule } from './projects/projects.module';
import { Project } from './projects/project.entity';
import { ProjectValidationHistory } from './projects/project-validation-history.entity';
import { Milestone } from './projects/milestone.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot('mongodb://localhost:27017/smartsite'),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST', 'localhost'),
        port: configService.get('POSTGRES_PORT', 5432),
        username: configService.get('POSTGRES_USER', 'smartsite'),
        password: configService.get('POSTGRES_PASSWORD', 'smartsite'),
        database: configService.get('POSTGRES_DB', 'smartsite'),
        entities: [Company, StrategicVision, Project, ProjectValidationHistory, Milestone],
        synchronize: true,
        logging: false,
      }),
    }),
    AuthModule,
    UsersModule,
    DevicesModule,
    ActivityLogsModule,
    CompaniesModule,
    StrategicVisionModule,
    ProjectsModule,
  ],
  providers: [InitService],
})
export class AppModule {}
