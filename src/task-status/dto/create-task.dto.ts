import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty, IsOptional} from "class-validator";
import {Trip} from "../../trip/trip.entity";
import {TaskStatusType} from "../task-status.entity";

export class CreateTaskDto {
    @ApiProperty({ required: false })
    taskInfo: object;

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: status',
    })
    status: TaskStatusType;

    @ApiProperty({ required: false })
    detailedStatus: object;

    @ApiProperty({ required: false })
    progress: number

    @ApiProperty({ required: false })
    lastUpdateAt?: Date;

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: trip',
    })
    relatedTrip: Trip;
}