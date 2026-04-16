import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { AuditService } from '../audit/audit.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('shipments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(
    private shipmentsService: ShipmentsService,
    private audit: AuditService,
  ) {}

  @Get('browse')
  @ApiOperation({ summary: 'Browse available shipments (drivers)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'cargoType', required: false })
  @ApiQuery({ name: 'pickupCity', required: false })
  @ApiQuery({ name: 'deliveryCity', required: false })
  browseAvailable(@Query() query: any) {
    return this.shipmentsService.findAvailableForDrivers(query);
  }

  @Get('my')
  @Roles(Role.SHIPPER, Role.ADMIN)
  @ApiOperation({ summary: 'Get my shipments (shipper)' })
  getMyShipments(@CurrentUser('sub') userId: string, @Query() query: any) {
    return this.shipmentsService.findAll({ ...query, shipperId: userId } as any);
  }

  @Get('my/stats')
  @Roles(Role.SHIPPER)
  @ApiOperation({ summary: 'Get shipper stats' })
  getStats(@CurrentUser('sub') userId: string) {
    return this.shipmentsService.getShipperStats(userId);
  }

  @Post()
  @Roles(Role.SHIPPER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new shipment' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateShipmentDto,
    @Request() req,
  ) {
    const result = await this.shipmentsService.create(userId, dto);
    await this.audit.log('SHIPMENT.CREATED', 'Shipment', { userId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: result.id,
      after: { title: result.title, pickupCity: result.pickupCity, deliveryCity: result.deliveryCity },
    });
    return result;
  }

  @Post(':id/images')
  @Roles(Role.SHIPPER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image for a shipment' })
  uploadImage(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.shipmentsService.addImage(id, userId, file);
  }

  @Delete(':id/images/:imageId')
  @Roles(Role.SHIPPER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a shipment image' })
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.shipmentsService.deleteImage(imageId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipment details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.shipmentsService.findOne(id, userId, role);
  }

  @Patch(':id')
  @Roles(Role.SHIPPER, Role.ADMIN)
  @ApiOperation({ summary: 'Update shipment' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() body: any,
  ) {
    return this.shipmentsService.update(id, userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel shipment' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Request() req,
  ) {
    const result = await this.shipmentsService.cancel(id, userId, role);
    await this.audit.log('SHIPMENT.CANCELLED', 'Shipment', { userId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: id,
    });
    return result;
  }
}
