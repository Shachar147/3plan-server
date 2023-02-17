import {Body, Controller, Post} from '@nestjs/common';
import {DistanceService} from "./distance.service";
import {User} from "../user/user.entity";
import {GetUser} from "../auth/get-user.decorator";
import {GetDistanceResultDto} from "./dto/get-distance-result.dto";

@Controller('distance')
export class DistanceController {

    constructor(private distanceService: DistanceService) {}

    @Post()
    GetDistanceBetweenTwoDestination(
        @Body() getDistanceResultDto: GetDistanceResultDto,
        @GetUser() user: User): Promise<any>{
        return this.distanceService.getDistanceBetweenTwoDestination(getDistanceResultDto , user);
    }



}
