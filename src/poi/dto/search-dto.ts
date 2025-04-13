import {
    IsNotEmpty, IsNumber, IsOptional,
    IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchDto {
    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: destination',
    })
    @IsString()
    destination: string;

    @IsOptional()
    page?: number;

    @IsOptional()
    isSystemRecommendation?: number;
}
