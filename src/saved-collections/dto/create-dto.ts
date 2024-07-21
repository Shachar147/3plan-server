import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDto {

  @ApiProperty({ required: true, type: String })
  @IsNotEmpty({
    message: 'You must provide name',
  })
  name: string;

  @ApiProperty({ required: true, type: String })
  @IsNotEmpty({
    message: 'You must provide destination',
  })
  destination: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'You must provide items',
  })
  items: number[]
}