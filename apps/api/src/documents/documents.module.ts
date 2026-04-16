import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import * as fs from 'fs';

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
              cb(null, `${uuidv4()}${extname(file.originalname)}`);
            },
          }),
          limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
          fileFilter: (req, file, cb) => {
            const allowed = /pdf|jpg|jpeg|png|webp/;
            const ext = extname(file.originalname).toLowerCase();
            if (allowed.test(ext)) cb(null, true);
            else cb(new Error('Only PDF and image files allowed'), false);
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
