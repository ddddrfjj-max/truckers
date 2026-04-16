import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id?: string) {
    if (id) {
      return this.prisma.notification.updateMany({
        where: { id, userId },
        data: { read: true },
      });
    }
    return this.prisma.notification.updateMany({
      where: { userId },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async create(userId: string, title: string, body: string, type: string, data?: any) {
    return this.prisma.notification.create({
      data: { userId, title, body, type, data },
    });
  }
}
