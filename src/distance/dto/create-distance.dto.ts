import {Coordinate} from "../../shared/interfaces";
import {TextValueObject, TravelMode} from "../common";

export class CreateDistanceDto {
  from: Coordinate;
  to: Coordinate;
  distance: TextValueObject;
  duration: TextValueObject;
  origin: string;
  destination: string;
  travelMode: TravelMode;
}
