import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    action: string,
    entityType: string,
    ctx: AuditContext = {},
    opts: { entityId?: string; before?: any; after?: any } = {},
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId: opts.entityId,
          before: opts.before ?? undefined,
          after: opts.after ?? undefined,
          userId: ctx.userId,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        },
      });
    } catch {
      // Never let audit failures break the main flow
    }
  }
}
