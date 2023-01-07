import { ListTripsDto } from './dto/list-trips-dto';
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip-dto';
import { UpdateTripDto } from './dto/update-trip-dto';
import { Trip } from './trip.entity';
import { DeleteResult } from 'typeorm';
import { User } from "../user/user.entity";
export declare class TripController {
    private tripService;
    constructor(tripService: TripService);
    getTrips(filterDto: ListTripsDto, user: User): Promise<{
        total: number;
        data: Trip[];
    }>;
    getTrip(id: any, user: User): Promise<Trip>;
    getTripByName(name: any, user: User): Promise<Trip>;
    createTrip(createTripDto: CreateTripDto, user: User): Promise<Trip>;
    upsertTrip(createTripDto: CreateTripDto, user: User): Promise<Trip>;
    updateTrip(id: any, updateTripDto: UpdateTripDto, user: User): Promise<Trip>;
    updateTripByName(name: any, updateTripDto: UpdateTripDto, user: User): Promise<Trip>;
    deleteTrip(id: any, user: User): Promise<DeleteResult>;
    deleteTripByName(name: any, user: User): Promise<DeleteResult>;
}
