import {Controller, Get, UseGuards} from '@nestjs/common';
import {StatisticsService} from "./statistics.service";
// import { AdminGuard } from 'src/auth/admin.guard';
import {AuthGuard} from "@nestjs/passport";
import {TEMPLATES_USER_NAME} from "../shared/const";
import {GetUser} from "../auth/get-user.decorator";
import {User} from "../user/user.entity";

@Controller('admin-statistics')
export class StatisticsController {
    constructor(private statisticsService: StatisticsService) {}

    daysBetween(date1: Date, date2: Date) {
        // Parse the dates
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        // Calculate the difference in milliseconds
        const diffTime = Math.abs(d2.getTime() - d1.getTime());

        // Convert milliseconds to days
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    @Get()
    @UseGuards(AuthGuard())
    getTripsStatistics(){
        return this.statisticsService.getTripsStatistics();
    }

    @Get('/summaries')
    @UseGuards(AuthGuard())
    async getAllStatistics(
        @GetUser() user: User
    ){
        const [tripsAndUsersStats, totalPois, totalSavedItems, totalSavedCollections, totalDestinations, totalSystemRecommendations] = await Promise.all([
            this.statisticsService.getTripsStatistics(),
            this.statisticsService.getTotalPointOfInterests(),
            this.statisticsService.getTotalSavedItems(),
            this.statisticsService.getTotalSavedCollections(),
            this.statisticsService.getTotalDestinations(),
            this.statisticsService.getTotalSystemRecommendations()
        ]);

        const totalUsers = {};
        const totalTrips = {};
        const usersThatLoggedInToday = {};
        const usersThatLoggedInThisWeek = {};
        let totalPlacesOnSidebar = 0;
        let totalPlacesOnCalendar = 0;
        let totalCategories = 0; // for average categories on trip (?)
        let totalNumOfLogins = {}; // for average num of logins per user (?)
        const usersWithoutTrips = {};
        let totalTemplates = 0;
        let totalApprovedTemplates = 0;

        tripsAndUsersStats.forEach((row) => {
            const { name, username, sidebar_events, scheduled_events, num_of_categories, numOfLogins } = row;
            totalUsers[username] = true;

            if (username == TEMPLATES_USER_NAME){
                totalTemplates += 1;

                if (!row.isHidden) {
                    totalApprovedTemplates += 1;
                }
                return;
            }

            if (name == undefined){
                usersWithoutTrips[username] = true;
            } else {
                totalTrips[`${username}_${name}`] = true;
            }

            totalNumOfLogins[username] = numOfLogins;

            totalPlacesOnSidebar += Number(sidebar_events ?? 0);
            totalPlacesOnCalendar += Number(scheduled_events ?? 0);
            totalCategories += Number(num_of_categories ?? 0);

            if (row.lastLoginAt) {
                if (this.daysBetween(new Date(row.lastLoginAt), new Date()) == 0) {
                    usersThatLoggedInToday[username] = true;
                    usersThatLoggedInThisWeek[username] = true;
                }
                // todo change: in this calendar week (if today is sunday = only who connected today. if monday - sunday+today etc)
                else if (this.daysBetween(new Date(row.lastLoginAt), new Date()) <= 7) {
                    usersThatLoggedInThisWeek[username] = true;
                }
            }
        });

        return {
            totalUsers: Object.keys(totalUsers).length,
            totalTrips: Object.keys(totalTrips).length,
            totalUsersWithNoTrip: Object.keys(usersWithoutTrips).length,
            totalUsersThatLoggedInToday: Object.keys(usersThatLoggedInToday).length,
            totalUsersThatLoggedInThisWeek: Object.keys(usersThatLoggedInThisWeek).length,
            usersThatLoggedInThisWeek: user.isAdmin ? usersThatLoggedInThisWeek : undefined,
            totalPlacesOnSidebar,
            totalPlacesOnCalendar,
            avgSidebarItemsInTrip: Number(Number(totalPlacesOnSidebar / Object.keys(totalTrips).length).toFixed(0)),
            avgCalendarItemsInTrip: Number(Number(totalPlacesOnCalendar / Object.keys(totalTrips).length).toFixed(0)),
            avgTripsPerUser: Number(Number(Object.keys(totalTrips).length / Object.keys(totalUsers).length).toFixed(0)),
            totalPois,
            totalSavedItems,
            avgSavedItemsPerUser: Number(Number(totalSavedItems / Object.keys(totalUsers).length).toFixed(0)),
            totalDestinations,
            totalSavedCollections,
            totalSystemRecommendations,

            // templates:
            totalTemplates,
            totalApprovedTemplates
        }
    }
}
