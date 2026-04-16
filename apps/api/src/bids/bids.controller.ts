import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PlaceBidDto {
  @ApiProperty() @IsString() shipmentId: string;
  @ApiProperty({ example: 750 }) @IsNumber() @Min(1) amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() estimatedDeliveryDate?: string;
}

@ApiTags('bids')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bids')
export class BidsController {
  constructor(
    private bidsService: BidsService,
    private audit: AuditService,
  ) {}

  @Post()
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Place a bid on a shipment' })
  async placeBid(@CurrentUser('sub') driverId: string, @Body() dto: PlaceBidDto, @Request() req) {
    const result = await this.bidsService.placeBid(driverId, dto);
    await this.audit.log('BID.PLACED', 'Bid', { userId: driverId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: result.id,
      after: { shipmentId: dto.shipmentId, amount: dto.amount },
    });
    return result;
  }

  @Get('my')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Get my bids (driver)' })
  getMyBids(@CurrentUser('sub') driverId: string) {
    return this.bidsService.getDriverBids(driverId);
  }

  @Get('shipment/:shipmentId')
  @Roles(Role.SHIPPER, Role.ADMIN)
  @ApiOperation({ summary: 'Get bids for a shipment (shipper)' })
  getShipmentBids(
    @Param('shipmentId') shipmentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.bidsService.getShipmentBids(shipmentId, userId, role);
  }

  @Patch(':id/accept')
  @Roles(Role.SHIPPER)
  @ApiOperation({ summary: 'Accept a bid' })
  async acceptBid(
    @Param('id') bidId: string,
    @CurrentUser('sub') shipperId: string,
    @Request() req,
  ) {
    const result = await this.bidsService.acceptBid(bidId, shipperId);
    await this.audit.log('BID.ACCEPTED', 'Bid', { userId: shipperId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: bidId,
      after: { bookingId: result.booking.id, agreedAmount: result.booking.agreedAmount },
    });
    return result;
  }

  @Patch(':id/withdraw')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Withdraw a bid' })
  async withdrawBid(
    @Param('id') bidId: string,
    @CurrentUser('sub') driverId: string,
    @Request() req,
  ) {
    const result = await this.bidsService.withdrawBid(bidId, driverId);
    await this.audit.log('BID.WITHDRAWN', 'Bid', { userId: driverId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: bidId,
    });
    return result;
  }
}
