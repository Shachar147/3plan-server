// Defining interfaces used across trip-related modules

export interface Coordinate { lat: number; lng: number; }

export interface Location {
  latitude?: number;
  longitude?: number;
  address?: string;
  eventName?: string;
}

export interface DateRangeFormatted { start: string; end: string; }

export interface CalendarEvent {
  id: string | number;
  title: string;
  start?: string | Date;
  end?: string | Date;
  allDay?: boolean;
  className?: string;
  location?: Location;
  openingHours?: any; // Define a more specific interface if possible
  duration?: string;
  priority?: number; // Assuming a numerical priority
  preferredTime?: string; // Assuming a string enum or similar
  category?: number | string; // Assuming category can be ID or name
  images?: string[];
  price?: number;
  currency?: string;
  moreInfo?: string;
  timingError?: string;
  suggestedEndTime?: Date;
}

export interface SidebarEvent {
  id: string | number;
  title: string;
  icon?: string;
  duration?: string;
  priority?: number; // Assuming a numerical priority
  preferredTime?: string; // Assuming a string enum or similar
  description?: string;
  location?: Location;
  openingHours?: any; // Define a more specific interface if possible
  images?: string[];
  price?: number;
  currency?: string;
  moreInfo?: string;
  category?: number | string; // Assuming category can be ID or name
  // Note: Sidebar events typically don't have start/end dates initially
}

export interface TriPlanCategory {
  id: number;
  title: string;
  icon: string;
  description?: string;
  titleKey?: string;
}

// Add any other relevant interfaces from your Trip entity here if needed,
// to ensure type safety when accessing properties of the fetched Trip object. 