import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType, DocumentStatus, DriverVerificationStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    type: DocumentType,
  ) {
    const url = `/uploads/${file.filename}`;
    return this.prisma.document.create({
      data: {
        userId,
        type,
        url,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        status: DocumentStatus.PENDING,
      },
    });
  }

  async getMyDocuments(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPending() {
    return this.prisma.document.findMany({
      where: { status: DocumentStatus.PENDING },
      include: {
        user: { include: { profile: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewDocument(
    docId: string,
    reviewerId: string,
    status: DocumentStatus,
    notes?: string,
  ) {
    const doc = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');

    const updated = await this.prisma.document.update({
      where: { id: docId },
      data: {
        status,
        notes,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    // Auto-update driver verification status based on documents
    await this.updateDriverVerificationStatus(doc.userId);

    return updated;
  }

  private async updateDriverVerificationStatus(userId: string) {
    const docs = await this.prisma.document.findMany({ where: { userId } });
    const requiredTypes = [
      DocumentType.DRIVERS_LICENSE_FRONT,
      DocumentType.VEHICLE_REGISTRATION,
      DocumentType.INSURANCE_CERTIFICATE,
    ];

    const hasAllRequired = requiredTypes.every((t) =>
      docs.some((d) => d.type === t && d.status === DocumentStatus.APPROVED),
    );

    const hasRejected = docs.some((d) => d.status === DocumentStatus.REJECTED);
    const allPending = docs.every((d) => d.status === DocumentStatus.PENDING);

    let verificationStatus: DriverVerificationStatus;
    if (hasAllRequired) verificationStatus = DriverVerificationStatus.APPROVED;
    else if (hasRejected) verificationStatus = DriverVerificationStatus.REJECTED;
    else if (!allPending) verificationStatus = DriverVerificationStatus.UNDER_REVIEW;
    else verificationStatus = DriverVerificationStatus.PENDING;

    await this.prisma.driverProfile.updateMany({
      where: { userId },
      data: {
        verificationStatus,
        ...(verificationStatus === DriverVerificationStatus.APPROVED
          ? { verifiedAt: new Date() }
          : {}),
      },
    });
  }

  async deleteDocument(docId: string, userId: string, role: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (role !== 'ADMIN' && doc.userId !== userId) throw new ForbiddenException();

    // Delete physical file
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, path.basename(doc.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return this.prisma.document.delete({ where: { id: docId } });
  }
}
