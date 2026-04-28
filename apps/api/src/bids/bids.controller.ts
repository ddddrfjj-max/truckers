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
import { IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SendBidMessageDto {
  @ApiProperty() @IsString() @MinLength(1) content: string;
}

class SendOfferMessageDto {
  @ApiProperty({ example: 700 }) @IsNumber() @Min(1) offerAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

class RespondOfferDto {
  @ApiProperty({ enum: ['accept', 'reject'] }) @IsIn(['accept', 'reject']) action: 'accept' | 'reject';
}

class CounterBidDto {
  @ApiProperty({ example: 650 }) @IsNumber() @Min(1) counterAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() counterNote?: string;
}

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

  @Patch(':id/counter')
  @Roles(Role.SHIPPER, Role.DRIVER)
  @ApiOperation({ summary: 'Send a counter offer on a bid' })
  async counterBid(
    @Param('id') bidId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CounterBidDto,
    @Request() req,
  ) {
    const result = await this.bidsService.counterBid(bidId, userId, role, dto.counterAmount, dto.counterNote);
    await this.audit.log('BID.COUNTERED', 'Bid', { userId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: bidId,
      after: { counterAmount: dto.counterAmount, counterBy: role },
    });
    return result;
  }

  @Patch(':id/accept-counter')
  @Roles(Role.SHIPPER, Role.DRIVER)
  @ApiOperation({ summary: 'Accept a counter offer' })
  async acceptCounter(
    @Param('id') bidId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Request() req,
  ) {
    const result = await this.bidsService.acceptCounter(bidId, userId, role);
    await this.audit.log('BID.COUNTER_ACCEPTED', 'Bid', { userId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: bidId,
    });
    return result;
  }

  @Patch(':id/reject-counter')
  @Roles(Role.SHIPPER, Role.DRIVER)
  @ApiOperation({ summary: 'Reject a counter offer' })
  async rejectCounter(
    @Param('id') bidId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Request() req,
  ) {
    const result = await this.bidsService.rejectCounter(bidId, userId, role);
    await this.audit.log('BID.COUNTER_REJECTED', 'Bid', { userId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
      entityId: bidId,
    });
    return result;
  }

  // ── Bid-level chat ───────────────────────────────────────────────────────

  @Get(':id/chat')
  @Roles(Role.SHIPPER, Role.DRIVER)
  @ApiOperation({ summary: 'Get messages for a bid negotiation chat' })
  getBidMessages(
    @Param('id') bidId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.bidsService.getBidMessages(bidId, userId);
  }

  @Post(':id/chat')
  @Roles(Role.SHIPPER, Role.DRIVER)
  @ApiOperation({ summary: 'Send a text message in bid chat' })
  sendBidMessage(
    @Param('id') bidId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: SendBidMessageDto,
  ) {
    return this.bidsService.sendBidMessage(bidId, userId, dto.content);
  }

  @Post(':id/chat/offer')
  @Roles(Role.SHIPPER, Role.DRIVER)
  @ApiOperation({ summary: 'Send a counter offer in bid chat' })
  sendCounterOffer(
    @Param('id') bidId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: SendOfferMessageDto,
  ) {
    return this.bidsService.sendCounterOfferMessage(bidId, userId, dto.offerAmount, dto.note);
  }

  @Patch(':id/chat/:msgId/respond')
  @Roles(Role.SHIPPER, Role.DRIVER)
  @ApiOperation({ summary: 'Accept or reject a counter offer message' })
  async respondToOffer(
    @Param('id') _bidId: string,
    @Param('msgId') msgId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: RespondOfferDto,
    @Request() req,
  ) {
    if (dto.action === 'accept') {
      const result = await this.bidsService.acceptOfferMessage(msgId, userId);
      await this.audit.log('BID.OFFER_ACCEPTED', 'Bid', { userId, ip: req.ip, userAgent: req.headers['user-agent'] }, {
        entityId: _bidId,
        after: { agreedAmount: result.booking.agreedAmount },
      });
      return result;
    } else {
      const result = await this.bidsService.rejectOfferMessage(msgId, userId);
      await this.audit.log('BID.OFFER_REJECTED', 'Bid', { userId, ip: req.ip, userAgent: req.headers['user-agent'] }, { entityId: _bidId });
      return result;
    }
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
