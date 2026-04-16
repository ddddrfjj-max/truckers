import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my full profile' })
  getMe(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update my profile' })
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me/driver-profile')
  @ApiOperation({ summary: 'Get driver profile' })
  getDriverProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.getDriverProfile(userId);
  }

  @Patch('me/driver-profile')
  @ApiOperation({ summary: 'Update driver profile' })
  updateDriverProfile(
    @CurrentUser('sub') userId: string,
    @Body() body: any,
  ) {
    return this.usersService.updateDriverProfile(userId, body);
  }

  @Get('driver/:id/public')
  @ApiOperation({ summary: 'Get public driver profile (for shippers viewing bids)' })
  getPublicDriverProfile(@Param('id') driverId: string) {
    return this.usersService.getPublicDriverProfile(driverId);
  }
}
