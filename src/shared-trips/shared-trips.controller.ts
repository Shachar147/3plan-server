import {
    Body,
    Controller,
    Injectable,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
    ValidationPipe
} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiParam, ApiTags} from "@nestjs/swagger";
import {SharedTripsService} from "./shared-trips.service";
import {AuthGuard} from "@nestjs/passport";
import {GetUser} from "../auth/get-user.decorator";
import {User} from "../user/user.entity";
import {CreateInviteLinkDto} from "./dto/create-invite-link-dto";
import {TripService} from "../trip/trip.service";

@Injectable()
@ApiBearerAuth("JWT")
@ApiTags("Shared Trips")
@Controller("shared-trips")
export class SharedTripsController {
    constructor(
        private tripsService: TripService,
        private sharedTripsService: SharedTripsService,
    ) {}

    @ApiParam({
        name: 'tripName',
        description: 'the name of the trip',
        required: true,
        type: 'string',
    })
    @ApiParam({
        name: 'canRead',
        description: 'can the user perform read operations',
        required: true,
        type: 'boolean',
    })
    @ApiParam({
        name: 'canWrite',
        description: 'can the user perform write operations',
        required: true,
        type: 'boolean',
    })
    @ApiOperation({ summary: "Get Invite Link", description: "Get invite link for specific trip" })
    @Post('/create-invite-link')
    @UseGuards(AuthGuard())
    async getInviteLink(
        @Body(ValidationPipe) params: CreateInviteLinkDto,
        @GetUser() user: User
    ) {
        const { tripName, canRead, canWrite } = params;
        const trip = await this.tripsService.getTripByName(tripName, user);
        return await this.sharedTripsService.createInviteLink(trip.id, canRead, canWrite, user);
    }
}
