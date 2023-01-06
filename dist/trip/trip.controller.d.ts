import { ListTripsDto } from './dto/list-trips-dto';
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip-dto';
import { UpdateTripDto } from './dto/update-trip-dto';
import { Trip } from './trip.entity';
import { DeleteResult } from 'typeorm';
export declare class TripController {
    private tripService;
    constructor(tripService: TripService);
    getTrips(filterDto: ListTripsDto): Promise<{
        total: number;
        data: Trip[];
    }>;
    getTrip(id: any): Promise<Trip>;
    createTrip(createTripDto: CreateTripDto): Promise<Trip>;
    upsertTrip(createTripDto: CreateTripDto): Promise<Trip>;
    updateTrip(id: any, updateTripDto: UpdateTripDto): Promise<Trip>;
    updateTripByName(name: any, updateTripDto: UpdateTripDto): Promise<Trip>;
    deleteTrip(id: any): Promise<DeleteResult>;
    deleteTripByName(name: any): Promise<DeleteResult>;
}
