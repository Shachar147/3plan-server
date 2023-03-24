import {Body, Controller, Get, Param, Post, Query, UseGuards, ValidationPipe} from "@nestjs/common";
import { DistanceService } from "./distance.service";
import { User } from "../user/user.entity";
import { GetUser } from "../auth/get-user.decorator";
import { AuthGuard } from "@nestjs/passport";
import {GetDistanceResultDto} from "./dto/get-distance-result.dto";
import {ApiOperation, ApiParam} from "@nestjs/swagger";
import {Distance} from "./distance.entity";

@Controller("distance")
export class DistanceController {
  constructor(private distanceService: DistanceService) {}

  @Post()
  @UseGuards(AuthGuard())
  getDistanceResult(
    @Body(ValidationPipe) createDistanceDto: GetDistanceResultDto,
    @GetUser() user: User
  ): Promise<any> {
    return this.distanceService.getDistanceResultInChunks(
      createDistanceDto,
      user
    );
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
    description: "Returns all the routes that related to specific trip, by trip's coordinates.",
  })
  @ApiParam({
    name: "tripName",
    description: "The name of the trip",
    required: true,
    type: "string",
  })
  @Get("/trip/:tripName")
  @UseGuards(AuthGuard())
  getTripRoutes(@Param("tripName") tripName, @GetUser() user: User): Promise<{ total: number, results: Distance[]}> {
    return this.distanceService.getTripRoutes(tripName, user);
  }
}
