import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { DistanceService } from "./distance.service";
import { User } from "../user/user.entity";
import { GetUser } from "../auth/get-user.decorator";
import { CalcDistanceDto } from "./dto/calc-distance.dto";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation } from "@nestjs/swagger";

@Controller("distance")
export class DistanceController {
  constructor(private distanceService: DistanceService) {}

  @Post()
  @UseGuards(AuthGuard())
  @ApiOperation({
    summary: "Calculate Distance",
    description:
      "This endpoint gets origin coordinates, and array of destination coordinates and returns distance and duration routes between each of them",
  })
  calculateDistance(
    @Body() calcDistanceDto: CalcDistanceDto,
    @GetUser() user: User
  ): Promise<any> {
    return this.distanceService.getDistanceBetweenTwoDestinations(
      calcDistanceDto,
      user
    );
  }
}
