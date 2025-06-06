import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GetUser } from "../auth/get-user.decorator";
import { User } from "../user/user.entity";
import { AutoScheduleService } from "./auto-schedule.service";

@ApiBearerAuth("JWT")
@ApiTags("Auto Schedule")
@Controller("auto-schedule")
export class AutoScheduleController {
  constructor(private autoScheduleService: AutoScheduleService) {}

  @Post()
  @UseGuards(AuthGuard())
  @ApiOperation({ summary: "Auto Schedule Trip", description: "Automatically schedule activities for a trip" })
  async autoScheduleTrip(@Body() body: { tripName: string }, @GetUser() user: User) {
    const { tripName } = body;
    console.log(`Received auto-schedule request for trip: ${tripName} by user ${user.username}`);
    try {
      const scheduledTrip = await this.autoScheduleService.autoSchedule(tripName, user);
      return { success: true, message: 'Scheduling complete', scheduledTrip };
    } catch (error) {
      console.error('Auto-scheduling failed:', error);
      return { success: false, message: 'Scheduling failed', error: error.message };
    }
  }
} 