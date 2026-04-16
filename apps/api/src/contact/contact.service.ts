import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
    subject: string;
    message: string;
  }) {
    return this.prisma.contactMessage.create({ data });
  }

  async getAll(query: { unreadOnly?: boolean; page?: number; limit?: number }) {
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

  async markRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
  }

  async unreadCount() {
    return this.prisma.contactMessage.count({ where: { read: false } });
  }
}
