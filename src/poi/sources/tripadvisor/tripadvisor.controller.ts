import {Controller, Get, Query, UseGuards, ValidationPipe} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {GetUser} from "../../../auth/get-user.decorator";
import {User} from "../../../user/user.entity";
import {SearchDto} from "../../dto/search-dto";
import {TripadvisorService} from "./tripadvisor.service";

@ApiBearerAuth("JWT")
@Controller('poi/external-source/tripadvisor')
export class TripadvisorController {
    constructor(
        private sourceService: TripadvisorService
    ) {}

    @ApiOperation({ summary: "Get Invite Link", description: "Get invite link for specific trip" })
    @Get('/')
    @UseGuards(AuthGuard())
    async getTripAdvisorSuggestions(
        @Query(ValidationPipe) params: SearchDto,
        @GetUser() user: User
    ) {
        params.page = params.page ? Number(params.page) : 1;
        return await this.sourceService.search(params, user)
    }
}
