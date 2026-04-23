import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private audit: AuditService,
  ) {}

  @Post('register')
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new account' })
  async register(@Body() dto: RegisterDto, @Request() req) {
    const result = await this.authService.register(dto);
    await this.audit.log('USER.REGISTER', 'User', { ip: req.ip, userAgent: req.headers['user-agent'], userId: result.user.id }, {
      entityId: result.user.id,
      after: { email: result.user.email, role: result.user.role },
    });
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req) {
    const result = await this.authService.login(req.user);
    await this.audit.log('USER.LOGIN', 'User', { ip: req.ip, userAgent: req.headers['user-agent'], userId: result.user.id }, {
      entityId: result.user.id,
    });
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Request() req) {
    return this.authService.refreshTokens(req.user.sub, req.user.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Request() req) {
    return this.authService.getMe(req.user.sub);
  }
}
