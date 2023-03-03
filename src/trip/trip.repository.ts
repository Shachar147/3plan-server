import { EntityRepository, Repository } from "typeorm";
import { CreateTripDto } from "./dto/create-trip-dto";
import { UpdateTripDto } from "./dto/update-trip-dto";
import { ListTripsDto } from "./dto/list-trips-dto";
import {
  ConflictException, Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { Trip } from "./trip.entity";
import { User } from "../user/user.entity";
import {DuplicateTripDto} from "./dto/duplicate-trip-dto";
import {CreateBackupDto} from "../backups/dto/create-backup-dto";
import {BackupsService} from "../backups/backups.service";
import { Request } from 'express';

@Injectable()
@EntityRepository(Trip)
export class TripRepository extends Repository<Trip> {
  private logger = new Logger("TripRepository");

  async keepBackup(dto: any, trip: Trip, request: Request, user: User, backupsService: BackupsService){

    // do not keep small backups
    if (Object.keys(dto).length == 1){
      const key = Object.keys(dto)[0];
      if (["calendarLocale", "dateRange"].indexOf(key) !== -1){
        return; // skip
      }
    }

    // backup
    const backupDto: CreateBackupDto = {
      tripBackup: JSON.parse(JSON.stringify(trip)),
      tripId: trip.id,
      requestPayload: JSON.parse(JSON.stringify(dto)),
      requestUrl: request.url,
      requestMethod: request.method
    }

    return await backupsService.createBackup(backupDto, user);
  }

  async createTrip(createTripDto: CreateTripDto, user: User, request: Request, backupsService: BackupsService): Promise<Trip> {
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

    // backup
    await this.keepBackup(createTripDto, trip, request, user, backupsService)

    return trip;
  }

  async upsertTrip(createTripDto: CreateTripDto, user: User, request: Request, backupsService: BackupsService): Promise<Trip> {
    const { name } = createTripDto;
    const query = this.createQueryBuilder("trip");
    query.andWhere("trip.name = :name", { name });
    query.andWhere("(trip.userId = :userId)", {
      userId: user.id,
    });
    const trips = await query.getMany();
    if (trips.length == 0) return await this.createTrip(createTripDto, user, request, backupsService);
    else return await this.updateTrip(createTripDto, trips[0], user, request, backupsService);
  }

  async updateTrip(
    updateTripDto: UpdateTripDto,
    trip: Trip,
    user: User,
    request: Request,
    backupService: BackupsService,
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

    // backup
    await this.keepBackup(updateTripDto, trip, request, user, backupService)

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

  async duplicateTripByName(oldTrip: Trip, duplicateTripDto: DuplicateTripDto, user: User, request: Request, backupsService: BackupsService) {
    return await this.createTrip({
      name: duplicateTripDto.newName,
      allEvents: oldTrip.allEvents,
      calendarEvents: oldTrip.calendarEvents,
      sidebarEvents: oldTrip.sidebarEvents,
      calendarLocale: oldTrip.calendarLocale,
      categories: oldTrip.categories,
      dateRange: oldTrip.dateRange
    }, user, request, backupsService)
    // const trip = new Trip();
    //
    // trip.name = duplicateTripDto.newName;
    // trip.allEvents = oldTrip.allEvents;
    // trip.calendarEvents = oldTrip.calendarEvents;
    // trip.sidebarEvents = oldTrip.sidebarEvents;
    // trip.dateRange = oldTrip.dateRange;
    // trip.categories = oldTrip.categories;
    // trip.calendarLocale = oldTrip.calendarLocale;
    //
    // try {
    //   await trip.save();
    // } catch (error) {
    //   if (Number(error.code) === 23505) {
    //     // duplicate trip name
    //     throw new ConflictException("Trip already exists");
    //   } else {
    //     throw new InternalServerErrorException();
    //   }
    }
}
