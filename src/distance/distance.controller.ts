import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { DistanceService } from "./distance.service";
import { User } from "../user/user.entity";
import { GetUser } from "../auth/get-user.decorator";
import { AuthGuard } from "@nestjs/passport";
import {GetDistanceResultDto} from "./dto/get-distance-result.dto";

@Controller("distance")
export class DistanceController {
  constructor(private distanceService: DistanceService) {}

  @Post()
  @UseGuards(AuthGuard())
  getDistanceResult(
    @Body() createDistanceDto: GetDistanceResultDto,
    @GetUser() user: User
  ): Promise<any> {
    return this.distanceService.getDistanceResultInChunks(
      createDistanceDto,
      user
    );
  }

  // @Post('/all-routes')
  // @UseGuards(AuthGuard())
  // getAllRoutes(
  //     @Body() dto: GetAllRoutesDto,
  //     @GetUser() user: User
  // ): Promise<any> {
  //   return this.distanceService.getAllRoutes(
  //       dto,
  //       user
  //   );
  // }
}
