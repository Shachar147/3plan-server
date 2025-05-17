import {ApiProperty} from "@nestjs/swagger";
import {IsString} from "class-validator";

export class SaveAsTemplateDto {
    @ApiProperty({ required: true })
    @IsString()
    tripName: string;
} 