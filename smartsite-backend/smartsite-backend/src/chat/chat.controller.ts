import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';// Assuming standard location
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard) // Uncomment this to require login
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post()
  async getChatResponse(@Req() req: any, @Body('message') message: string) {
    if (!message) {
      return { success: false, error: 'Message is required' };
    }
    return this.chatService.sendMessageToAI(message, req.user);
  }
}
