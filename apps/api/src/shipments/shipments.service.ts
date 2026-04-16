import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ShipmentStatus, Role } from '@prisma/client';
import { SHIPPER_WITH_PROFILE, DRIVER_WITH_PROFILE } from '../common/prisma-selects';
import axios from 'axios';

async function geocodeCity(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${city}, ${state}, USA`);
    const { data } = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'FreightFlow/1.0' }, timeout: 5000 },
    );
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* geocoding is best-effort */ }
  return null;
}

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  async create(shipperId: string, dto: CreateShipmentDto) {
    const [pickupCoords, deliveryCoords] = await Promise.all([
      geocodeCity(dto.pickupCity, dto.pickupState),
      geocodeCity(dto.deliveryCity, dto.deliveryState),
    ]);

    return this.prisma.shipment.create({
      data: {
        shipperId,
        ...dto,
        pickupDate: new Date(dto.pickupDate as any),
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate as any) : undefined,
        status: ShipmentStatus.OPEN,
        publishedAt: new Date(),
        pickupLat: pickupCoords?.lat,
        pickupLng: pickupCoords?.lng,
        deliveryLat: deliveryCoords?.lat,
        deliveryLng: deliveryCoords?.lng,
      },
      include: { shipper: SHIPPER_WITH_PROFILE },
    });
  }

  async findAll(query: {
    status?: ShipmentStatus;
    cargoType?: string;
    pickupCity?: string;
    deliveryCity?: string;
    shipperId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const { search, status, cargoType, pickupCity, deliveryCity, shipperId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (shipperId) where.shipperId = shipperId;
    if (status) where.status = status;
    if (cargoType) where.cargoType = cargoType;
    if (pickupCity) where.pickupCity = { contains: pickupCity, mode: 'insensitive' };
    if (deliveryCity) where.deliveryCity = { contains: deliveryCity, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { pickupCity: { contains: search, mode: 'insensitive' } },
        { deliveryCity: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shipper: SHIPPER_WITH_PROFILE,
          _count: { select: { bids: true } },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAvailableForDrivers(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const { search, pickupCity, deliveryCity } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      status: { in: [ShipmentStatus.OPEN, ShipmentStatus.BIDDING] },
    };

    if (pickupCity) where.pickupCity = { contains: pickupCity, mode: 'insensitive' };
    if (deliveryCity) where.deliveryCity = { contains: deliveryCity, mode: 'insensitive' };
    if (search) {
      where.AND = [
        { status: where.status },
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { pickupCity: { contains: search, mode: 'insensitive' } },
            { deliveryCity: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
      delete where.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shipper: SHIPPER_WITH_PROFILE,
          _count: { select: { bids: true } },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByShipper(shipperId: string, query: any) {
    return this.findAll({ ...query, shipperId });
  }

  async findOne(id: string, userId?: string, role?: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        shipper: SHIPPER_WITH_PROFILE,
        bids: {
          include: {
            driver: DRIVER_WITH_PROFILE,
          },
          orderBy: { createdAt: 'desc' },
        },
        booking: {
          include: {
            driver: DRIVER_WITH_PROFILE,
            driverProfile: true,
          },
        },
        images: true,
        _count: { select: { bids: true } },
      },
    });

    if (!shipment) throw new NotFoundException('Shipment not found');

    // Increment view count
    await this.prisma.shipment.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Hide bids from non-owners: drivers only see their own bid
    if (role === Role.DRIVER && userId) {
      (shipment as any).bids = (shipment as any).bids.filter(
        (b: any) => b.driverId === userId,
      );
    }

    return shipment;
  }

  async update(id: string, shipperId: string, data: any) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (shipment.shipperId !== shipperId)
      throw new ForbiddenException('Not your shipment');
    if (
      shipment.status === ShipmentStatus.BOOKED ||
      shipment.status === ShipmentStatus.IN_TRANSIT
    ) {
      throw new BadRequestException('Cannot edit a booked or in-transit shipment');
    }

    return this.prisma.shipment.update({ where: { id }, data });
  }

  async cancel(id: string, userId: string, role: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    if (role !== Role.ADMIN && shipment.shipperId !== userId)
      throw new ForbiddenException('Not authorized');

    if (
      shipment.status === ShipmentStatus.IN_TRANSIT ||
      shipment.status === ShipmentStatus.DELIVERED
    ) {
      throw new BadRequestException('Cannot cancel an in-transit or delivered shipment');
    }

    // Block shipper from cancelling once driver is en route
    if (role !== Role.ADMIN) {
      const activeBooking = await this.prisma.booking.findFirst({
        where: {
          shipmentId: id,
          status: { in: ['DRIVER_EN_ROUTE', 'IN_TRANSIT'] as any },
        },
      });
      if (activeBooking) {
        throw new BadRequestException(
          'Cannot cancel once the driver is en route. Please contact the driver to arrange cancellation.',
        );
      }
    }

    // Reject all pending bids
    await this.prisma.bid.updateMany({
      where: { shipmentId: id, status: 'PENDING' },
      data: { status: 'REJECTED' },
    });

    return this.prisma.shipment.update({
      where: { id },
      data: { status: ShipmentStatus.CANCELLED, cancelledAt: new Date() },
    });
  }

  async getShipperStats(shipperId: string) {
    const [total, open, booked, delivered, cancelled] = await Promise.all([
      this.prisma.shipment.count({ where: { shipperId } }),
      this.prisma.shipment.count({ where: { shipperId, status: 'OPEN' } }),
      this.prisma.shipment.count({ where: { shipperId, status: 'BOOKED' } }),
      this.prisma.shipment.count({ where: { shipperId, status: 'DELIVERED' } }),
      this.prisma.shipment.count({ where: { shipperId, status: 'CANCELLED' } }),
    ]);
    return { total, open, booked, delivered, cancelled };
  }

  async addImage(shipmentId: string, shipperId: string, file: Express.Multer.File) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { _count: { select: { images: true } } },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (shipment.shipperId !== shipperId) throw new ForbiddenException('Not your shipment');
    if ((shipment as any)._count.images >= 8) throw new BadRequestException('Maximum 8 images per shipment');

    const url = `/uploads/${file.filename}`;
    return this.prisma.shipmentImage.create({
      data: { shipmentId, url },
    });
  }

  async deleteImage(imageId: string, shipperId: string) {
    const image = await this.prisma.shipmentImage.findUnique({
      where: { id: imageId },
      include: { shipment: true },
    });
    if (!image) throw new NotFoundException('Image not found');
    if (image.shipment.shipperId !== shipperId) throw new ForbiddenException('Not your shipment');

    // Delete file from disk
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'uploads', path.basename(image.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return this.prisma.shipmentImage.delete({ where: { id: imageId } });
  }
}
