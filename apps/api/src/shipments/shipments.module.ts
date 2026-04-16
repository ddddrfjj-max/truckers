import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
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
            const allowed = /jpg|jpeg|png|webp|gif/;
            if (allowed.test(extname(file.originalname).toLowerCase())) cb(null, true);
            else cb(new Error('Only image files allowed (jpg, png, webp, gif)'), false);
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [ShipmentsService],
  controllers: [ShipmentsController],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
