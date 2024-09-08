import { IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDto {

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  place: string;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  photo: string;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  other_photos: string;
}