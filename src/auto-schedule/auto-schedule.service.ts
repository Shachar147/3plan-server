import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { TripService } from "../trip/trip.service";
import { User } from "../user/user.entity";
import { Trip } from "../trip/trip.entity";
import { CalendarEvent, SidebarEvent, Location, DateRangeFormatted, TriPlanCategory } from "../trip/interfaces";
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
    // 1. Fetch trip data from the database based on tripName and user
    this.logger.log(`Fetching trip data for: ${tripName} for user ${user.username}`);
    const trip: Trip = await this.tripService.getTripByName(tripName, user);

    if (!trip) {
      throw new NotFoundException(`Trip with name ${tripName} not found for this user`);
    }

    // Parse calendar events and sidebar events
    const rawCalendarEvents = trip.calendarEvents as any;
    const calendarEvents: CalendarEvent[] = (rawCalendarEvents)
        ? (typeof rawCalendarEvents === 'string' ? JSON.parse(rawCalendarEvents) : rawCalendarEvents) as CalendarEvent[]
        : [];

    const rawSidebarEvents = trip.sidebarEvents as any;
    const sidebarEvents: Record<number, SidebarEvent[]> = (rawSidebarEvents)
        ? (typeof rawSidebarEvents === 'string' ? JSON.parse(rawSidebarEvents) : rawSidebarEvents) as Record<number, SidebarEvent[]>
        : {};

    // Parse categories
    const rawCategories = trip.categories as any;
    const categories: TriPlanCategory[] = (rawCategories)
      ? (typeof rawCategories === 'string' ? JSON.parse(rawCategories) : rawCategories)
      : [];
    this.logger.log('Trip categories:', JSON.stringify(categories));

    // Parse date range
    const dateRange: DateRangeFormatted = { start: trip.dateRange as string, end: trip.dateRange as string };
    try {
        const parsedDateRange = typeof trip.dateRange === 'string' ? JSON.parse(trip.dateRange) : trip.dateRange;
        if (parsedDateRange && parsedDateRange.start && parsedDateRange.end) {
             dateRange.start = parsedDateRange.start;
             dateRange.end = parsedDateRange.end;
        }
    } catch (e) {
        this.logger.error(`Failed to parse dateRange for trip ${tripName}:`, e);
    }

    // Create a copy of scheduled events that we'll modify
    let currentSchedule: CalendarEvent[] = [...calendarEvents];

    // Schedule hotels
    currentSchedule = this.scheduleHotels(currentSchedule, calendarEvents, sidebarEvents, dateRange.start, categories);

    // Update the trip data in the database
    trip.calendarEvents = currentSchedule as any;
    await this.tripService.updateTripByName(tripName, {
      name: tripName,
      dateRange: trip.dateRange,
      categories: categories as unknown as "jsonb",
      allEvents: trip.allEvents,
      calendarEvents: trip.calendarEvents,
      sidebarEvents: trip.sidebarEvents,
      isLocked: trip.isLocked,
      isHidden: trip.isHidden,
      calendarLocale: trip.calendarLocale,
      destinations: trip.destinations
    }, user, {} as any);

    return currentSchedule;
  }

  private scheduleHotels(
    currentSchedule: CalendarEvent[],
    calendarEvents: CalendarEvent[],
    sidebarEvents: Record<number, SidebarEvent[]>,
    tripStartDate: string,
    categories: TriPlanCategory[]
  ): CalendarEvent[] {
    this.logger.log('Starting hotel scheduling process...');
    this.logger.log(`Total calendar events: ${calendarEvents.length}`);
    this.logger.log(`Total sidebar events: ${Object.values(sidebarEvents).reduce((acc, events) => acc + events.length, 0)}`);

    // Get category IDs for flights and hotels from trip categories
    const flightCategory = categories.find(cat => cat.title === 'flights' || cat.title === 'טיסות');
    const hotelCategory = categories.find(cat => cat.title === 'hotels' || cat.title === 'בתי מלון');
    
    if (!flightCategory || !hotelCategory) {
      this.logger.error('Could not find flight or hotel categories in trip categories');
      return currentSchedule;
    }

    this.logger.log(`Flight category ID: ${flightCategory.id}, Hotel category ID: ${hotelCategory.id}`);

    // Find flights in the calendar
    const flights = calendarEvents.filter(event => 
      event.category == flightCategory.id
    );
    this.logger.log(`Found ${flights.length} flights in calendar`);

    // Check if there are any scheduled hotels
    const scheduledHotels = calendarEvents.filter(event => 
      event.category == hotelCategory.id
    );
    this.logger.log(`Found ${scheduledHotels.length} scheduled hotels`);

    // If there are already scheduled hotels, don't schedule any more
    if (scheduledHotels.length > 0) {
      this.logger.log('Found existing scheduled hotels, skipping hotel scheduling');
      return currentSchedule;
    }

    // Find all hotels in sidebar
    const allSidebarEvents = Object.values(sidebarEvents)
      .reduce((acc: SidebarEvent[], events) => acc.concat(events), []);
    this.logger.log(`Total sidebar events after flattening: ${allSidebarEvents.length}`);

    const hotelEvents = allSidebarEvents.filter(event => 
      event.category == hotelCategory.id
    );

    if (hotelEvents.length === 0) {
      this.logger.log('No hotels found in sidebar events');
      return currentSchedule;
    }

    this.logger.log(`Found ${hotelEvents.length} hotels in sidebar`);

    // Get the number of days in the trip
    const startDate = new Date(tripStartDate);
    const endDate = new Date(calendarEvents[calendarEvents.length - 1]?.end || tripStartDate);
    const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get the maximum ID from all events
    const maxId = Math.max(
      ...calendarEvents.map(e => Number(e.id)),
      ...allSidebarEvents.map(e => Number(e.id)),
      0
    );

    // Schedule hotels for each day
    for (let day = 0; day < numberOfDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);

      // Get the hotel event for this day (cycle through available hotels)
      const hotelEvent = hotelEvents[day % hotelEvents.length];
      
      // Create a new hotel event with a unique ID
      const newHotelEvent = {
        ...hotelEvent,
        id: maxId + day + 1
      };

      // Schedule the hotel for this day
      const scheduledHotelEvent = this.scheduleHotelForDay(newHotelEvent, currentDate);
      if (scheduledHotelEvent) {
        this.logger.log(`Scheduled hotel for day ${day + 1}`);
        currentSchedule.push(scheduledHotelEvent);
      }
    }

    return currentSchedule;
  }

  private scheduleHotelForDay(
    hotelEvent: SidebarEvent,
    date: Date
  ): CalendarEvent | null {
    this.logger.log(`Scheduling hotel for date: ${date.toISOString()}`);
    
    // Set start time to 8:00 AM
    const hotelStartTime = new Date(date);
    hotelStartTime.setHours(8, 0, 0, 0);

    // Create hotel calendar event
    const hotelEndTime = new Date(hotelStartTime);
    
    // Parse duration from format "HH:mm"
    const [hours, minutes] = (hotelEvent.duration || '01:00').split(':').map(Number);
    hotelEndTime.setHours(hotelStartTime.getHours() + hours);
    hotelEndTime.setMinutes(hotelStartTime.getMinutes() + minutes);

    const scheduledHotelEvent: CalendarEvent = {
      ...hotelEvent,
      start: hotelStartTime.toISOString(),
      end: hotelEndTime.toISOString(),
             allDay: false,
      className: `priority-${hotelEvent.priority}`,
    };

    this.logger.log(`Scheduled hotel from ${hotelStartTime.toISOString()} to ${hotelEndTime.toISOString()}`);
    return scheduledHotelEvent;
  }

  private roundToNearestHalfHour(date: Date): Date {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    const roundedDate = new Date(date);
    roundedDate.setMinutes(roundedMinutes);
    roundedDate.setSeconds(0);
    roundedDate.setMilliseconds(0);
    return roundedDate;
  }

  private scheduleHotel(
    hotelEvent: SidebarEvent,
    flights: CalendarEvent[],
    tripStartDate: string
  ): CalendarEvent | null {
    this.logger.log('Starting to schedule individual hotel...');
    const startDate = new Date(tripStartDate);
    let hotelStartTime: Date;

    if (flights.length > 0) {
      this.logger.log('Found flights, checking for first day flight...');
      // Find the first flight of the day
      const firstDayFlight = flights.find(flight => {
        const flightDate = new Date(flight.start);
        return flightDate.toDateString() === startDate.toDateString();
      });

      if (firstDayFlight) {
        this.logger.log('Found flight on first day, scheduling hotel 2 hours after flight end');
        // Schedule hotel 2 hours after flight end
        hotelStartTime = new Date(firstDayFlight.end);
        hotelStartTime.setHours(hotelStartTime.getHours() + 2);
        // Round to nearest half hour
        hotelStartTime = this.roundToNearestHalfHour(hotelStartTime);
      } else {
        this.logger.log('No flight on first day, scheduling hotel at 9 AM');
        // No flight on first day, schedule hotel at 9 AM
        hotelStartTime = new Date(startDate);
        hotelStartTime.setHours(9, 0, 0, 0);
      }
        } else {
      this.logger.log('No flights found, scheduling hotel at 9 AM on first day');
      // No flights at all, schedule hotel at 9 AM on first day
      hotelStartTime = new Date(startDate);
      hotelStartTime.setHours(9, 0, 0, 0);
    }

    // Create hotel calendar event
    const hotelEndTime = new Date(hotelStartTime);
    
    // Parse duration from format "HH:mm"
    const [hours, minutes] = (hotelEvent.duration || '24:00').split(':').map(Number);
    hotelEndTime.setHours(hotelStartTime.getHours() + hours);
    hotelEndTime.setMinutes(hotelStartTime.getMinutes() + minutes);

    const scheduledHotelEvent: CalendarEvent = {
      ...hotelEvent,
      start: hotelStartTime.toISOString(),
      end: hotelEndTime.toISOString(),
      allDay: false,
      className: `priority-${hotelEvent.priority}`,
    };

    this.logger.log(`Scheduled hotel from ${hotelStartTime.toISOString()} to ${hotelEndTime.toISOString()}`);
    return scheduledHotelEvent;
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