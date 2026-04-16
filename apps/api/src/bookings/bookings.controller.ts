import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { ChatService } from './chat.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookingStatus, Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UpdateStatusDto {
  @ApiProperty({ enum: BookingStatus }) @IsEnum(BookingStatus) status: BookingStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

class SendMessageDto {
  @ApiProperty() @IsString() @MinLength(1) content: string;
}

@ApiTags('bookings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(
    private bookingsService: BookingsService,
    private chatService: ChatService,
    private audit: AuditService,
  ) {}

  @Get('my/driver')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Get my jobs as driver' })
  getDriverJobs(@CurrentUser('sub') driverId: string) {
    return this.bookingsService.getDriverBookings(driverId);
  }

  @Get('my/driver/stats')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Get driver stats' })
  getDriverStats(@CurrentUser('sub') driverId: string) {
    return this.bookingsService.getDriverStats(driverId);
  }

  @Get('my/shipper')
  @Roles(Role.SHIPPER)
  @ApiOperation({ summary: 'Get my bookings as shipper' })
  getShipperBookings(@CurrentUser('sub') shipperId: string) {
    return this.bookingsService.getShipperBookings(shipperId);
  }

  @Get('chat/unread')
  @ApiOperation({ summary: 'Get unread message count across all bookings' })
  unreadCount(@CurrentUser('sub') userId: string) {
    return this.chatService.unreadCount(userId).then(count => ({ count }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Request() req,
  ) {
    const result = await this.bookingsService.updateStatus(id, dto.status, userId, role, dto.notes);
    await this.audit.log('BOOKING.STATUS_UPDATED', 'Booking', { userId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: id,
      after: { status: dto.status, notes: dto.notes },
    });
    return result;
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get chat messages for a booking' })
  getMessages(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.chatService.getMessages(id, userId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a chat message' })
  sendMessage(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(id, userId, dto.content);
  }
}
