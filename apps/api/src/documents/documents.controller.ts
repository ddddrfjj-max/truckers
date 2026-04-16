import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DocumentType, DocumentStatus, Role } from '@prisma/client';

@ApiTags('documents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @Roles(Role.DRIVER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a verification document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: Object.values(DocumentType) },
      },
    },
  })
  upload(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: DocumentType,
  ) {
    return this.documentsService.uploadDocument(userId, file, type);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my documents' })
  getMyDocs(@CurrentUser('sub') userId: string) {
    return this.documentsService.getMyDocuments(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  deleteDoc(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.documentsService.deleteDocument(id, userId, role);
  }
}
