import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListTripsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search: string;
  //
  // @ApiProperty({ required: false })
  // @IsOptional()
  // name: string;
  //
  // @ApiProperty({ required: false })
  // @IsOptional()
  // conference: TeamConference;
  //
  // @ApiProperty({ required: false })
  // @IsOptional()
  // division: TeamDivision;
  //
  // @ApiProperty({ required: false })
  // @IsOptional()
  // id: number;
  //
  // @ApiProperty({ required: false })
  // @IsOptional()
  // _2k_rating: number;
}
