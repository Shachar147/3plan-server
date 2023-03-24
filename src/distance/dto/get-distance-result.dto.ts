import {Coordinate} from "../../shared/interfaces";
import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";

export class GetDistanceResultDto {
    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: from',
    })
    from: Coordinate[];

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: to',
    })
    to: Coordinate[];

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: tripName',
    })
    tripName: string;
}