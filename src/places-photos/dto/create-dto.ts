import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDto {

  @ApiProperty({ required: true, type: String })
  @IsNotEmpty({
    message: 'You must provide place',
  })
  place: string;

  @ApiProperty({ required: true, type: String })
  @IsNotEmpty({
    message: 'You must provide photo',
  })
  photo: string;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  other_photos: string;
}