import {Coordinate} from "./create-distance.dto";

export class updateDistanceDto {

    from: Coordinate;
    to: Coordinate;
    distance: string;
    duration: string;
    origin: string;
    destination: string;
}