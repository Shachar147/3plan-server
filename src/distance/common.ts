export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

export interface TextValueObject {
  text: string;
  value: string;
}

export interface CalculateDistancesResult {
  errors: any[];
  results: DistanceResult[];
  totals?: any;
  routesToCalculate?: string[];
  numOfGoogleCalls: number;
}

export interface DistanceResult {
  origin: string;
  destination: string;
  duration: TextValueObject;
  distance: TextValueObject;
  travelMode: TravelMode;
  from: string;
  to: string;
}

export interface DistanceDiff {
  what: string;
  was: string | object;
  now: string | object
}