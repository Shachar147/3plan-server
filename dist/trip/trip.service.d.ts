import { ListTripsDto } from './dto/list-trips-dto';
import { CreateTripDto } from './dto/create-trip-dto';
import { UpdateTripDto } from './dto/update-trip-dto';
import { TripRepository } from './trip.repository';
export declare class TripService {
    private tripRepository;
    private logger;
    constructor(tripRepository: TripRepository);
    getTrips(filterDto: ListTripsDto): Promise<import("./trip.entity").Trip[]>;
    getTrip(id: number): Promise<import("./trip.entity").Trip>;
    getTripByNameFull(name: string): Promise<import("./trip.entity").Trip>;
    getTripByName(name: string): Promise<import("./trip.entity").Trip>;
    createTrip(createTripDto: CreateTripDto): Promise<import("./trip.entity").Trip>;
    upsertTrip(createTripDto: CreateTripDto): Promise<import("./trip.entity").Trip>;
    updateTrip(id: number, updateTripDto: UpdateTripDto): Promise<import("./trip.entity").Trip>;
    deleteTrip(id: number): Promise<import("typeorm").DeleteResult>;
    deleteTripByName(name: string): Promise<import("typeorm").DeleteResult>;
}
