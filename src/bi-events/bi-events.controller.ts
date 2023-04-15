import {Body, Controller, Get, Param, Post, Put, UseGuards, ValidationPipe} from '@nestjs/common';
import {ApiOperation} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {GetUser} from "../auth/get-user.decorator";
import {User} from "../user/user.entity";
import {ReportEventDto} from "./dto/report-event.dto";
import {BiEventsService} from "./bi-events.service";
import {GetEventsFilterDto} from "./dto/get-events-filter.dto";

@Controller('bi-events')
export class BiEventsController {
    constructor(private biEventsService: BiEventsService) {}

    @ApiOperation({
        summary: "Report BI Event",
        description: "Report a BI Event and store it in our database.",
    })
    @Post()
    @UseGuards(AuthGuard())
    async reportEvent(@Body(ValidationPipe) dto: ReportEventDto, @GetUser() user: User) {
        return await this.biEventsService.reportEvent(dto, user);
    }

    @ApiOperation({
        summary: "Get User's BI Events",
        description: "Get all the BI Events sent by current user. can be filtered also by action, context and isMobile",
    })
    @Put()
    @UseGuards(AuthGuard())
    async getEventsByUser(@Body(ValidationPipe) dto: GetEventsFilterDto, @GetUser() user: User) {
        return await this.biEventsService.getEventsByUser(dto, user);
    }

    @ApiOperation({
        summary: "Get User's BI Events",
        description: "Get all the BI Events sent by current user. can be filtered also by action, context and isMobile",
    })
    @Put("/all")
    @UseGuards(AuthGuard())
    async getEventsByAllUsers(@Body(ValidationPipe) dto: GetEventsFilterDto, @GetUser() user: User) {
        return await this.biEventsService.getEventsByAllUsers(dto, user);
    }
}
