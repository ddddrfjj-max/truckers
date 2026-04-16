import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, ShipmentStatus } from '@prisma/client';
import { SHIPPER_WITH_PROFILE, DRIVER_WITH_PROFILE } from '../common/prisma-selects';

const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  CONFIRMED: [BookingStatus.DRIVER_EN_ROUTE, BookingStatus.CANCELLED],
  DRIVER_EN_ROUTE: [BookingStatus.IN_TRANSIT, BookingStatus.CANCELLED],
  IN_TRANSIT: [BookingStatus.DELIVERED, BookingStatus.CANCELLED],
  DELIVERED: [BookingStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        shipment: { include: { shipper: SHIPPER_WITH_PROFILE } },
        driver: DRIVER_WITH_PROFILE,
        driverProfile: true,
        bid: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async getDriverBookings(driverId: string) {
    return this.prisma.booking.findMany({
      where: { driverId },
      include: {
        shipment: { include: { shipper: SHIPPER_WITH_PROFILE } },
        driverProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getShipperBookings(shipperId: string) {
    return this.prisma.booking.findMany({
      where: { shipment: { shipperId } },
      include: {
        shipment: true,
        driver: DRIVER_WITH_PROFILE,
        driverProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    bookingId: string,
    newStatus: BookingStatus,
    userId: string,
    role: string,
    notes?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { shipment: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Permission check
    if (role === 'DRIVER' && booking.driverId !== userId)
      throw new ForbiddenException();
    if (role === 'SHIPPER' && booking.shipment.shipperId !== userId)
      throw new ForbiddenException();

    const allowed = STATUS_TRANSITIONS[booking.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${newStatus}`,
      );
    }

    // Only the driver can cancel once the route has started
    if (
      newStatus === BookingStatus.CANCELLED &&
      (booking.status === BookingStatus.DRIVER_EN_ROUTE ||
        booking.status === BookingStatus.IN_TRANSIT) &&
      role !== 'DRIVER' &&
      role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'Only the driver can cancel after the route has started. Please contact the driver to arrange cancellation.',
      );
    }

    const now = new Date();
    const timestamps: any = {};
    if (newStatus === BookingStatus.DRIVER_EN_ROUTE) timestamps.pickupConfirmedAt = now;
    if (newStatus === BookingStatus.IN_TRANSIT) {
      timestamps.inTransitAt = now;
      await this.prisma.shipment.update({
        where: { id: booking.shipmentId },
        data: { status: ShipmentStatus.IN_TRANSIT },
      });
    }
    if (newStatus === BookingStatus.DELIVERED) {
      timestamps.deliveredAt = now;
      await this.prisma.shipment.update({
        where: { id: booking.shipmentId },
        data: { status: ShipmentStatus.DELIVERED },
      });
    }
    if (newStatus === BookingStatus.COMPLETED) timestamps.completedAt = now;
    if (newStatus === BookingStatus.CANCELLED) {
      timestamps.cancelledAt = now;
      timestamps.cancellationReason = notes;
      await this.prisma.shipment.update({
        where: { id: booking.shipmentId },
        data: { status: ShipmentStatus.CANCELLED },
      });
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        trackingNotes: notes,
        ...timestamps,
      },
      include: {
        shipment: true,
        driver: DRIVER_WITH_PROFILE,
      },
    });
  }

  async getDriverStats(driverId: string) {
    const [total, active, completed, cancelled] = await Promise.all([
      this.prisma.booking.count({ where: { driverId } }),
      this.prisma.booking.count({
        where: {
          driverId,
          status: { in: ['CONFIRMED', 'DRIVER_EN_ROUTE', 'IN_TRANSIT'] },
        },
      }),
      this.prisma.booking.count({ where: { driverId, status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { driverId, status: 'CANCELLED' } }),
    ]);
    return { total, active, completed, cancelled };
  }
}
