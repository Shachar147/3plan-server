import { IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Column, PrimaryGeneratedColumn } from "typeorm";

export interface Coordinate {
  lat: number;
  lng: number;
}

export class CreateDistanceDto {
  from: Coordinate;
  to: Coordinate;
  distance: string;
  duration: string;
  origin: string;
  destination: string;
}
