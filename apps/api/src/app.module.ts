import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { BidsModule } from './bids/bids.module';
import { BookingsModule } from './bookings/bookings.module';
import { DocumentsModule } from './documents/documents.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    ShipmentsModule,
    BidsModule,
    BookingsModule,
    DocumentsModule,
    AdminModule,
    NotificationsModule,
    ContactModule,
  ],
})
export class AppModule {}
