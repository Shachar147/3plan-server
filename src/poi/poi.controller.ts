// point-of-interest.controller.ts
import {Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query} from '@nestjs/common';
import { PointOfInterestService } from './poi.service';
import { PointOfInterest } from './poi.entity';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../user/user.entity';
import {SearchResults} from "../suggestions/sources/utils/interfaces";

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

    @Get('/:id')
    @UseGuards(AuthGuard())
    async getPointOfInterestById(@Param('id') id: number): Promise<PointOfInterest> {
        return this.pointOfInterestService.getPointOfInterestById(id);
    }

    @Patch('/:id')
    @UseGuards(AuthGuard())
    async updatePointOfInterest(
        @Param('id') id: number,
        @Body() data: Partial<PointOfInterest>,
        @GetUser() user: User,
    ): Promise<PointOfInterest> {
        return this.pointOfInterestService.updatePointOfInterest(id, data, user);
    }

    @Delete('/:id')
    @UseGuards(AuthGuard())
    async deletePointOfInterest(@Param('id') id: number, @GetUser() user: User): Promise<void> {
        return this.pointOfInterestService.deletePointOfInterest(id, user);
    }

    @Get('/count/by-source/:destination')
    @UseGuards(AuthGuard())
    async getCountBySourceForDestination(@Param('destination') destination: string, @GetUser() user: User): Promise<Record<string, number>> {
        return this.pointOfInterestService.getCountBySourceForDestination(destination);
    }
}