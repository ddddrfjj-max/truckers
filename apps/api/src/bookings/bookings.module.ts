import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { ChatService } from './chat.service';

@Module({
  providers: [BookingsService, ChatService],
  controllers: [BookingsController],
  exports: [BookingsService, ChatService],
})
export class BookingsModule {}
