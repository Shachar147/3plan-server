import {Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards} from "@nestjs/common";
import { User } from "../user/user.entity";
import { GetUser } from "../auth/get-user.decorator";
import {AuthGuard} from "@nestjs/passport";
import {BackupsService} from "./backups.service";
import {GetTripBackupsDto} from "./dto/get-trip-backups-dto";

@Controller("backups")
export class BackupsController {
    constructor(private backupsService: BackupsService) {}

    @Get()
    @UseGuards(AuthGuard())
    GetAllBackups(
        @GetUser() user: User
    ): Promise<any> {
        return this.backupsService.getAllBackups(
            user
        );
    }

    @Get("/by-trip/:id")
    @UseGuards(AuthGuard())
    GetTripBackups(
        @Param("id", ParseIntPipe) id,
        @GetUser() user: User
    ): Promise<any> {
        return this.backupsService.getTripBackups(
            { trip_id: id },
            user
        );
    }
}
