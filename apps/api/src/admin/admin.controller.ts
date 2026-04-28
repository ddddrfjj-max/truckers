import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DocumentStatus, Role, ShipmentStatus, UserStatus } from '@prisma/client';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private audit: AuditService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user status' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: UserStatus; notes?: string },
    @CurrentUser() caller: any,
    @Request() req,
  ) {
    const result = await this.adminService.updateUserStatus(id, body.status, caller.role, body.notes);
    await this.audit.log('ADMIN.USER_STATUS_UPDATED', 'User', { userId: caller.sub, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: id,
      after: { status: body.status, notes: body.notes },
    });
    return result;
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user account (DEVELOPER only)' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() caller: any,
    @Request() req,
  ) {
    const result = await this.adminService.deleteUser(id, caller.role);
    await this.audit.log('ADMIN.USER_DELETED', 'User', { userId: caller.sub, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: id,
    });
    return result;
  }

  @Get('shipments')
  @ApiOperation({ summary: 'List all shipments' })
  getShipments(@Query() query: any) {
    return this.adminService.getAllShipments(query);
  }

  @Patch('shipments/:id/status')
  @ApiOperation({ summary: 'Update shipment status (Admin/Dev)' })
  async updateShipmentStatus(
    @Param('id') id: string,
    @Body() body: { status: ShipmentStatus },
    @CurrentUser() caller: any,
    @Request() req,
  ) {
    const result = await this.adminService.updateShipmentStatus(id, body.status);
    await this.audit.log('ADMIN.SHIPMENT_STATUS_UPDATED', 'Shipment', { userId: caller.sub, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: id,
      after: { status: body.status },
    });
    return result;
  }

  @Get('bookings')
  @ApiOperation({ summary: 'List all bookings' })
  getBookings(@Query() query: any) {
    return this.adminService.getAllBookings(query);
  }

  @Get('documents/pending')
  @ApiOperation({ summary: 'Get pending documents for review' })
  getPendingDocs() {
    return this.adminService.getPendingDocuments();
  }

  @Patch('documents/:id/review')
  @ApiOperation({ summary: 'Approve or reject a document' })
  async reviewDocument(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
    @Body() body: { status: DocumentStatus; notes?: string },
    @Request() req,
  ) {
    const result = await this.adminService.reviewDocument(id, adminId, body.status, body.notes);
    await this.audit.log('ADMIN.DOCUMENT_REVIEWED', 'Document', { userId: adminId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: id,
      after: { status: body.status, notes: body.notes },
    });
    return result;
  }

  @Get('drivers/verification')
  @ApiOperation({ summary: 'Get drivers for verification review' })
  getDriversForVerification(@Query() query: any) {
    return this.adminService.getDriversForVerification(query);
  }

  @Patch('drivers/:id/verification')
  @ApiOperation({ summary: 'Approve or reject driver verification' })
  async updateDriverVerification(
    @Param('id') driverId: string,
    @CurrentUser('sub') adminId: string,
    @Body() body: { status: string; notes?: string },
    @Request() req,
  ) {
    const result = await this.adminService.updateDriverVerification(driverId, adminId, body.status, body.notes);
    await this.audit.log('ADMIN.DRIVER_VERIFICATION_UPDATED', 'DriverProfile', { userId: adminId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: driverId,
      after: { status: body.status, notes: body.notes },
    });
    return result;
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get security audit logs' })
  getAuditLogs(@Query() query: any) {
    return this.adminService.getAuditLogs(query);
  }

  @Get('contact-messages')
  @ApiOperation({ summary: 'Get contact form messages' })
  getContactMessages(@Query() query: any) {
    return this.adminService.getContactMessages(query);
  }

  @Patch('contact-messages/:id/read')
  @ApiOperation({ summary: 'Mark contact message as read' })
  markContactRead(@Param('id') id: string) {
    return this.adminService.markContactRead(id);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Promote a user to ADMIN (DEVELOPER only)' })
  async setUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @CurrentUser() caller: any,
    @Request() req,
  ) {
    const result = await this.adminService.setUserRole(id, body.role, caller.role);
    await this.audit.log('ADMIN.USER_ROLE_CHANGED', 'User', { userId: caller.sub, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: id,
      after: { role: body.role },
    });
    return result;
  }

  @Post('users/create-admin')
  @ApiOperation({ summary: 'Create a new admin account (DEVELOPER only)' })
  async createAdmin(
    @Body() body: { email: string; password: string; firstName: string; lastName: string },
    @CurrentUser() caller: any,
    @Request() req,
  ) {
    const result = await this.adminService.createAdminAccount(body, caller.role);
    await this.audit.log('ADMIN.ADMIN_CREATED', 'User', { userId: caller.sub, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: result.id,
      after: { email: body.email },
    });
    return result;
  }
}
