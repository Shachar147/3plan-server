import {
    IsArray,
    IsEnum,
    IsNotEmpty, IsNumber,
    IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {IsOptional} from "class-validator";

export enum TravelingWith {
    SPOUSE = 'SPOUSE',
    SOLO = 'SOLO',
    FRIENDS = 'FRIENDS',
    FAMILY = 'FAMILY'
}

export interface DateRangeFormatted {
    start: string;
    end: string;
}

export enum Budget {
    low = 'low',
    medium = 'medium',
    high = 'high'
}

export enum WonderPlanTravelingWith {
    solo = 'solo',
    couple = 'couple',
    family = 'family',
    friends = 'friends'
}

export enum WonderPlanActivityType {
    beaches = 'beaches',
    city_sightseeing = 'city_sightseeing',
    outdoor_adventures = 'outdoor_adventures',
    festivals_or_events = 'festivals_or_events',
    food_exploration = 'food_exploration',
    nightlife = 'nightlife',
    shopping = 'shopping',
    spa_wellness = 'spa_wellness'
}

export const ALL_ACTIVITY_TYPES = [
    WonderPlanActivityType.beaches,
    WonderPlanActivityType.city_sightseeing,
    WonderPlanActivityType.outdoor_adventures,
    WonderPlanActivityType.festivals_or_events,
    WonderPlanActivityType.food_exploration,
    WonderPlanActivityType.nightlife,
    WonderPlanActivityType.shopping,
    WonderPlanActivityType.spa_wellness
]

export function wonderPlanActivityTypeToActivityType(wonderPlanActivityType: WonderPlanActivityType): number | undefined {
    switch (wonderPlanActivityType) {
        case WonderPlanActivityType.beaches:
            return 1;
        case WonderPlanActivityType.city_sightseeing:
            return 2;
        case WonderPlanActivityType.outdoor_adventures:
            return 3;
        case WonderPlanActivityType.festivals_or_events:
            return 4;
        case WonderPlanActivityType.food_exploration:
            return 5;
        case WonderPlanActivityType.nightlife:
            return 6;
        case WonderPlanActivityType.shopping:
            return 7;
        case WonderPlanActivityType.spa_wellness:
            return 8;
        default:
            return undefined;
    }
}

export function budgetToBudgetType(budget: Budget): number {
    if (budget == Budget.low) {
        return 1;
    }
    else if (budget == Budget.medium) {
        return 2;
    }
    return 3;
}

export function wonderPlanTravelingWithToGroupType(wonderPlanTravelingWith: WonderPlanTravelingWith): number {
    switch (wonderPlanTravelingWith) {
        case WonderPlanTravelingWith.solo:
            return 1;
        case WonderPlanTravelingWith.couple:
            return 2;
        case WonderPlanTravelingWith.family:
            return 3;
        case WonderPlanTravelingWith.friends:
            return 4;
        default:
            return 1;
    }
}

export class CreateTripDto {
    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: destination',
    })
    // @Length(3, 255)
    @IsString()
    destination: string;

    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: dateRange',
    })
    dateRange: DateRangeFormatted

    // @ApiProperty({ required: true })
    // @IsNotEmpty({
    //     message: 'missing: travelingWith',
    // })
    // @IsEnum(TravelingWith)
    // travelingWith: TravelingWith;

    // @ApiProperty({ required: true })
    // @IsNotEmpty({
    //     message: 'missing: numberOfDays',
    // })
    // numberOfDays: number;

    // optional:
    // @IsOptional()
    // @ApiProperty({ required: false })
    // includeChildren?: boolean;
    //
    // @IsOptional()
    // @IsBoolean()
    // @ApiProperty({ required: false })
    // includePets?: boolean;

    // @IsOptional()
    // @IsArray()
    // @ApiProperty({ required: false })
    // interests?: string[]

    // @IsOptional()
    // @IsString()
    // @ApiProperty({ required: false })
    // currency?: 'USD' | 'ILS'

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false, default: 'he' })
    calendarLocale?: 'en' | 'he'

    @IsOptional()
    @IsEnum(Budget)
    @ApiProperty({ required: false, default: Budget.medium })
    budget?: Budget

    @IsOptional()
    @IsEnum(WonderPlanTravelingWith)
    @ApiProperty({ required: false, default: WonderPlanTravelingWith.solo })
    travelingWith?: WonderPlanTravelingWith;

    @IsOptional()
    @IsArray()
    @ApiProperty({ required: false, default: ALL_ACTIVITY_TYPES })
    activityTypes
}
