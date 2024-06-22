// point-of-interest.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { PointOfInterestService } from './poi.service';
import { PointOfInterest } from './poi.entity';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../user/user.entity';

@Controller('poi')
@UseGuards(AuthGuard())
export class PointOfInterestController {
    constructor(private pointOfInterestService: PointOfInterestService) {}

    @Post()
    async createPointOfInterest(
        @Body() data: Partial<PointOfInterest>,
        @GetUser() user: User,
    ): Promise<PointOfInterest> {
        return this.pointOfInterestService.createPointOfInterest(data, user);
    }

    @Get()
    async getAllPointsOfInterest(): Promise<PointOfInterest[]> {
        return this.pointOfInterestService.getAllPointsOfInterest();
    }

    @Get('/:id')
    async getPointOfInterestById(@Param('id') id: number): Promise<PointOfInterest> {
        return this.pointOfInterestService.getPointOfInterestById(id);
    }

    @Patch('/:id')
    async updatePointOfInterest(
        @Param('id') id: number,
        @Body() data: Partial<PointOfInterest>,
        @GetUser() user: User,
    ): Promise<PointOfInterest> {
        return this.pointOfInterestService.updatePointOfInterest(id, data, user);
    }

    @Delete('/:id')
    async deletePointOfInterest(@Param('id') id: number, @GetUser() user: User): Promise<void> {
        return this.pointOfInterestService.deletePointOfInterest(id, user);
    }
}