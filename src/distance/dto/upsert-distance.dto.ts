import {TextValueObject, TravelMode} from "../common";

export class UpsertDistanceDto {
  from: string;
  to: string;
  distance: TextValueObject;
  duration: TextValueObject;
  origin: string;
  destination: string;
  travelMode: TravelMode;
}
