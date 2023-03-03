import {Body, Controller, Get, Post, UseGuards} from "@nestjs/common";
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
        @Body() getTripBackupsDto: GetTripBackupsDto,
        @GetUser() user: User
    ): Promise<any> {
        return this.backupsService.getAllBackups(
            user
        );
    }

    @Get("/by-trip")
    @UseGuards(AuthGuard())
    GetTripBackups(
        @Body() getTripBackupsDto: GetTripBackupsDto,
        @GetUser() user: User
    ): Promise<any> {
        return this.backupsService.getTripBackups(
            getTripBackupsDto,
            user
        );
    }
}
