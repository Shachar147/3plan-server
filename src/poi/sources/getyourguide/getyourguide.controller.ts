import {Controller, Get, Query, UseGuards, ValidationPipe} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {GetUser} from "../../../auth/get-user.decorator";
import {User} from "../../../user/user.entity";
import {SearchDto} from "../../dto/search-dto";
import {GetYourGuideService} from "./getyourguide.service";

@ApiBearerAuth("JWT")
@Controller('poi/external-source/getyourguide')
export class GetYourGuideController {
    constructor(
        private sourceService: GetYourGuideService
    ) {}

    @ApiOperation({ summary: "Get Invite Link", description: "Get invite link for specific trip" })
    @Get('/')
    @UseGuards(AuthGuard())
    async getGetYourGuideSuggestions(
        @Query(ValidationPipe) params: SearchDto,
        @GetUser() user: User
    ) {
        params.page = params.page ? Number(params.page) : 1;
        return await this.sourceService.searchOld(params, user)
    }
}
