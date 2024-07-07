import {
    IsBoolean,
    IsNotEmpty,
    IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {IsOptional} from "class-validator";

export enum TravelingWith {
    SPOUSE = 'SPOUSE'
}

export class CreateTripDto {
    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: destination',
    })
    // @Length(3, 255)
    @IsString()
    destination: string;

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: travelingWith',
    })
    travelingWith: TravelingWith;

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: numberOfDays',
    })
    numberOfDays: number;

    // optional:
    @IsOptional()
    @ApiProperty({ required: false })
    includeChildren?: boolean;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({ required: false })
    includePets?: boolean;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({ required: false })
    interests?: string[]

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    currency?: 'USD' | 'ILS'
}
