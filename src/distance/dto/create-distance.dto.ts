import { IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {Column, PrimaryGeneratedColumn} from "typeorm";

export class createDistanceDto {

    from_lat: string;
    from_lng: string;
    to_lat: string;
    to_lng: number;
    travel_mode: string;
    distance: string;
    duration: string;
    from: string;
    to: string;
    distance_value: string;

}
