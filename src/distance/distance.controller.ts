import {Body, Controller, Post, UseGuards} from "@nestjs/common";
import { DistanceService } from "./distance.service";
import { User } from "../user/user.entity";
import { GetUser } from "../auth/get-user.decorator";
import { CreateDistanceDto } from "./dto/create-distance.dto";
import {AuthGuard} from "@nestjs/passport";

@Controller("distance")
export class DistanceController {
  constructor(private distanceService: DistanceService) {}

  @Post()
  @UseGuards(AuthGuard())
  GetDistanceBetweenTwoDestination(
    @Body() createDistanceDto: CreateDistanceDto,
    @GetUser() user: User
  ): Promise<any> {
    return this.distanceService.getDistanceBetweenTwoDestination(
        createDistanceDto,
      user
    );
  }
}
