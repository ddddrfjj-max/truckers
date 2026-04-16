import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  private async assertParticipant(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { shipment: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const isDriver = booking.driverId === userId;
    const isShipper = booking.shipment.shipperId === userId;
    if (!isDriver && !isShipper) throw new ForbiddenException('Not a participant in this booking');
    return booking;
  }

  async getMessages(bookingId: string, userId: string) {
    await this.assertParticipant(bookingId, userId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { bookingId },
      include: { sender: { include: { profile: true } } },
      orderBy: { createdAt: 'asc' },
    });
    // Mark unread messages as read
    await this.prisma.chatMessage.updateMany({
      where: { bookingId, readAt: null, senderId: { not: userId } },
      data: { readAt: new Date() },
    });
    return messages;
  }

  async sendMessage(bookingId: string, senderId: string, content: string) {
    await this.assertParticipant(bookingId, senderId);
    return this.prisma.chatMessage.create({
      data: { bookingId, senderId, content },
      include: { sender: { include: { profile: true } } },
    });
  }

  async unreadCount(userId: string) {
    return this.prisma.chatMessage.count({
      where: { senderId: { not: userId }, readAt: null, booking: {
        OR: [{ driverId: userId }, { shipment: { shipperId: userId } }],
      }},
    });
  }
}
