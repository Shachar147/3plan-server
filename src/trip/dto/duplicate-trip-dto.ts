import {ApiProperty} from "@nestjs/swagger";
import {IsString} from "class-validator";

export class DuplicateTripDto {
    @ApiProperty({ required: true })
    @IsString()
    name: string;

    @ApiProperty({ required: true })
    @IsString()
    newName: string;
}