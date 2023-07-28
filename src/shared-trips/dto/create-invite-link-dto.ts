import {
  IsBoolean,
  IsNotEmpty, IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInviteLinkDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: tripName',
  })
  @IsString()
  tripName: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  canRead: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  canWrite: boolean;
}
