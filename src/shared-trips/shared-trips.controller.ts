import {Controller, Get, Injectable, Param, ParseIntPipe, Query, UseGuards, ValidationPipe} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {SharedTripsService} from "./shared-trips.service";
import {AuthGuard} from "@nestjs/passport";
import {ListTripsDto} from "../trip/dto/list-trips-dto";
import {GetUser} from "../auth/get-user.decorator";
import {User} from "../user/user.entity";

@Injectable()
@ApiBearerAuth("JWT")
@ApiTags("Shared Trips")
@Controller("shared-trips")
export class SharedTripsController {
    constructor(
        private sharedTripsService: SharedTripsService,
    ) {}

    @ApiOperation({ summary: "Get Invite Link", description: "Get invite link for specific trip" })
    @Get('/:tripId')
    @UseGuards(AuthGuard())
    async getInviteLink(
        @Param("tripId", ParseIntPipe) id,
        @GetUser() user: User
    ) {
        return await this.sharedTripsService.getInviteLink(id, user);
    }
}
