import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import {DistanceService} from "./distance.service";
import {User} from "../user/user.entity";
import {GetUser} from "../auth/get-user.decorator";
import {GetDistanceResultDto} from "./dto/get-distance-result.dto";
import {createDistanceDto} from "./dto/create-distance.dto";
import {AuthGuard} from "@nestjs/passport";

@Controller('distance')
@UseGuards(AuthGuard())
export class DistanceController {

    constructor(private distanceService: DistanceService) {}

    @Post()
    GetDistanceBetweenTwoDestination(
        @Body() createDistanceDto: createDistanceDto,
        @GetUser() user: User): Promise<any>{
        return this.distanceService.getDistanceBetweenTwoDestination(createDistanceDto , user);
    }



}
