// point-of-interest.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Query,
    Put,
    UnauthorizedException
} from '@nestjs/common';
import {PointOfInterestService, UpsertAllResponse} from './poi.service';
import { PointOfInterest } from './poi.entity';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../user/user.entity';
import {SearchResults, SearchSuggestion} from "./utils/interfaces";

export function isAdmin(user: User){
    return user.username == "Shachar";
}

@Controller('poi')
@UseGuards(AuthGuard())
export class PointOfInterestController {
    constructor(private pointOfInterestService: PointOfInterestService) {}

    @Post()
    @UseGuards(AuthGuard())
    async createPointOfInterest(
        @Body() data: Partial<PointOfInterest>,
        @GetUser() user: User,
    ): Promise<PointOfInterest> {
        return this.pointOfInterestService.createPointOfInterest(data, user);
    }

    @Put('/upsert')
    @UseGuards(AuthGuard())
    async upsertPointOfInteresets(
        @Body() items: Partial<PointOfInterest>[],
        @GetUser() user: User,
    ): Promise<UpsertAllResponse> {
        // if (!isAdmin(user)) {
        //     throw new UnauthorizedException();
        // }
        return await this.pointOfInterestService.upsertAll(items, user);
    }

    @Put('/upsert/system-recommendation')
    @UseGuards(AuthGuard())
    async upsertPointOfInteresetsSystemRecommendations(
        @Body() items: Partial<PointOfInterest>[],
        @GetUser() user: User,
    ): Promise<UpsertAllResponse> {
        // if (user.username !== 'Shachar'){
        if (!isAdmin(user)) {
            throw new UnauthorizedException();
        }

        items.forEach((item) => {
            item.isSystemRecommendation = true;
        })
        return await this.pointOfInterestService.upsertAll(items, user);
    }

    // @Get()
    // @UseGuards(AuthGuard())
    // async getAllPointsOfInterest(): Promise<PointOfInterest[]> {
    //     return this.pointOfInterestService.getAllPointsOfInterest();
    // }

    @Get('/by-destination')
    async getPointsOfInterestByDestination(
        @Query('destination') destination: string,
        @Query('page') page: number = 1,
    ): Promise<SearchResults> {
        return this.pointOfInterestService.getPointsOfInterestByDestination(destination, page);
    }

    @Get('/feed')
    async getFeedItems(
        @Query('withoutSystemRecommendations') withoutSystemRecommendations: number = 0,
        @Query('p') page?: number,
    ): Promise<SearchResults> {
        return this.pointOfInterestService.getFeedItems(withoutSystemRecommendations, page);
    }

    @Get('/system-recommendations')
    async getSystemRecommendations(
        @Query('p') page?: number
    ): Promise<SearchResults> {
        return this.pointOfInterestService.getSystemRecommendations(page);
    }

    @Get('/search-suggestions')
    async getSearchSuggestions(@Query('s') searchKeyword: string): Promise<SearchSuggestion[]> {
        return this.pointOfInterestService.getSearchSuggestions(searchKeyword);
    }

    @Get('/search')
    async getSearchResults(
        @Query('q') searchKeyword: string, @Query('page') page: number = 1, @Query('destination') destination: number = 0): Promise<SearchResults> {
        return this.pointOfInterestService.getSearchResults(searchKeyword, page, undefined, destination);
    }

    @Get('/fix-categories')
    @UseGuards(AuthGuard())
    async fixCategoriesDryRun(@GetUser() user: User,): Promise<{
        totalDiffs: number,
        totalUpdated: number
    }> {
        if (!isAdmin(user)) {
            throw new UnauthorizedException();
        }
        return await this.pointOfInterestService.fixCategories(user);
    }

    @Post('/fix-categories')
    @UseGuards(AuthGuard())
    async fixCategories(@GetUser() user: User,): Promise<{
        totalDiffs: number,
        totalUpdated: number
    }> {
        if (!isAdmin(user)) {
            throw new UnauthorizedException();
        }
        return await this.pointOfInterestService.fixCategories(user, false);
    }

    @Get('/:id')
    @UseGuards(AuthGuard())
    async getPointOfInterestById(@Param('id') id: number): Promise<PointOfInterest> {
        return this.pointOfInterestService.getPointOfInterestById(id);
    }

    @Put('/:id')
    @UseGuards(AuthGuard())
    async updatePointOfInterest(
        @Param('id') id: number,
        @Body() data: Partial<PointOfInterest>,
        @GetUser() user: User,
    ): Promise<PointOfInterest> {
        if (!isAdmin(user)) {
            throw new UnauthorizedException();
        }
        return this.pointOfInterestService.updatePointOfInterest(id, data, user);
    }

    @Delete('/:id')
    @UseGuards(AuthGuard())
    async deletePointOfInterest(@Param('id') id: number, @GetUser() user: User): Promise<void> {
        if (!isAdmin(user)) {
            throw new UnauthorizedException();
        }
        return this.pointOfInterestService.deletePointOfInterest(id, user);
    }

    @Get('/count/by-source/:destination')
    @UseGuards(AuthGuard())
    async getCountBySourceForDestination(@Param('destination') destination: string, @GetUser() user: User): Promise<Record<string, number>> {
        if (!isAdmin(user)) {
            throw new UnauthorizedException();
        }
        return this.pointOfInterestService.getCountBySourceForDestination(destination);
    }

    @Get('/by-category/all')
    @UseGuards(AuthGuard())
    async getPointsOfInterestByCategory(@GetUser() user: User): Promise<Record<string, any>> {
        if (!isAdmin(user)) {
            throw new UnauthorizedException();
        }
        return await this.pointOfInterestService.getPointsOfInterestByCategory(user);
    }

    @Get('/by-category/count')
    @UseGuards(AuthGuard())
    async getTotalPointsOfInterestByCategory(@GetUser() user: User): Promise<Record<string, any>> {
        if (!isAdmin(user)) {
            throw new UnauthorizedException();
        }
        const r = await this.pointOfInterestService.getPointsOfInterestByCategory(user);
        Object.keys(r).forEach((category) => {
            r[category] = r[category].length
        });
        return r;
    }
}