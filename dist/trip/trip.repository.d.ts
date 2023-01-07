import { Repository } from "typeorm";
import { CreateTripDto } from "./dto/create-trip-dto";
import { UpdateTripDto } from "./dto/update-trip-dto";
import { ListTripsDto } from "./dto/list-trips-dto";
import { Trip } from "./trip.entity";
import { User } from "../user/user.entity";
export declare class TripRepository extends Repository<Trip> {
    private logger;
    createTrip(createTripDto: CreateTripDto, user: User): Promise<Trip>;
    upsertTrip(createTripDto: CreateTripDto, user: User): Promise<Trip>;
    updateTrip(updateTripDto: UpdateTripDto, trip: Trip, user: User): Promise<Trip>;
    getTrips(filterDto: ListTripsDto, user: User): Promise<Trip[]>;
    _getTripByName(name: string, user: User): Promise<Trip>;
}
