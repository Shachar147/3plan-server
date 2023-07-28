import {Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards, ValidationPipe} from "@nestjs/common";
import { User } from "../user/user.entity";
import { GetUser } from "../auth/get-user.decorator";
import {AuthGuard} from "@nestjs/passport";
import {HistoryService} from "./history.service";
import {ApiOperation} from "@nestjs/swagger";
import {CreateHistoryDto} from "./dto/create-history-dto";

@Controller("history")
export class HistoryController {
    constructor(private historyService: HistoryService) {}

    @ApiOperation({ summary: "Create History Record", description: "Keep History record to db" })
    @Post()
    @UseGuards(AuthGuard())
    CreateHistory(
        @Body(ValidationPipe) createHistoryDto: CreateHistoryDto,
        @GetUser() user: User
    ) {
        return this.historyService.createHistory(
            createHistoryDto,
            user
        )
    }

    @Get()
    @UseGuards(AuthGuard())
    GetAllHistoryCount(
        @GetUser() user: User
    ): Promise<any> {
        return this.historyService.getAllHistory(
            user
        );
    }

    @Get("/by-trip/:id/:limit")
    @UseGuards(AuthGuard())
    GetTripHistory(
        @Param("id", ParseIntPipe) id,
        @Param("limit", ParseIntPipe) limit,
        @GetUser() user: User
    ): Promise<any> {
        return this.historyService.getTripHistory(
            { trip_id: id, limit: limit },
            user
        );
    }

    @Get("/:id")
    @UseGuards(AuthGuard())
    GetSpecificBackup(
        @Param("id", ParseIntPipe) id,
        @GetUser() user: User
    ): Promise<any> {
        return this.historyService.getSpecificHistory(
            id,
            user
        );
    }
}
