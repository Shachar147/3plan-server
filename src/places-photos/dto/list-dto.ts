import { IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

export class ListDto {

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  place: string;
}