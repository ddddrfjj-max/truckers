import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, driverProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: dto,
      create: { userId, firstName: '', lastName: '', ...dto },
    });
    return profile;
  }

  async getDriverProfile(userId: string) {
    const dp = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (!dp) throw new NotFoundException('Driver profile not found');
    return dp;
  }

  async updateDriverProfile(userId: string, data: any) {
    return this.prisma.driverProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async getPublicDriverProfile(driverId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: driverId },
      include: {
        profile: true,
        driverProfile: true,
        documents: {
          where: { status: 'APPROVED' },
          select: { id: true, type: true, status: true, createdAt: true },
        },
      },
    });
    if (!user || user.role !== 'DRIVER') throw new NotFoundException('Driver not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
