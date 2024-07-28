import {Controller, Get, UseGuards} from '@nestjs/common';
import {StatisticsService} from "./statistics.service";
// import { AdminGuard } from 'src/auth/admin.guard';
import {AuthGuard} from "@nestjs/passport";

@Controller('admin-statistics')
export class StatisticsController {
    constructor(private statisticsService: StatisticsService) {}

    @Get()
    @UseGuards(AuthGuard())
    getTripsStatistics(){
        return this.statisticsService.getTripsStatistics();
    }
}
