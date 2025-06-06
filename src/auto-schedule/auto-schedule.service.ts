import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { TripService } from "../trip/trip.service";
import { User } from "../user/user.entity";
import { Trip } from "../trip/trip.entity";
import { CalendarEvent, SidebarEvent, Location, DateRangeFormatted } from "../trip/interfaces";
import { getDistance } from 'geolib';

@Injectable()
export class AutoScheduleService {
  private logger = new Logger("AutoScheduleService");
  private readonly averageWalkingSpeedMetersPerMinute = (5 * 1000) / 60;
  private readonly defaultBufferMinutes = 15;
  private readonly defaultMealDurations = {
    breakfast: 45,
    lunch: 60,
    dinner: 90,
  };

  constructor(
    private tripService: TripService,
  ) {}

  async autoSchedule(tripName: string, user: User): Promise<CalendarEvent[]> {
    // TODO: Auto-scheduling logic is temporarily disabled
    this.logger.log(`Auto-scheduling is temporarily disabled for trip: ${tripName}`);
    return [];
  }

  // Helper functions are kept but commented out for future reference
  /*
  private parseDuration(duration: string | undefined): number {
    // ... existing code ...
  }

  private async calculateTravelTime(location1: Location, location2: Location, travelMode: 'walking' | 'driving'): Promise<number> {
    // ... existing code ...
  }

  private isWithinOpeningHours(event: CalendarEvent | SidebarEvent, time: Date): boolean {
    // ... existing code ...
  }

  private async groupActivitiesByArea(activities: SidebarEvent[], hotelLocation?: Location): Promise<SidebarEvent[][]> {
    // ... existing code ...
  }

  private async scheduleMeal(daySchedule: CalendarEvent[], currentTime: Date, mealType: 'breakfast' | 'lunch' | 'dinner', unscheduledActivities: SidebarEvent[], lastActivityLocation: Location | undefined): Promise<{ updatedSchedule: CalendarEvent[], newCurrentTime: Date, usedActivities: SidebarEvent[], scheduledMealEvents: CalendarEvent[] }> {
    // ... existing code ...
  }
  */
} 