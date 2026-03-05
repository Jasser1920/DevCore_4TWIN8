// src/activity-logs/activity-logs.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogSchema } from './activity-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'ActivityLog', schema: ActivityLogSchema }]),
  ],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}
