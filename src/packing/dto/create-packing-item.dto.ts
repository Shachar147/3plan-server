import {
  IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePackingItemDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: tripId',
  })
  tripId: number;

  @IsString()
  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: title',
  })
  title: string;

  @IsString()
  @ApiProperty({ required: false, default: null })
  @IsOptional()
  icon: string;

  @IsNumber()
  @ApiProperty({ required: false, default: null, nullable: true })
  @IsOptional()
  categoryId?: number | null;

  @IsBoolean()
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  isPacked: boolean;

  @IsNumber()
  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  order: number;
}

