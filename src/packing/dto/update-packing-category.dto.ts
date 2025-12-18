import {
    IsNumber, IsOptional, IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePackingCategoryDto {
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    icon: string;

    @IsNumber()
    @ApiProperty({ required: false })
    @IsOptional()
    order: number;
}

