import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, DocumentStatus } from '@prisma/client';
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

  async updateUserStatus(userId: string, status: UserStatus, adminNotes?: string) {
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
