import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateContactDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(50) firstName: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(50) lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) company?: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(150) subject: string;
  @ApiProperty() @IsString() @MinLength(10) @MaxLength(2000) message: string;
}

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Post()
  @Throttle({ contact: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a contact form message' })
  submit(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }
}
