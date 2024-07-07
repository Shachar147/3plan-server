import {Body, Controller, Injectable, Post, Query, UseGuards, ValidationPipe} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {GetUser} from "../auth/get-user.decorator";
import {User} from "../user/user.entity";
import {CreateTripDto} from "./dto/create-trip-dto";
import {AIService} from "./ai.service";

@Injectable()
@ApiBearerAuth("JWT")
@Controller('ai')
export class AIController {
    constructor(
        private aiService: AIService
    ) {}

    @ApiOperation({ summary: "Create a Trip using AI", description: "Create a trip on Triplan using AI" })
    @Post('/')
    @UseGuards(AuthGuard())
    async getTripAdvisorSuggestions(
        @Body(ValidationPipe) params: CreateTripDto,
        @GetUser() user: User
    ) {
        return await this.aiService.createTrip(params, user)
    }
}
