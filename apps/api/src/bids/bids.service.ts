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
    if (bid.status !== BidStatus.PENDING)
      throw new BadRequestException('Bid cannot be withdrawn');

    return this.prisma.bid.update({
      where: { id: bidId },
      data: { status: BidStatus.WITHDRAWN, withdrawnAt: new Date() },
    });
  }
}
