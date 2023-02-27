import { Location } from "../route-planner.service";
export class PlanRouteDto {
    locations: Location[];
    numOfDays: number;
}