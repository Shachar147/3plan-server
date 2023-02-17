import { IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {Column, PrimaryGeneratedColumn} from "typeorm";

export interface Coordinate{
    lat: number;
    lng: number;
}
export class GetDistanceResultDto {

    from: Coordinate;
    to: Coordinate;
}