import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { CargoType, VehicleType } from '@prisma/client';

export class CreateShipmentDto {
  @ApiProperty({ example: 'Furniture delivery - Chicago to Dallas' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CargoType, default: CargoType.GENERAL })
  @IsEnum(CargoType)
  cargoType: CargoType;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0.1)
  weightKg: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() lengthCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() widthCm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() heightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialHandling?: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  pickupAddress: string;

  @ApiProperty({ example: 'Chicago' })
  @IsString()
  pickupCity: string;

  @ApiProperty({ example: 'IL' })
  @IsString()
  pickupState: string;

  @ApiPropertyOptional() @IsOptional() @IsString() pickupZip?: string;

  @ApiProperty({ example: '2024-06-15T10:00:00Z' })
  @IsDateString()
  pickupDate: string;

  @ApiProperty({ example: '456 Oak Ave' })
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ example: 'Dallas' })
  @IsString()
  deliveryCity: string;

  @ApiProperty({ example: 'TX' })
  @IsString()
  deliveryState: string;

  @ApiPropertyOptional() @IsOptional() @IsString() deliveryZip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  budgetMin?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  budgetMax?: number;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleRequired?: VehicleType;
}
