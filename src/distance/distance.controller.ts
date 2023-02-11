import {Body, Controller, Post} from '@nestjs/common';
import {DistanceService} from "./distance.service";
import {User} from "../user/user.entity";
import {GetUser} from "../auth/get-user.decorator";
import {createDistanceDto} from "./dto/create-distance.dto";

@Controller('distance')
export class DistanceController {

    constructor(private distanceService: DistanceService) {}

    @Post()
    GetDistanceBetweenTwoDestination(
        @Body() createDistanceDto: createDistanceDto[])
        @GetUser() user: User
    ): Promise<any> {
        return this.distanceService.getDistanceBetweenTwoDestination();
    }



}
