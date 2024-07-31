import { IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDto {

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  collectionId: number;

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  poiId: number;
}