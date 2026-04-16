import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { DocumentsModule } from '../documents/documents.module';
import { ContactModule } from '../contact/contact.module';

@Module({
  imports: [DocumentsModule, ContactModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
