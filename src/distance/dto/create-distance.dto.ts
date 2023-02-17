import { IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {Column, PrimaryGeneratedColumn} from "typeorm";

export interface Coordinate{
    lat: number;
    lng: number;
}

export class createDistanceDto {

    from: Coordinate;
    to: Coordinate;
    travel_mode: string;
    distance: string;
    duration: string;
    origin: string;
    destination: string;
}
