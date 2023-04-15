import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty, IsOptional} from "class-validator";

export class ReportEventDto {
    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: action',
    })
    action: string;

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: context',
    })
    context: string;

    @ApiProperty({ required: false })
    @IsOptional()
    content: object;

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: isMobile',
    })
    isMobile: boolean;
}