import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Project } from '../projects/project.entity';
import { Company } from '../companies/company.entity';
import { UserSchema } from '../users/user.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Company]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
