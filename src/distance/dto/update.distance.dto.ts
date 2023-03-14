import {Coordinate} from "../common";

export class updateDistanceDto {
  from: Coordinate;
  to: Coordinate;
  distance: string;
  duration: string;
  origin: string;
  destination: string;
}
