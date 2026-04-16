import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  getAll(@CurrentUser('sub') userId: string) {
    return this.notificationsService.getForUser(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread count' })
  unreadCount(@CurrentUser('sub') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  readAll(@CurrentUser('sub') userId: string) {
    return this.notificationsService.markRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  readOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificationsService.markRead(userId, id);
  }
}
