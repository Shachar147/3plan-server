import {Controller, Get, Param, ParseIntPipe, Post, UseGuards} from "@nestjs/common";
import { User } from "../user/user.entity";
import { GetUser } from "../auth/get-user.decorator";
import {AuthGuard} from "@nestjs/passport";
import {BackupsService} from "./backups.service";

@Controller("backups")
export class BackupsController {
    constructor(private backupsService: BackupsService) {}

    @Get()
    @UseGuards(AuthGuard())
    GetAllBackupsCount(
        @GetUser() user: User
    ): Promise<any> {
        return this.backupsService.getAllBackups(
            user
        );
    }

    @Get("/by-trip/:id/:limit")
    @UseGuards(AuthGuard())
    GetTripBackups(
        @Param("id", ParseIntPipe) id,
        @Param("limit", ParseIntPipe) limit,
        @GetUser() user: User
    ): Promise<any> {
        return this.backupsService.getTripBackups(
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
        return this.backupsService.getSpecificBackup(
            id,
            user
        );
    }
}
