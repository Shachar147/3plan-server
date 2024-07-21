import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDto {

  @ApiProperty({ required: true, type: Number })
  @IsNotEmpty({
    message: 'You must provide collectionId',
  })
  collectionId: number;

  @ApiProperty({ required: true, type: Number })
  @IsNotEmpty({
    message: 'You must provide poiId',
  })
  poiId: number;
}