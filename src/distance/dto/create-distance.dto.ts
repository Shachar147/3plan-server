import {Coordinate} from "../../shared/interfaces";
import {TextValueObject, TravelMode} from "../common";

export class CreateDistanceDto {
  from: string;
  to: string;
  distance: TextValueObject;
  duration: TextValueObject;
  origin: string;
  destination: string;
  travelMode: TravelMode;
}
