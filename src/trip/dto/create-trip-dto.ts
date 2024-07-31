import {
  IsArray,
  IsNotEmpty, IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: name',
  })
  // @Length(3, 255)
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: dateRange',
  })
  dateRange: "jsonb";

  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: categories',
  })
  categories: "jsonb";

  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: allEvents',
  })
  allEvents: "jsonb";

  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: calendarEvents',
  })
  calendarEvents: "jsonb";

  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: sidebarEvents',
  })
  sidebarEvents: "jsonb";

  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: calendarLocale',
  })
  @IsString()
  calendarLocale: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty({
    message: 'missing: destinations',
  })
  destinations: "jsonb";
}
