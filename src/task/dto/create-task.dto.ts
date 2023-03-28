import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";
import {Trip} from "../../trip/trip.entity";
import {TaskStatus, TaskType} from "../common";
import {CalcDistancesDto} from "../../distance/dto/calc-distances.dto";

export class CreateTaskDto {
    @ApiProperty({ required: false })
    taskInfo: object;

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: status',
    })
    status: TaskStatus;

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


    static build(params: CalcDistancesDto, trip: Trip): CreateTaskDto {
        return {
            taskInfo: {
                type: TaskType.calcDistance,
                params,
            },
            status: TaskStatus.inProgress,
            detailedStatus: {},
            progress: 0,
            relatedTrip: trip,
        } as CreateTaskDto;
    }
}