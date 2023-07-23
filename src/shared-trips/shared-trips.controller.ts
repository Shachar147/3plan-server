import {
    Body,
    Controller, Delete, Get,
    Injectable,
    Param, ParseIntPipe,
    Post, Put, Req,
    UseGuards, UsePipes,
    ValidationPipe
} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiParam, ApiTags} from "@nestjs/swagger";
import {SharedTripsService} from "./shared-trips.service";
import {AuthGuard} from "@nestjs/passport";
import {GetUser} from "../auth/get-user.decorator";
import {User} from "../user/user.entity";
import {CreateInviteLinkDto} from "./dto/create-invite-link-dto";
import {TripService} from "../trip/trip.service";
import {inviteLinkExpiredTimeMinutes} from "./shared-trips.entity";
import {UseInviteLinkDto} from "./dto/use-invite-link-dto";
import {Request} from "express";
import {UpdatePermissionDto} from "./dto/update-permission-dto";

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
        const inviteLink = await this.sharedTripsService.createInviteLink(trip.id, canRead, canWrite, user);
        return {
            inviteLink,
            expiredAt: inviteLinkExpiredTimeMinutes
        }
    }

    @ApiParam({
        name: 'token',
        description: 'invite link token',
        required: true,
        type: 'boolean',
    })
    @ApiOperation({ summary: "Use Invite Link", description: "Use invite link for specific trip" })
    @Post('/use-invite-link')
    @UseGuards(AuthGuard())
    async useInviteLink(
        @Body(ValidationPipe) params: UseInviteLinkDto,
        @GetUser() user: User
    ) {
        const { token } = params;
        const { tripId } = await this.sharedTripsService.useInviteLink(token, user);
        const trip = await this.tripsService.getTrip(tripId, user, true);
        return trip;
    }

    @ApiParam({
        name: 'tripName',
        description: 'trip name',
        required: true,
        type: 'string',
    })
    @ApiOperation({ summary: "Use Invite Link", description: "Use invite link for specific trip" })
    @Get('/collaborators/name/:tripName')
    @UseGuards(AuthGuard())
    async getTripCollaborators(
        @Param("tripName") tripName: string,
        @GetUser() user: User
    ) {
        return await this.sharedTripsService.getTripCollaborators(tripName, user)
    }

    @ApiOperation({ summary: "Delete Permission by id", description: "Delete permission by id" })
    @ApiParam({
        name: "id",
        description: "permissions id",
        required: true,
        type: "number",
    })
    @Delete("/:id")
    @UseGuards(AuthGuard())
    async deletePermission(
        @Param("id", ParseIntPipe) id,
        @GetUser() user: User,
        @Req() request: Request
    ) {
        const result = await this.sharedTripsService.deletePermission(id, user, request);
        // this.myWebSocketGateway.send(JSON.stringify(result), user.id, request.headers.cid?.toString() ?? "");
        return result;
    }

    @ApiOperation({ summary: "Update Permission", description: "Update permission by id" })
    @ApiParam({
        name: "id",
        description: "permission id",
        required: true,
        type: "number",
    })
    @Put("/:id")
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseGuards(AuthGuard())
    async updatePermission(
        @Param("id", ParseIntPipe) id,
        @Body() updatePermissionDto: UpdatePermissionDto,
        @GetUser() user: User,
        @Req() request: Request
    ) {
        const result = await this.sharedTripsService.updatePermission(id, updatePermissionDto, user, request);
        // this.myWebSocketGateway.send(JSON.stringify(result), user.id, request.headers.cid?.toString() ?? "");
        return result;
    }
}
