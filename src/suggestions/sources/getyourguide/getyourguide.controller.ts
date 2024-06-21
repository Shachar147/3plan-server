import {Body, Controller, Get, UseGuards, ValidationPipe} from '@nestjs/common';
import {ApiOperation} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {GetUser} from "../../../auth/get-user.decorator";
import {User} from "../../../user/user.entity";
import {SearchDto} from "../dto/search-dto";
import {GetYourGuideService} from "./getyourguide.service";

@Controller('suggestions/getyourguide')
export class GetYourGuideController {
    constructor(
        private sourceService: GetYourGuideService
    ) {}

    @ApiOperation({ summary: "Get Invite Link", description: "Get invite link for specific trip" })
    @Get('/')
    @UseGuards(AuthGuard())
    async getGetYourGuideSuggestions(
        @Body(ValidationPipe) params: SearchDto,
        @GetUser() user: User
    ) {
        const { results, isFinished } = await this.sourceService.search(params)
        return {
            results,
            isFinished
        }
    }
}
