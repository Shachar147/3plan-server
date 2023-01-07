import { EntityRepository, Repository } from "typeorm";
import { CreateTripDto } from "./dto/create-trip-dto";
import { UpdateTripDto } from "./dto/update-trip-dto";
import { ListTripsDto } from "./dto/list-trips-dto";
import {
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Trip } from "./trip.entity";
import { User } from "../user/user.entity";

@EntityRepository(Trip)
export class TripRepository extends Repository<Trip> {
  private logger = new Logger("TripRepository");

  async createTrip(createTripDto: CreateTripDto, user: User): Promise<Trip> {
    const {
      name,
      dateRange,
      categories,
      calendarEvents,
      sidebarEvents,
      allEvents,
      calendarLocale,
    } = createTripDto;
    const trip = new Trip();
    trip.name = name;
    trip.dateRange = dateRange;
    trip.categories = categories;
    trip.calendarEvents = calendarEvents;
    trip.sidebarEvents = sidebarEvents;
    trip.allEvents = allEvents;
    trip.calendarLocale = calendarLocale;
    trip.user = user;

    try {
      await trip.save();
    } catch (error) {
      if (Number(error.code) === 23505) {
        // duplicate trip name
        throw new ConflictException("Trip already exists");
      } else {
        throw new InternalServerErrorException();
      }
    }

    return trip;
  }

  async upsertTrip(createTripDto: CreateTripDto, user: User): Promise<Trip> {
    const { name } = createTripDto;
    const query = this.createQueryBuilder("trip");
    query.andWhere("trip.name = :name", { name });
    query.andWhere("(trip.userId = :userId)", {
      userId: user.id,
    });
    const trips = await query.getMany();
    if (trips.length == 0) return await this.createTrip(createTripDto, user);
    else return await this.updateTrip(createTripDto, trips[0], user);
  }

  async updateTrip(
    updateTripDto: UpdateTripDto,
    trip: Trip,
    user: User
  ): Promise<Trip> {
    const {
      name,
      dateRange,
      categories,
      calendarEvents,
      sidebarEvents,
      allEvents,
      calendarLocale,
    } = updateTripDto;
    if (name) trip.name = name;
    if (dateRange) trip.dateRange = dateRange;
    if (categories) trip.categories = categories;
    if (calendarEvents) trip.calendarEvents = calendarEvents;
    if (sidebarEvents) trip.sidebarEvents = sidebarEvents;
    if (allEvents) trip.allEvents = allEvents;
    if (calendarLocale) trip.calendarLocale = calendarLocale;
    if (user) trip.user = user;

    trip.lastUpdateAt = new Date();

    try {
      await trip.save();
    } catch (error) {
      if (Number(error.code) === 23505) {
        // duplicate trip name
        throw new ConflictException("Trip already exists");
      } else {
        throw new InternalServerErrorException();
      }
    }

    return trip;
  }

  async getTrips(filterDto: ListTripsDto, user: User): Promise<Trip[]> {
    const { search } = filterDto;

    const query = this.createQueryBuilder("trip");

    if (search)
      query.where("(trip.name LIKE :search)", { search: `%${search}%` });
    // if (name) query.andWhere('trip.name = :name', { name });
    // if (division) query.andWhere('trip.division = :division', { division });
    // if (conference)
    //   query.andWhere('trip.conference = :conference', { conference });
    //
    // if (id) query.andWhere('trip.id = :id', { id });
    //
    // if (_2k_rating)
    //   query.andWhere('trip._2k_rating = :_2k_rating', {
    //     _2k_rating,
    //   });
    // query.leftJoinAndSelect('trip.players', 'player');
    // query.leftJoinAndSelect('trip.allstar_players', 'player p');

    query.andWhere("(trip.userId = :userId)", {
      userId: user.id,
    });

    try {
      const trips = await query.getMany();
      return trips;
    } catch (error) {
      this.logger.error(
        `Failed to get trips . Filters: ${JSON.stringify(filterDto)}"`,
        error.stack
      );
      throw new InternalServerErrorException();
    }
  }

  async _getTripByName(name: string, user: User) {
    return await this.createQueryBuilder("trip")
      .where("LOWER(trip.name) = LOWER(:name)", { name })
      .andWhere("(trip.userId = :userId)", {
        userId: user.id,
      })
      .getOne();
  }
}
