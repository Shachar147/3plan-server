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
    @ApiProperty({ required: false, default: 1 })
    @IsNumber()
    page?: number;
}
