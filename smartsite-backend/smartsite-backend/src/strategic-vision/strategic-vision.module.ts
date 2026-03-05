import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrategicVision } from './strategic-vision.entity';
import { StrategicVisionService } from './strategic-vision.service';
import { StrategicVisionController } from './strategic-vision.controller';
import { Company } from '../companies/company.entity';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StrategicVision, Company]),
    ActivityLogsModule,
  ],
  providers: [StrategicVisionService],
  controllers: [StrategicVisionController],
  exports: [StrategicVisionService],
})
export class StrategicVisionModule {}
