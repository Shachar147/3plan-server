import {
  IsNotEmpty, IsNumber, IsOptional, IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePackingCategoryDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: tripId',
  })
  tripId: number;

  @IsString()
  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: name',
  })
  name: string;

  @IsString()
  @ApiProperty({ required: false, default: null })
  @IsOptional()
  icon: string;

  @IsNumber()
  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  order: number;
}

