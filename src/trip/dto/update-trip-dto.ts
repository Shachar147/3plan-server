import {
  IsArray,
  IsBoolean,
  IsNotEmpty, IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTripDto {
  @ApiProperty({ required: true })
  @IsOptional()
  @IsNotEmpty({
    message: 'missing: name',
  })
  // @Length(3, 255)
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsNotEmpty({
    message: 'missing: dateRange',
  })
  dateRange: "jsonb";

  @ApiProperty({ required: true })
  @IsOptional()
  @IsNotEmpty({
    message: 'missing: categories',
  })
  categories: "jsonb";

  @ApiProperty({ required: true })
  @IsOptional()
  @IsNotEmpty({
    message: 'missing: allEvents',
  })
  allEvents: "jsonb";

  @ApiProperty({ required: true })
  @IsOptional()
  @IsNotEmpty({
    message: 'missing: calendarEvents',
  })
  calendarEvents: "jsonb";

  @ApiProperty({ required: true })
  @IsOptional()
  @IsNotEmpty({
    message: 'missing: sidebarEvents',
  })
  sidebarEvents: "jsonb";

  @ApiProperty({ required: true })
  @IsOptional()
  @IsNotEmpty({
    message: 'missing: calendarLocale',
  })
  @IsString()
  calendarLocale: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isLocked: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isHidden: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty({
    message: 'missing: destinations',
  })
  destinations: "jsonb";
}
