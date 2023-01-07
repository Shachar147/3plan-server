import { ListTripsDto } from './dto/list-trips-dto';
import { CreateTripDto } from './dto/create-trip-dto';
import { UpdateTripDto } from './dto/update-trip-dto';
import { TripRepository } from './trip.repository';
import { User } from "../user/user.entity";
export declare class TripService {
    private tripRepository;
    private logger;
    constructor(tripRepository: TripRepository);
    getTrips(filterDto: ListTripsDto, user: User): Promise<import("./trip.entity").Trip[]>;
    getTrip(id: number, user: User): Promise<import("./trip.entity").Trip>;
    getTripByNameFull(name: string): Promise<import("./trip.entity").Trip>;
    getTripByName(name: string, user: User): Promise<import("./trip.entity").Trip>;
    createTrip(createTripDto: CreateTripDto, user: User): Promise<import("./trip.entity").Trip>;
    upsertTrip(createTripDto: CreateTripDto, user: User): Promise<import("./trip.entity").Trip>;
    updateTrip(id: number, updateTripDto: UpdateTripDto, user: User): Promise<import("./trip.entity").Trip>;
    updateTripByName(name: string, updateTripDto: UpdateTripDto, user: User): Promise<import("./trip.entity").Trip>;
    deleteTrip(id: number, user: User): Promise<import("typeorm").DeleteResult>;
    deleteTripByName(name: string, user: User): Promise<import("typeorm").DeleteResult>;
}
