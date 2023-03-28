import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { DistanceService } from "./distance.service";
import { User } from "../user/user.entity";
import { GetUser } from "../auth/get-user.decorator";
import { AuthGuard } from "@nestjs/passport";
import { CalcDistancesDto } from "./dto/calc-distances.dto";
import { ApiOperation, ApiParam } from "@nestjs/swagger";
import { Distance } from "./distance.entity";
import {TaskCreatedResult, TripRoutesResult} from "../task/common";

@Controller("distance")
export class DistanceController {
  constructor(private distanceService: DistanceService) {}

  @ApiOperation({
    summary: "Calculate distances",
    description: "Calculate distances & durations between array of origins and array of destinations.",
  })
  @Post()
  @UseGuards(AuthGuard())
  calcDistances(@Body(ValidationPipe) dto: CalcDistancesDto, @GetUser() user: User): Promise<TaskCreatedResult> {
    return this.distanceService.calcDistancesInChunks(dto, user);
  }

  @ApiOperation({
    summary: "Get Nearby places By Coordinate",
    description: "Supply a coordinate and get nearby places",
  })
  @ApiParam({
    name: "coordinate",
    description: "Coordinate in the format of {lat,lng}",
    required: true,
    type: "string",
  })
  @Get("/near/:coordinate")
  @UseGuards(AuthGuard())
  getNearbyPlacesByCoordinate(@Param("coordinate") coordinate, @GetUser() user: User): Promise<Distance[]> {
    return this.distanceService.getNearbyPlacesByCoordinate(coordinate, user);
  }

  @ApiOperation({
    summary: "Get trip Routes",
    description:
      "Returns all the routes that related to specific trip, by trip's coordinates.",
  })
  @ApiParam({
    name: "tripName",
    description: "The name of the trip",
    required: true,
    type: "string",
  })
  @Get("/trip/:tripName")
  @UseGuards(AuthGuard())
  getTripRoutes(@Param("tripName") tripName, @GetUser() user: User): Promise<TripRoutesResult> {
    return this.distanceService.getTripRoutes(tripName, user);
  }
}
