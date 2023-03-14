export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

export interface TextValueObject {
  text: string;
  value: string;
}

export interface Coordinate {
  lat: number;
  lng: number;
}
