import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, DocumentStatus, ShipmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SHIPPER_WITH_PROFILE, DRIVER_WITH_PROFILE } from '../common/prisma-selects';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalShippers,
      totalDrivers,
      totalShipments,
      openShipments,
      activeBookings,
      completedBookings,
      pendingDocuments,
      unreadMessages,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'SHIPPER' } }),
      this.prisma.user.count({ where: { role: 'DRIVER' } }),
      this.prisma.shipment.count(),
      this.prisma.shipment.count({ where: { status: { in: ['OPEN', 'BIDDING'] } } }),
      this.prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'DRIVER_EN_ROUTE', 'IN_TRANSIT'] } } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.document.count({ where: { status: 'PENDING' } }),
      this.prisma.contactMessage.count({ where: { read: false } }),
    ]);

    return {
      totalUsers,
      totalShippers,
      totalDrivers,
      totalShipments,
      openShipments,
      activeBookings,
      completedBookings,
      pendingDocuments,
      unreadMessages,
    };
  }

  async getUsers(query: { page?: number; limit?: number; role?: string; status?: string; search?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const { role, status, search } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
          driverProfile: true,
          _count: { select: { shipments: true, bids: true, bookingsAsDriver: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async updateUserStatus(userId: string, status: UserStatus, callerRole: string, adminNotes?: string) {
    const target = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    // Nobody can touch a DEVELOPER account
    if (target?.role === 'DEVELOPER') throw new ForbiddenException('Developer accounts cannot be modified');
    // Only DEVELOPER can suspend/activate ADMIN accounts
    if (target?.role === 'ADMIN' && callerRole !== 'DEVELOPER') {
      throw new ForbiddenException('Only a developer can modify admin accounts');
    }
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });
    return result;
  }

  async updateShipmentStatus(shipmentId: string, status: ShipmentStatus) {
    return this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status },
      include: {
        shipper: SHIPPER_WITH_PROFILE,
        booking: true,
        _count: { select: { bids: true } },
      },
    });
  }

  async getAllShipments(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          shipper: SHIPPER_WITH_PROFILE,
          _count: { select: { bids: true } },
          booking: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shipment.count(),
    ]);
    return { data, total, page, limit };
  }

  async getAllBookings(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          shipment: { include: { shipper: SHIPPER_WITH_PROFILE } },
          driver: DRIVER_WITH_PROFILE,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.booking.count(),
    ]);
    return { data, total, page, limit };
  }

  async getPendingDocuments() {
    return this.prisma.document.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            profile: true,
            driverProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewDocument(docId: string, adminId: string, status: DocumentStatus, notes?: string) {
    return this.prisma.document.update({
      where: { id: docId },
      data: {
        status,
        notes,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            profile: true,
          },
        },
      },
    });
  }

  async getDriversForVerification(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const { verificationStatus } = query;
    const where: any = { role: 'DRIVER' };
    if (verificationStatus) {
      where.driverProfile = { verificationStatus };
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
          driverProfile: true,
          documents: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async updateDriverVerification(driverId: string, adminId: string, status: string, notes?: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId: driverId } });
    if (!profile) throw new Error('Driver profile not found');

    return this.prisma.driverProfile.update({
      where: { userId: driverId },
      data: {
        verificationStatus: status as any,
        verificationNotes: notes,
        verifiedAt: status === 'APPROVED' ? new Date() : undefined,
        verifiedBy: status === 'APPROVED' ? adminId : undefined,
      },
    });
  }

  async getContactMessages(query: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.unreadOnly) where.read = false;

    const [data, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async markContactRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
  }

  async getContactUnreadCount() {
    return this.prisma.contactMessage.count({ where: { read: false } });
  }

  async deleteUser(userId: string, callerRole: string) {
    if (callerRole !== 'DEVELOPER') throw new ForbiddenException('Only developers can delete accounts');
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });
    if (!target) throw new ForbiddenException('User not found');
    if (target.role === 'DEVELOPER') throw new ForbiddenException('Developer accounts cannot be deleted');

    // Must delete related records in dependency order — Shipment/Bid/Booking/ChatMessage
    // don't have cascade deletes on the User FK, so Postgres would reject a bare user.delete.
    await this.prisma.$transaction(async (tx) => {
      // Nullify nullable audit-log references
      await tx.auditLog.updateMany({ where: { userId }, data: { userId: null } });

      // ── Shipper-side cleanup ──────────────────────────────────────────────
      const shipmentIds = (
        await tx.shipment.findMany({ where: { shipperId: userId }, select: { id: true } })
      ).map((s) => s.id);

      if (shipmentIds.length) {
        const bookingIds = (
          await tx.booking.findMany({
            where: { shipmentId: { in: shipmentIds } },
            select: { id: true },
          })
        ).map((b) => b.id);
        if (bookingIds.length) {
          await tx.chatMessage.deleteMany({ where: { bookingId: { in: bookingIds } } });
          await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
        }
        // ShipmentImage and Bid cascade from Shipment
        await tx.shipment.deleteMany({ where: { id: { in: shipmentIds } } });
      }

      // ── Driver-side cleanup ───────────────────────────────────────────────
      const driverBookingIds = (
        await tx.booking.findMany({ where: { driverId: userId }, select: { id: true } })
      ).map((b) => b.id);
      if (driverBookingIds.length) {
        await tx.chatMessage.deleteMany({ where: { bookingId: { in: driverBookingIds } } });
        await tx.booking.deleteMany({ where: { id: { in: driverBookingIds } } });
      }
      // Bids on other shippers' shipments (booking already removed above)
      await tx.bid.deleteMany({ where: { driverId: userId } });

      // Any remaining chat messages the user sent (defensive)
      await tx.chatMessage.deleteMany({ where: { senderId: userId } });

      // Delete user — Profile, DriverProfile, Document, Notification cascade
      await tx.user.delete({ where: { id: userId } });
    });

    return { id: userId, email: target.email, deleted: true };
  }

  async setUserRole(userId: string, role: string, callerRole: string) {
    if (callerRole !== 'DEVELOPER') throw new ForbiddenException('Only developers can change roles');
    const target = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target) throw new ForbiddenException('User not found');
    if (target.role === 'DEVELOPER') throw new ForbiddenException('Developer accounts cannot be modified');
    if (role === 'DEVELOPER') throw new ForbiddenException('Cannot assign developer role');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, email: true, role: true, status: true, profile: true },
    });
  }

  async createAdminAccount(
    data: { email: string; password: string; firstName: string; lastName: string },
    callerRole: string,
  ) {
    if (callerRole !== 'DEVELOPER') throw new ForbiddenException('Only developers can create admin accounts');
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'ADMIN',
        emailVerified: true,
        profile: { create: { firstName: data.firstName, lastName: data.lastName } },
      },
      select: { id: true, email: true, role: true, status: true, profile: true },
    });
  }

  async getAuditLogs(query: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    userId?: string;
    search?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.entityType) where.entityType = query.entityType;
    if (query.userId) where.userId = query.userId;
    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { entityType: { contains: query.search, mode: 'insensitive' } },
        { entityId: { contains: query.search, mode: 'insensitive' } },
        { ip: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
