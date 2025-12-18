import {
    IsNumber, IsOptional, IsString, IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePackingItemDto {
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    title: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    icon: string;

    @IsNumber()
    @ApiProperty({ required: false, default: null })
    @IsOptional()
    categoryId: number;

    @IsBoolean()
    @ApiProperty({ required: false })
    @IsOptional()
    isPacked: boolean;

    @IsNumber()
    @ApiProperty({ required: false })
    @IsOptional()
    order: number;
}

