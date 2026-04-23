import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType, DocumentStatus, DriverVerificationStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Magic-byte signatures for allowed file types
const MAGIC_BYTES: Array<{ bytes: number[]; offset: number }> = [
  { bytes: [0xff, 0xd8, 0xff], offset: 0 },              // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a], offset: 0 }, // PNG
  { bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 },         // PDF (%PDF)
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },         // WEBP (RIFF header)
];

function hasValidMagicBytes(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    return MAGIC_BYTES.some(({ bytes, offset }) =>
      bytes.every((b, i) => buf[offset + i] === b),
    );
  } catch {
    return false;
  }
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    type: DocumentType,
  ) {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, file.filename);

    if (!hasValidMagicBytes(filePath)) {
      fs.unlinkSync(filePath);
      throw new BadRequestException('File content does not match its declared type');
    }

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

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, path.basename(doc.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return this.prisma.document.delete({ where: { id: docId } });
  }
}
