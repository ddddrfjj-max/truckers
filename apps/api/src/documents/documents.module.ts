import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import * as fs from 'fs';

const ALLOWED_EXTENSIONS = /\.(pdf|jpg|jpeg|png|webp)$/i;
const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const uploadDir = config.get('UPLOAD_DIR', './uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        return {
          storage: diskStorage({
            destination: uploadDir,
            filename: (req, file, cb) => {
              cb(null, `${uuidv4()}${extname(file.originalname).toLowerCase()}`);
            },
          }),
          limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
          fileFilter: (req, file, cb) => {
            const ext = extname(file.originalname).toLowerCase();
            const mimeOk = ALLOWED_MIMETYPES.has(file.mimetype);
            const extOk = ALLOWED_EXTENSIONS.test(ext);
            if (mimeOk && extOk) {
              cb(null, true);
            } else {
              cb(new Error('Only PDF and image files (JPG, PNG, WEBP) are allowed'), false);
            }
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
