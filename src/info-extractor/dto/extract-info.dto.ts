import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";

export class ExtractInfoDto {
    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: moreInfo',
    })
    moreInfo: string;
}