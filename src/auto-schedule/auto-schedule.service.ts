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
    // 1. Fetch trip data from the database based on tripName and user
    console.log(`Fetching trip data for: ${tripName} for user ${user.username}`);
    // Use the actual Trip entity type
    const trip: Trip = await this.tripService.getTripByName(tripName, user);

    if (!trip) {
      throw new NotFoundException(`Trip with name ${tripName} not found for this user`);
    }

    // --- Type Handling for jsonb and dateRange ---
    // Explicitly handle potential string/jsonb data by casting through any
    // Use JSON.parse(JSON.stringify(...)) if the raw data is a stringified JSON
    // Otherwise, a direct cast might work if TypeORM returns the object structure

    const rawCalendarEvents = trip.calendarEvents as any; // Use any for initial access
    const calendarEvents: CalendarEvent[] = (rawCalendarEvents)
        ? (typeof rawCalendarEvents === 'string' ? JSON.parse(rawCalendarEvents) : rawCalendarEvents) as CalendarEvent[]
        : [];
    this.logger.log(`Fetched ${calendarEvents.length} calendar events.`);

    const rawSidebarEvents = trip.sidebarEvents as any; // Use any for initial access
    const sidebarEvents: Record<number, SidebarEvent[]> = (rawSidebarEvents)
        ? (typeof rawSidebarEvents === 'string' ? JSON.parse(rawSidebarEvents) : rawSidebarEvents) as Record<number, SidebarEvent[]>
        : {};
    this.logger.log(`Fetched sidebar events with ${Object.keys(sidebarEvents).length} categories.`);

    // Assuming trip.dateRange is a string and needs parsing
    const dateRange: DateRangeFormatted = { start: trip.dateRange as string, end: trip.dateRange as string }; // Adjust parsing if needed
    // If trip.dateRange is actually a JSON string representing { start: ..., end: ... }
    try {
        const parsedDateRange = typeof trip.dateRange === 'string' ? JSON.parse(trip.dateRange) : trip.dateRange;
        if (parsedDateRange && parsedDateRange.start && parsedDateRange.end) {
             dateRange.start = parsedDateRange.start;
             dateRange.end = parsedDateRange.end;
        }
    } catch (e) {
        this.logger.error(`Failed to parse dateRange for trip ${tripName}:`, e);
        // Fallback or error handling if dateRange format is unexpected
    }
    // --- End Type Handling ---

    // Use the fetched and casted data
    let currentSchedule: CalendarEvent[] = [...calendarEvents]; // Create a mutable copy of scheduled events

    // Combine all sidebar events into a single array of unscheduled activities
    // This list will be updated as activities are scheduled across all days.
    let unscheduledActivities: SidebarEvent[] = Object.values(sidebarEvents).reduce((acc: SidebarEvent[], events: SidebarEvent[]) => acc.concat(events), []);
    this.logger.log(`Total unscheduled activities from sidebar: ${unscheduledActivities.length}`);

    // Find the hotel location:
    // 1. First, check sidebar events for a hotel.
    const hotelEventSidebar = unscheduledActivities.find(event =>
        event.category === 'hotels' || event.category === 'בתי מלון'
    );
    let hotelLocation: Location | undefined = hotelEventSidebar?.location;

    if (!hotelLocation) {
         // 2. If no hotel found in sidebar, check already scheduled calendar events.
         const hotelEventCalendar = calendarEvents.find(event =>
             event.category === 'hotels' || event.category === 'בתי מלון'
         );
         hotelLocation = hotelEventCalendar?.location;
    }

    if (!hotelLocation) {
        this.logger.warn(`Hotel location not found for trip: ${tripName}. Scheduling will not start from a fixed point.`);
    } else {
        this.logger.log(`Hotel location found: ${JSON.stringify(hotelLocation)}`);
    }

    // Sort unscheduled activities by priority (e.g., lower number = higher priority)
    unscheduledActivities.sort((a, b) => (a.priority || Infinity) - (b.priority || Infinity));
    this.logger.log('Unscheduled activities sorted by priority.');

    const tripStartDate = new Date(dateRange.start);
    const tripEndDate = new Date(dateRange.end);

    this.logger.log(`Trip date range: ${dateRange.start} to ${dateRange.end}`);

    // 2. Implement the rule-based scheduling algorithm
    // Iterate through each day of the trip
    for (let date = new Date(tripStartDate); date <= tripEndDate; date.setDate(date.getDate() + 1)) {
      const day = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      this.logger.log(`--- Starting scheduling for day: ${day} ---`);
      const isLastDay = date.getTime() === tripEndDate.getTime();

      // Filter scheduled events for the current day
      let currentDaySchedule: CalendarEvent[] = currentSchedule.filter(event => {
          const eventStart = event.start;
          return eventStart && new Date(eventStart).toISOString().startsWith(day);
      });
      this.logger.log(`Found ${currentDaySchedule.length} already scheduled events for ${day}.`);

      // Set start time for the day (09:00)
      let currentTime = new Date(`${day}T09:00:00`);
      const dayEndTime = new Date(`${day}T23:00:00`); // Daily end time 23:00 (can be extended to 00:00 if needed)
      this.logger.log(`Day starts at ${currentTime.toLocaleTimeString()} and ends at ${dayEndTime.toLocaleTimeString()}.`);

      // Set the current location for the start of the day
      // Start from hotel location if available, otherwise start with no specific location constraint
      let lastActivityLocation: Location | undefined = hotelLocation ? hotelLocation : undefined;
      this.logger.log(`Starting location for the day: ${lastActivityLocation ? JSON.stringify(lastActivityLocation) : 'undefined'}`);

      // --- Scheduling Loop for the Day ---
      let activitiesScheduledToday = true;
      while (activitiesScheduledToday && currentTime.getTime() < dayEndTime.getTime() && unscheduledActivities.length > 0) {
        activitiesScheduledToday = false; // Assume no activity will be scheduled until one is
        this.logger.log(`Current time: ${currentTime.toLocaleTimeString()}. ${unscheduledActivities.length} unscheduled activities remaining.`);

        // Find the next best activity to schedule for this day
        // This is a simplified selection. A real implementation needs more logic:
        // - Consider preferred time of day
        // - Consider grouping by area (call groupActivitiesByArea helper)
        // - Avoid scheduling same type of activity back-to-back (e.g., food after food)

        // For now, find the first unscheduled activity that can potentially fit
        const activityIndexToSchedule = unscheduledActivities.findIndex(activity => {
             this.logger.log(`Considering activity for scheduling: ${activity.title} (Duration: ${activity.duration})`);
            // Basic check: does the activity have a duration and potentially a location if needed?
             return activity.duration; // Add more sophisticated checks here
        });

        if (activityIndexToSchedule === -1) {
            this.logger.log(`No suitable unscheduled activity found with duration for ${day}.`);
            // No suitable unscheduled activity found for now, move to meal or next day
            break; // Exit the activity scheduling loop for the day
        }

        const activityToSchedule = unscheduledActivities[activityIndexToSchedule];
         this.logger.log(`Selected activity to potentially schedule: ${activityToSchedule.title}`);

        // *** Calculate Travel Time and Buffer ***
        let travelTimeMinutes = 0;
         if (lastActivityLocation && activityToSchedule.location) {
             this.logger.log(`Calculating travel time from ${JSON.stringify(lastActivityLocation)} to ${JSON.stringify(activityToSchedule.location)}`);
             travelTimeMinutes = await this.calculateTravelTime(lastActivityLocation, activityToSchedule.location, 'walking');
             this.logger.log(`Calculated travel time: ${travelTimeMinutes} minutes.`);
         }
         const bufferMinutes = this.defaultBufferMinutes;

        // *** Parse Duration ***
        const durationMinutes = this.parseDuration(activityToSchedule.duration);
        if (durationMinutes === 0 && activityToSchedule.duration) {
            this.logger.warn(`Could not parse duration for activity: ${activityToSchedule.title}. Skipping and removing from unscheduled.`);
            unscheduledActivities.splice(activityIndexToSchedule, 1); // Remove unprocessable activity
            continue; // Skip to the next activity
        }
        this.logger.log(`Activity duration: ${durationMinutes} minutes.`);

        const totalTimeNeeded = durationMinutes + travelTimeMinutes + bufferMinutes;
        const activityStartTime = new Date(currentTime.getTime() + travelTimeMinutes * 60000);
        const activityEndTime = new Date(activityStartTime.getTime() + durationMinutes * 60000);
        const nextSlotStartTime = new Date(activityEndTime.getTime() + bufferMinutes * 60000);
        this.logger.log(`Activity would start at ${activityStartTime.toLocaleTimeString()} and end at ${activityEndTime.toLocaleTimeString()}. Next slot starts at ${nextSlotStartTime.toLocaleTimeString()}. Total time needed: ${totalTimeNeeded} minutes.`);

        // *** Check if activity fits within the day's time window and opening hours ***
        // Placeholder for opening hours check
        const isWithinOpeningHours = this.isWithinOpeningHours(activityToSchedule, activityStartTime);
        this.logger.log(`Is within opening hours? ${isWithinOpeningHours}`);

        // Check if the activity ends before or at the day's end time (allowing slight overflow for buffer into next minute)
         const canFitToday = nextSlotStartTime.getTime() <= dayEndTime.getTime() + (bufferMinutes * 60000);
        this.logger.log(`Can fit today? ${canFitToday} (Next slot time: ${nextSlotStartTime.toLocaleTimeString()}, Day end time: ${dayEndTime.toLocaleTimeString()})`);

        if (canFitToday && isWithinOpeningHours) {
          // Schedule the activity
           const scheduledEvent: CalendarEvent = {
             ...activityToSchedule, // Copy all properties from sidebar event
             start: activityStartTime.toISOString(),
             end: activityEndTime.toISOString(),
             allDay: false,
             // Add any other properties needed for calendar events
             className: `priority-${activityToSchedule.priority}`, // Example: add priority class
           };

          currentDaySchedule.push(scheduledEvent);
          unscheduledActivities.splice(activityIndexToSchedule, 1); // Remove from unscheduled
          currentTime = nextSlotStartTime; // Move time forward to the end of this activity + buffer
          lastActivityLocation = activityToSchedule.location; // Update last location
          activitiesScheduledToday = true; // An activity was scheduled, continue the loop
           this.logger.log(`SUCCESS: Scheduled activity ${activityToSchedule.title} on ${day} from ${activityStartTime.toLocaleTimeString()} to ${activityEndTime.toLocaleTimeString()}. Remaining unscheduled: ${unscheduledActivities.length}`);
        } else {
          // Activity does not fit or is outside opening hours for today.
          // For now, we'll skip this activity for this iteration of the inner loop.
          // More advanced logic could try to schedule it later in the day, or on a different day.
           this.logger.log(`SKIP: Activity ${activityToSchedule.title} does not fit on ${day} starting at ${currentTime.toLocaleTimeString()} (needs ${totalTimeNeeded} min) or is outside opening hours.`);
           // To prevent infinite loops on activities that never fit, we should eventually move this activity.
           // A simple approach is to try it on the next day if it doesn't fit today.
           // For this placeholder, if it doesn't fit, we'll just let the loop continue to the next activity.
        }
      }
      // --- End Scheduling Loop for the Day ---

      // --- Meal Scheduling (Placeholder) ---
      // You would add logic here to schedule meal times based on currentTime and remaining time
      // Use the scheduleMeal helper
      // Remember to handle restaurant scheduling based on priority 1/10 and distance
      // Update currentTime and lastActivityLocation after scheduling a meal
      // Remove scheduled restaurants from unscheduledActivities
      // --- End Meal Scheduling ---

       // On the last day, add free time logic here if needed
       if (isLastDay) {
         // Add free time or schedule less densely
          this.logger.log(`Reached last day (${day}). Implementing free time logic.`);
         // Example: Leave remaining time unscheduled
       }

      // Merge the day's newly scheduled activities back into the overall schedule
      // Filter out any previous entries for this day before concatenating the new schedule for the day
      currentSchedule = currentSchedule.filter(event => {
          const eventStart = event.start;
          return !eventStart || !new Date(eventStart).toISOString().startsWith(day);
      }).concat(currentDaySchedule);

       this.logger.log(`--- Finished scheduling for day ${day}. Remaining unscheduled activities: ${unscheduledActivities.length} ---`);
    }
    // --- End Daily Loop ---

    // 3. Update the trip data in the database with the new schedule
    console.log(`Updating trip data for: ${tripName}`);
    this.logger.log(`Final number of scheduled events: ${currentSchedule.length}`);
    this.logger.log(`Final number of unscheduled activities: ${unscheduledActivities.length}`);

    // Assign the final scheduled events to calendarEvents
    trip.calendarEvents = currentSchedule as any; // Cast to any to satisfy TypeORM jsonb type

    // Update sidebarEvents with the remaining unscheduled activities
    // This requires mapping the remaining unscheduledActivities back into the sidebarEvents structure
    const updatedSidebarEvents: Record<number, SidebarEvent[]> = {};
    // Re-populate updatedSidebarEvents based on original categories to maintain structure
    // Initialize with empty arrays for all categories present in the remaining unscheduled activities
    const categoriesInRemaining = new Set(unscheduledActivities.map(activity => activity.category as number).filter(id => id !== undefined));
    categoriesInRemaining.forEach(categoryId => {
         updatedSidebarEvents[categoryId] = [];
    });

    unscheduledActivities.forEach(activity => {
        const categoryId = activity.category as number; // Assuming category is a number ID
        if (categoryId !== undefined && updatedSidebarEvents[categoryId]) { // Ensure category exists and is initialized
            updatedSidebarEvents[categoryId].push(activity);
        } else if (categoryId !== undefined) {
             // This might happen if a new category was added in sidebarEvents but not in the initial structure copy
             updatedSidebarEvents[categoryId] = [activity];
             this.logger.warn(`Unscheduled activity ${activity.title} has category ${categoryId} not present in original sidebar structure. Added to new array.`);
        } else {
             this.logger.warn(`Unscheduled activity ${activity.title} has no category and will not be added back to sidebar.`);
        }
    });

    trip.sidebarEvents = updatedSidebarEvents as any; // Cast to any to satisfy TypeORM jsonb type

    // Save the updated trip data back to the database
    await this.tripService.updateTripByName(tripName, { calendarEvents: trip.calendarEvents, sidebarEvents: trip.sidebarEvents }, user, {} as any);

    // 4. Return the updated schedule
    console.log('Scheduling complete. Returning updated schedule.');
    // Return the actual scheduled events array
    return trip.calendarEvents as unknown as CalendarEvent[]; // Cast for the return type
  }

  // Helper function to parse duration string (e.g., "1h 30m" or "HH:mm") into minutes
  private parseDuration(duration: string | undefined): number {
    if (!duration) return 0;
    let totalMinutes = 0;

    // Check if the duration is in "HH:mm" format
    const timeParts = duration.match(/^(\d{1,2}):(\d{2})$/);
    if (timeParts) {
      const hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      totalMinutes = hours * 60 + minutes;
    } else {
      // Fallback to existing logic for formats like "1h", "30m", "1h 30m"
      const parts = duration.match(/(\d+)([hm])/g);
      if (parts) {
        parts.forEach(part => {
          const value = parseInt(part.slice(0, -1), 10);
          const unit = part.slice(-1);
          if (unit === 'h') {
            totalMinutes += value * 60;
          } else if (unit === 'm') {
            totalMinutes += value;
          }
        });
      }
    }

    return totalMinutes;
  }

  // Helper function to calculate travel time between two locations (in minutes)
  // Uses geolib for distance and assumes an average walking speed
  private async calculateTravelTime(location1: Location, location2: Location, travelMode: 'walking' | 'driving'): Promise<number> {
    if (!location1?.latitude || !location1?.longitude || !location2?.latitude || !location2?.longitude) {
        return 0; // Cannot calculate travel time without valid locations
    }

    // geolib.getDistance takes positions as { latitude: number, longitude: number }
    const pos1 = { latitude: location1.latitude, longitude: location1.longitude };
    const pos2 = { latitude: location2.latitude, longitude: location2.longitude };

    // For a free solution, we'll only implement walking time estimation
    if (travelMode === 'walking') {
        try {
            const distanceMeters = getDistance(pos1, pos2);
             // Calculate time in minutes = Distance (meters) / Speed (meters/minute)
            const travelTimeMinutes = distanceMeters / this.averageWalkingSpeedMetersPerMinute;
            return Math.ceil(travelTimeMinutes); // Return rounded up minutes
        } catch (error) {
            this.logger.error(`Error calculating walking distance between ${location1} and ${location2}:`, error);
            return 30; // Return a default value in case of error (e.g., 30 minutes)
        }
    } else if (travelMode === 'driving') {
        // Placeholder for driving time - requires external service integration (e.g., Google Distance Matrix API)
         this.logger.warn("Driving time calculation is not implemented in the free version.");
        return 0; // Or a default value
    }

    return 0; // Default return for unsupported travel modes
  }

  // Helper function to check if an event is within its opening hours at a given time
  private isWithinOpeningHours(event: CalendarEvent | SidebarEvent, time: Date): boolean {
    // This is a placeholder implementation. Needs to be fully implemented
    // based on the structure of event.openingHours and handling different scenarios.
    // - Check the day of the week of the given time.
    // - Find the opening hours for that day in event.openingHours.
    // - Handle cases where opening hours are not available or specify 24/7.
    // - Parse start and end times from opening hours (handle different formats like "HH:mm", "HHMM").
    // - Check if the given time falls within any of the defined opening periods for the day.

    // Temporarily ignoring opening hours check as requested for debugging
    this.logger.log(`Temporarily ignoring opening hours check for ${event.title}. Returning true.`);
    return true; // Always return true to bypass the check
  }

  // Helper function to group activities by geographical area
  private async groupActivitiesByArea(activities: SidebarEvent[], hotelLocation?: Location): Promise<SidebarEvent[][]> {
    // This is a complex task requiring distance calculations and clustering logic.
    // Placeholder implementation: Group activities that are within a certain walking distance of each other.
    // A more sophisticated approach would use proper clustering algorithms.

    const groups: SidebarEvent[][] = [];
    let ungroupedActivities = [...activities];
    const groupingThresholdMinutes = 30; // Activities within 30 walking minutes are grouped

    while (ungroupedActivities.length > 0) {
      const currentActivity = ungroupedActivities.shift(); // Take the first ungrouped activity
      if (!currentActivity) continue;

      const currentGroup: SidebarEvent[] = [currentActivity];
      const currentActivityLocation = currentActivity.location;

      if (currentActivityLocation) {
        // Find other ungrouped activities that are close to the current activity
        const closeActivitiesIndices = ungroupedActivities.map((activity, index) => ({
            activity,
            index,
            location: activity.location
        }))
        .filter(item => item.location)
        .map(async item => { // Use async for calculateTravelTime
            const travelTime = await this.calculateTravelTime(currentActivityLocation, item.location!, 'walking');
             return { ...item, travelTime };
        });

        const resolvedCloseActivities = await Promise.all(closeActivitiesIndices);

        const trulyCloseActivities = resolvedCloseActivities.filter(item => item.travelTime <= groupingThresholdMinutes);

        // Add close activities to the current group and remove them from ungrouped
        trulyCloseActivities.sort((a, b) => a.travelTime - b.travelTime) // Schedule closer ones first within a group
            .forEach(item => {
                currentGroup.push(item.activity);
                 // Remove from ungroupedActivities using the original index (need to adjust indices after shifts/splices)
                 // A safer way is to build a new ungrouped list.
            });

         // Build the new ungrouped list by filtering out activities added to the current group
         const currentGroupIds = new Set(currentGroup.map(act => act.id));
         let nextUngrouped: SidebarEvent[] = [];
         for (const activity of ungroupedActivities) {
             if (!currentGroupIds.has(activity.id)) {
                 nextUngrouped.push(activity);
             }
         }
         ungroupedActivities = nextUngrouped;
      }

      groups.push(currentGroup);
    }

    return groups;
  }

  // Helper function to schedule meal times and select restaurants
  private async scheduleMeal(daySchedule: CalendarEvent[], currentTime: Date, mealType: 'breakfast' | 'lunch' | 'dinner', unscheduledActivities: SidebarEvent[], lastActivityLocation: Location | undefined): Promise<{ updatedSchedule: CalendarEvent[], newCurrentTime: Date, usedActivities: SidebarEvent[], scheduledMealEvents: CalendarEvent[] }> {
    // This is a complex function with several rules.
    // Placeholder implementation:
    this.logger.log(`Attempting to schedule ${mealType} at ${currentTime.toLocaleTimeString()}`);

    const mealDuration = this.defaultMealDurations[mealType];
    const bufferMinutes = this.defaultBufferMinutes;
    let mealEndTime = new Date(currentTime.getTime() + mealDuration * 60000);

    // Determine meal time window (simplified placeholder)
    let mealTimeWindowStart = new Date(currentTime);
    let mealTimeWindowEnd = new Date(currentTime.getTime() + 3 * 60 * 60000); // Example: 3-hour window

    // Adjust window based on meal type (more specific times needed)
    if (mealType === 'breakfast') { /* e.g., 07:00 - 10:00 */ }
    if (mealType === 'lunch') { /* e.g., 12:00 - 14:00 */ }
    if (mealType === 'dinner') { /* e.g., 19:00 - 22:00 */ }

    // Ensure meal fits within the day's end time
    const dayEndTime = new Date(currentTime);
    dayEndTime.setHours(23, 0, 0, 0); // Assuming 23:00 day end
    if (mealEndTime.getTime() > dayEndTime.getTime()) {
         this.logger.log(`${mealType} does not fit before day end.`);
        return { updatedSchedule: daySchedule, newCurrentTime: currentTime, usedActivities: [], scheduledMealEvents: [] }; // Cannot schedule meal
    }

    // Find suitable restaurants (or food-related activities) from unscheduled list
    let potentialRestaurants = unscheduledActivities.filter(activity =>
        activity.category === 'restaurants' || activity.category === 'food' // Filter by category
        // Add more filtering: preferred time, check if already scheduled today (if multiple options logic applied)
    );

     // Filter by priority 1 or 10 and sort by distance if lastActivityLocation is available
     if (lastActivityLocation) {
         potentialRestaurants = await Promise.all(potentialRestaurants.map(async rest => {
             const distance = await this.calculateTravelTime(lastActivityLocation, rest.location!, 'walking'); // Calculate walking time
             return { ...rest, distance };
         }));
         potentialRestaurants.sort((a, b) => {
             // Prioritize 1 and 10, then sort by distance
             const isAPriority = a.priority === 1 || a.priority === 10;
             const isBPriority = b.priority === 1 || b.priority === 10;

             if (isAPriority && !isBPriority) return -1;
             if (!isAPriority && isBPriority) return 1;
             if (isAPriority && isBPriority) return (a as any).distance - (b as any).distance; // Both priority, sort by distance
             return (a as any).distance - (b as any).distance; // Neither priority, sort by distance
         });
     } else {
         // If no last location, just sort by priority
         potentialRestaurants.sort((a, b) => (a.priority || Infinity) - (b.priority || Infinity));
     }

    const scheduledMealEvents: CalendarEvent[] = [];
    const usedRestaurants: SidebarEvent[] = [];
    const maxMealOptions = 2; // Schedule up to 2 options if available and conditions met

    // Select and schedule restaurant(s)
     for (let i = 0; i < Math.min(potentialRestaurants.length, maxMealOptions); i++) {
         const restaurant = potentialRestaurants[i];

         // Check if this restaurant (if priority 1 or 10) has already been scheduled as a multi-option today
         // This logic needs a way to track which restaurants were scheduled as multi-options on which day
         const alreadyScheduledAsMultiOptionToday = false; // Placeholder

         // Schedule if it's the first option OR (it's a priority 1/10 and hasn't been scheduled as multi-option today)
         if (i === 0 || ((restaurant.priority === 1 || restaurant.priority === 10) && !alreadyScheduledAsMultiOptionToday)) {
              const mealEvent: CalendarEvent = {
                ...restaurant, // Copy properties
                start: currentTime.toISOString(),
                end: mealEndTime.toISOString(),
                allDay: false,
                title: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${restaurant.title}`, // Example title
                className: `meal ${mealType} priority-${restaurant.priority}`, // Add classes
              };

              scheduledMealEvents.push(mealEvent);
              usedRestaurants.push(restaurant);
              // Mark this restaurant as scheduled as a multi-option for today if applicable
              // Need a mechanism to track this across days/calls
         } else {
              // Skip scheduling this restaurant for now based on multi-option rule
              this.logger.log(`Skipping ${restaurant.title} for ${mealType} today based on multi-option rule.`);
         }

         // For simplicity in this placeholder, we only schedule the first found restaurant
         if (i === 0 && scheduledMealEvents.length > 0) break; // Schedule only the first for now
     }

    if (scheduledMealEvents.length > 0) {
         // Assuming we only scheduled one meal event for simplicity initially
         const scheduledMeal = scheduledMealEvents[0];
        mealEndTime = new Date(scheduledMeal.end as string); // Update mealEndTime based on scheduled event
        const nextSlotStartTime = new Date(mealEndTime.getTime() + bufferMinutes * 60000);
        const newCurrentTime = nextSlotStartTime;
        const newLastActivityLocation = scheduledMeal.location;

        return { updatedSchedule: daySchedule.concat(scheduledMealEvents), newCurrentTime, usedActivities: usedRestaurants, scheduledMealEvents };
    }

    return { updatedSchedule: daySchedule, newCurrentTime: currentTime, usedActivities: [], scheduledMealEvents: [] }; // No meal scheduled
  }
} 