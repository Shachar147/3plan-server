import { Repository } from 'typeorm';
import { CreateTripDto } from './dto/create-trip-dto';
import { UpdateTripDto } from './dto/update-trip-dto';
import { ListTripsDto } from './dto/list-trips-dto';
import { Trip } from './trip.entity';
export declare class TripRepository extends Repository<Trip> {
    private logger;
    createTrip(createTripDto: CreateTripDto): Promise<Trip>;
    upsertTrip(createTripDto: CreateTripDto): Promise<Trip>;
    updateTrip(updateTripDto: UpdateTripDto, trip: Trip): Promise<Trip>;
    getTrips(filterDto: ListTripsDto): Promise<Trip[]>;
    _getTripByName(name: any): Promise<Trip>;
}
