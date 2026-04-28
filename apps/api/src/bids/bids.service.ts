import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BidStatus, ShipmentStatus } from '@prisma/client';
import { SHIPPER_WITH_PROFILE, DRIVER_WITH_PROFILE } from '../common/prisma-selects';

const BID_CHAT_SENDER = { include: { profile: true } } as const;

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  async placeBid(driverId: string, dto: { shipmentId: string; amount: number; note?: string; estimatedDeliveryDate?: string }) {
    // Verification gate — driver must be approved before bidding
    const driverProfile = await this.prisma.driverProfile.findUnique({ where: { userId: driverId } });
    if (!driverProfile || driverProfile.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        driverProfile?.verificationStatus === 'PENDING' || driverProfile?.verificationStatus === 'UNDER_REVIEW'
          ? 'Your documents are under review. You can bid once your account is verified.'
          : 'You must upload your documents and get verified before placing bids.',
      );
    }

    const shipment = await this.prisma.shipment.findUnique({
      where: { id: dto.shipmentId },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (shipment.status !== ShipmentStatus.OPEN && shipment.status !== ShipmentStatus.BIDDING)
      throw new BadRequestException('Shipment is not open for bids');
    if (shipment.shipperId === driverId)
      throw new ForbiddenException('Cannot bid on your own shipment');

    const existing = await this.prisma.bid.findUnique({
      where: { shipmentId_driverId: { shipmentId: dto.shipmentId, driverId } },
    });
    if (existing && existing.status === BidStatus.PENDING)
      throw new ConflictException('You already have an active bid on this shipment');

    // Update shipment to BIDDING if still OPEN
    if (shipment.status === ShipmentStatus.OPEN) {
      await this.prisma.shipment.update({
        where: { id: dto.shipmentId },
        data: { status: ShipmentStatus.BIDDING },
      });
    }

    return this.prisma.bid.create({
      data: {
        shipmentId: dto.shipmentId,
        driverId,
        amount: dto.amount,
        note: dto.note,
        estimatedDeliveryDate: dto.estimatedDeliveryDate
          ? new Date(dto.estimatedDeliveryDate)
          : undefined,
      },
      include: {
        driver: DRIVER_WITH_PROFILE,
        shipment: true,
      },
    });
  }

  async getDriverBids(driverId: string) {
    return this.prisma.bid.findMany({
      where: { driverId },
      include: {
        shipment: { include: { shipper: SHIPPER_WITH_PROFILE } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getShipmentBids(shipmentId: string, requesterId: string, role: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (role !== 'ADMIN' && shipment.shipperId !== requesterId)
      throw new ForbiddenException();

    return this.prisma.bid.findMany({
      where: { shipmentId },
      include: {
        driver: DRIVER_WITH_PROFILE,
      },
      orderBy: { amount: 'asc' },
    });
  }

  async acceptBid(bidId: string, shipperId: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { shipment: true, driver: { select: { id: true, driverProfile: true } } },
    });
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.shipment.shipperId !== shipperId)
      throw new ForbiddenException('Not your shipment');
    if (bid.status !== BidStatus.PENDING)
      throw new BadRequestException('Bid is no longer pending');
    if (bid.shipment.status === ShipmentStatus.BOOKED)
      throw new BadRequestException('Shipment already booked');

    if (!bid.driver.driverProfile)
      throw new BadRequestException('Driver has no driver profile');

    // Transaction: accept bid, reject others, create booking, update shipment
    const [updatedBid, , booking] = await this.prisma.$transaction([
      this.prisma.bid.update({
        where: { id: bidId },
        data: { status: BidStatus.ACCEPTED, respondedAt: new Date() },
      }),
      this.prisma.bid.updateMany({
        where: {
          shipmentId: bid.shipmentId,
          id: { not: bidId },
          status: BidStatus.PENDING,
        },
        data: { status: BidStatus.REJECTED, respondedAt: new Date() },
      }),
      this.prisma.booking.create({
        data: {
          shipmentId: bid.shipmentId,
          bidId: bid.id,
          driverId: bid.driverId,
          driverProfileId: bid.driver.driverProfile.id,
          agreedAmount: bid.amount,
        },
      }),
      this.prisma.shipment.update({
        where: { id: bid.shipmentId },
        data: { status: ShipmentStatus.BOOKED },
      }),
    ]);

    return { bid: updatedBid, booking };
  }

  async withdrawBid(bidId: string, driverId: string) {
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.driverId !== driverId) throw new ForbiddenException();
    if (bid.status !== BidStatus.PENDING && bid.status !== BidStatus.COUNTERED)
      throw new BadRequestException('Bid cannot be withdrawn');

    return this.prisma.bid.update({
      where: { id: bidId },
      data: { status: BidStatus.WITHDRAWN, withdrawnAt: new Date() },
    });
  }

  async counterBid(
    bidId: string,
    requesterId: string,
    requesterRole: string,
    counterAmount: number,
    counterNote?: string,
  ) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { shipment: true },
    });
    if (!bid) throw new NotFoundException('Bid not found');

    if (requesterRole === 'SHIPPER') {
      if (bid.shipment.shipperId !== requesterId) throw new ForbiddenException('Not your shipment');
      if (bid.status !== BidStatus.PENDING && bid.status !== BidStatus.COUNTERED)
        throw new BadRequestException('Bid is not in a negotiable state');
      if (bid.counterBy === 'SHIPPER')
        throw new BadRequestException('You already sent a counter — wait for the driver to respond');
    } else if (requesterRole === 'DRIVER') {
      if (bid.driverId !== requesterId) throw new ForbiddenException('Not your bid');
      if (bid.status !== BidStatus.COUNTERED || bid.counterBy !== 'SHIPPER')
        throw new BadRequestException('No pending counter offer from the shipper to respond to');
    } else {
      throw new ForbiddenException();
    }

    return this.prisma.bid.update({
      where: { id: bidId },
      data: {
        status: BidStatus.COUNTERED,
        counterAmount,
        counterNote,
        counterBy: requesterRole,
      },
      include: { driver: DRIVER_WITH_PROFILE, shipment: true },
    });
  }

  async acceptCounter(bidId: string, requesterId: string, requesterRole: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { shipment: true, driver: { select: { id: true, driverProfile: true } } },
    });
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.status !== BidStatus.COUNTERED) throw new BadRequestException('No counter offer to accept');

    // The party that did NOT send the counter is the one who can accept it
    if (requesterRole === 'DRIVER') {
      if (bid.driverId !== requesterId) throw new ForbiddenException();
      if (bid.counterBy !== 'SHIPPER') throw new BadRequestException('The counter was not sent by the shipper');
    } else if (requesterRole === 'SHIPPER') {
      if (bid.shipment.shipperId !== requesterId) throw new ForbiddenException('Not your shipment');
      if (bid.counterBy !== 'DRIVER') throw new BadRequestException('The counter was not sent by the driver');
    } else {
      throw new ForbiddenException();
    }

    if (!bid.driver.driverProfile) throw new BadRequestException('Driver has no driver profile');
    const agreedAmount = bid.counterAmount!;

    const [updatedBid, , booking] = await this.prisma.$transaction([
      this.prisma.bid.update({
        where: { id: bidId },
        data: { status: BidStatus.ACCEPTED, amount: agreedAmount, respondedAt: new Date() },
      }),
      this.prisma.bid.updateMany({
        where: { shipmentId: bid.shipmentId, id: { not: bidId }, status: BidStatus.PENDING },
        data: { status: BidStatus.REJECTED, respondedAt: new Date() },
      }),
      this.prisma.booking.create({
        data: {
          shipmentId: bid.shipmentId,
          bidId: bid.id,
          driverId: bid.driverId,
          driverProfileId: bid.driver.driverProfile.id,
          agreedAmount,
        },
      }),
      this.prisma.shipment.update({
        where: { id: bid.shipmentId },
        data: { status: 'BOOKED' },
      }),
    ]);

    return { bid: updatedBid, booking };
  }

  // ── Bid-level chat ────────────────────────────────────────────────────────

  private async assertBidParticipant(bidId: string, userId: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { shipment: true },
    });
    if (!bid) throw new NotFoundException('Bid not found');
    const isDriver  = bid.driverId === userId;
    const isShipper = bid.shipment.shipperId === userId;
    if (!isDriver && !isShipper) throw new ForbiddenException('Not a participant on this bid');
    return { bid, isDriver, isShipper };
  }

  async getBidMessages(bidId: string, userId: string) {
    await this.assertBidParticipant(bidId, userId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { bidId },
      include: { sender: BID_CHAT_SENDER },
      orderBy: { createdAt: 'asc' },
    });
    await this.prisma.chatMessage.updateMany({
      where: { bidId, readAt: null, senderId: { not: userId } },
      data: { readAt: new Date() },
    });
    return messages;
  }

  async sendBidMessage(bidId: string, senderId: string, content: string) {
    const { bid } = await this.assertBidParticipant(bidId, senderId);
    if (!['PENDING', 'COUNTERED'].includes(bid.status))
      throw new BadRequestException('Bid is no longer open for messages');
    return this.prisma.chatMessage.create({
      data: { bidId, senderId, content, messageType: 'text' },
      include: { sender: BID_CHAT_SENDER },
    });
  }

  async sendCounterOfferMessage(bidId: string, senderId: string, offerAmount: number, note?: string) {
    const { bid, isDriver, isShipper } = await this.assertBidParticipant(bidId, senderId);
    if (!['PENDING', 'COUNTERED'].includes(bid.status))
      throw new BadRequestException('Bid is no longer open for negotiation');

    // Each party can only have one pending offer at a time
    const existingPending = await this.prisma.chatMessage.findFirst({
      where: { bidId, senderId, messageType: 'counter_offer', offerStatus: 'pending' },
    });
    if (existingPending)
      throw new BadRequestException('You already have a pending counter offer in this chat');

    const content = isDriver
      ? `Driver offered $${offerAmount.toFixed(2)}${note ? ` — ${note}` : ''}`
      : `Shipper countered at $${offerAmount.toFixed(2)}${note ? ` — ${note}` : ''}`;

    // Also update the Bid.counterBy so the rest of the system stays consistent
    await this.prisma.bid.update({
      where: { id: bidId },
      data: {
        status: BidStatus.COUNTERED,
        counterAmount: offerAmount,
        counterNote: note,
        counterBy: isShipper ? 'SHIPPER' : 'DRIVER',
      },
    });

    return this.prisma.chatMessage.create({
      data: { bidId, senderId, content, messageType: 'counter_offer', offerAmount, offerStatus: 'pending' },
      include: { sender: BID_CHAT_SENDER },
    });
  }

  async respondToOfferMessage(msgId: string, responderId: string) {
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: msgId },
      include: {
        bid: {
          include: {
            shipment: true,
            driver: { include: { driverProfile: true } },
          },
        },
      },
    });
    if (!msg || msg.messageType !== 'counter_offer')
      throw new NotFoundException('Counter offer message not found');
    if (msg.offerStatus !== 'pending')
      throw new BadRequestException('This offer has already been responded to');
    if (msg.senderId === responderId)
      throw new ForbiddenException('Cannot respond to your own offer');

    const bid = msg.bid!;
    const isDriver  = bid.driverId === responderId;
    const isShipper = bid.shipment.shipperId === responderId;
    if (!isDriver && !isShipper) throw new ForbiddenException('Not a participant');

    return { msg, bid, isDriver, isShipper };
  }

  async acceptOfferMessage(msgId: string, responderId: string) {
    const { msg, bid, isDriver } = await this.respondToOfferMessage(msgId, responderId);
    const agreedAmount = msg.offerAmount!;

    if (!bid.driver.driverProfile)
      throw new BadRequestException('Driver has no driver profile');

    const [, , booking] = await this.prisma.$transaction([
      this.prisma.chatMessage.update({
        where: { id: msgId },
        data: { offerStatus: 'accepted' },
      }),
      this.prisma.chatMessage.updateMany({
        where: { bidId: bid.id, messageType: 'counter_offer', offerStatus: 'pending', id: { not: msgId } },
        data: { offerStatus: 'rejected' },
      }),
      this.prisma.booking.create({
        data: {
          shipmentId: bid.shipmentId,
          bidId: bid.id,
          driverId: bid.driverId,
          driverProfileId: bid.driver.driverProfile.id,
          agreedAmount,
        },
      }),
      this.prisma.bid.update({
        where: { id: bid.id },
        data: { status: BidStatus.ACCEPTED, amount: agreedAmount, respondedAt: new Date() },
      }),
      this.prisma.bid.updateMany({
        where: { shipmentId: bid.shipmentId, id: { not: bid.id }, status: BidStatus.PENDING },
        data: { status: BidStatus.REJECTED, respondedAt: new Date() },
      }),
      this.prisma.shipment.update({
        where: { id: bid.shipmentId },
        data: { status: ShipmentStatus.BOOKED },
      }),
    ]);

    return { booking };
  }

  async rejectOfferMessage(msgId: string, responderId: string) {
    await this.respondToOfferMessage(msgId, responderId);
    await this.prisma.chatMessage.update({
      where: { id: msgId },
      data: { offerStatus: 'rejected' },
    });
    return { rejected: true };
  }

  async rejectCounter(bidId: string, requesterId: string, requesterRole: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { shipment: true },
    });
    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.status !== BidStatus.COUNTERED) throw new BadRequestException('No counter offer to reject');

    if (requesterRole === 'DRIVER') {
      if (bid.driverId !== requesterId) throw new ForbiddenException();
      if (bid.counterBy !== 'SHIPPER') throw new BadRequestException('Counter was not sent by the shipper');
    } else if (requesterRole === 'SHIPPER') {
      if (bid.shipment.shipperId !== requesterId) throw new ForbiddenException();
      if (bid.counterBy !== 'DRIVER') throw new BadRequestException('Counter was not sent by the driver');
    } else {
      throw new ForbiddenException();
    }

    // Clear counter and return to PENDING so the original bid amount still stands
    return this.prisma.bid.update({
      where: { id: bidId },
      data: {
        status: BidStatus.PENDING,
        counterAmount: null,
        counterNote: null,
        counterBy: null,
      },
    });
  }
}
