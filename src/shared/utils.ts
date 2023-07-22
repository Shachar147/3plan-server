import {Coordinate} from "./interfaces";

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function formatDate(dt) {
  return dt.toISOString().slice(0, 10).split('-').reverse().join('/');
}

export function nth(d) {
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function getTimestampInSeconds () {
  return Math.floor(Date.now() / 1000)
}

export function coordinateToString(coordinate: Coordinate): string {
  return `${coordinate.lat},${coordinate.lng}`;
}

export function stringToCoordinate(coordinateStr: string): Coordinate | undefined {
  const parts = coordinateStr.split(',');
  if (parts.length !== 2){
    return undefined;
  }
  if (Number.isNaN(Number(parts[0])) || Number.isNaN(Number(parts[1]))) {
    return undefined;
  }
  return {
    lat: Number(parts[0]),
    lng: Number(parts[1])
  }
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getPercentage(value: number, from: number) {
  return Number((((value) / (from)) * 100).toFixed(0));
}

export function getUniqueListOfCoordinates(arr: Coordinate[]): Coordinate[]{
  return Array.from(
      new Set(arr.map((x) => JSON.stringify({ lat: x.lat, lng: x.lng })))
  ).map((x) => JSON.parse(x));
}

export function addHours(dt: Date, hours: number): Date {
  dt.setHours(dt.getHours() + hours);
  return dt;
}

export function addMinutes(dt: Date, minutes: number): Date {
  dt.setMinutes(dt.getMinutes() + minutes);
  return dt;
}