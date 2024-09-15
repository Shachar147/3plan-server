import {Controller, Get, UseGuards} from '@nestjs/common';
import {AuthGuard} from "@nestjs/passport";
import {SearchResults} from "../poi/utils/interfaces";
import {TripTemplatesService} from "./trip-templates.service";
import {GetUser} from "../auth/get-user.decorator";
import {User} from "../user/user.entity";
import {ListTripsDto} from "../trip/dto/list-trips-dto";

@Controller('templates')
@UseGuards(AuthGuard())
export class TripTemplatesController {

    constructor(private tripTemplatesService: TripTemplatesService) {}


    @Get('/feed')
    @UseGuards(AuthGuard())
    async getFeedItems(@GetUser() user: User,): Promise<SearchResults> {
        const trips = await this.tripTemplatesService.getFeedTemplates({} as unknown as ListTripsDto, user);

        return {
            total: trips.length,
            totalPages: 1,
            results: trips,
            nextPage: undefined,
            isFinished: true,
            source: 'Local'
        }
    }
}
