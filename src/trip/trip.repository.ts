import { EntityRepository, Repository } from "typeorm";
import { CreateTripDto } from "./dto/create-trip-dto";
import { UpdateTripDto } from "./dto/update-trip-dto";
import { ListTripsDto } from "./dto/list-trips-dto";
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger, NotFoundException,
} from "@nestjs/common";
import { Trip } from "./trip.entity";
import { User } from "../user/user.entity";
import { DuplicateTripDto } from "./dto/duplicate-trip-dto";
import { CreateBackupDto } from "../backups/dto/create-backup-dto";
import { BackupsService } from "../backups/backups.service";
import { Request } from "express";

@Injectable()
@EntityRepository(Trip)
export class TripRepository extends Repository<Trip> {
  private logger = new Logger("TripRepository");

  async keepBackup(
    dto: any,
    trip: Trip,
    request: Request,
    user: User,
    backupsService: BackupsService
  ) {

    // commented out for now since it may causing issues on production.
    return undefined;

    // do not keep small backups
    if (Object.keys(dto).length == 1) {
      const key = Object.keys(dto)[0];
      if (["calendarLocale", "dateRange"].indexOf(key) !== -1) {
        return; // skip
      }
    }

    // backup
    const backupDto: CreateBackupDto = {
      tripBackup: JSON.parse(JSON.stringify(trip)),
      tripId: trip.id,
      requestPayload: JSON.parse(JSON.stringify(dto)),
      requestUrl: request.url,
      requestMethod: request.method,
    };

    return await backupsService.createBackup(backupDto, user);
  }

  async createTrip(
    createTripDto: CreateTripDto,
    user: User,
    request: Request,
    backupsService: BackupsService
  ): Promise<Trip> {
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
    await this.keepBackup(createTripDto, trip, request, user, backupsService);

    return trip;
  }

  async upsertTrip(
    createTripDto: CreateTripDto,
    user: User,
    request: Request,
    backupsService: BackupsService
  ): Promise<Trip> {
    const { name } = createTripDto;
    const query = this.createQueryBuilder("trip");
    query.andWhere("trip.name = :name", { name });
    query.andWhere("(trip.userId = :userId)", {
      userId: user.id,
    });
    const trips = await query.getMany();
    if (trips.length == 0)
      return await this.createTrip(
        createTripDto,
        user,
        request,
        backupsService
      );
    else
      return await this.updateTrip(
        createTripDto,
        trips[0],
        user,
        request,
        backupsService
      );
  }

  async updateTrip(
    updateTripDto: Partial<UpdateTripDto>,
    trip: Trip,
    user: User,
    request: Request,
    backupService: BackupsService
  ): Promise<Trip> {
    const {
      name,
      dateRange,
      categories,
      calendarEvents,
      sidebarEvents,
      allEvents,
      calendarLocale,
      isLocked,
      isHidden
    } = updateTripDto;

    // backup
    await this.keepBackup(updateTripDto, trip, request, user, backupService);

    const updates: any = {};

    if (name) updates.name = name;
    if (dateRange) updates.dateRange = dateRange;
    if (categories) updates.categories = categories;
    if (calendarEvents) updates.calendarEvents = calendarEvents;
    if (sidebarEvents) updates.sidebarEvents = sidebarEvents;
    if (allEvents) updates.allEvents = allEvents;
    if (calendarLocale) updates.calendarLocale = calendarLocale;
    if (user) updates.user = user;
    if (isLocked != undefined) updates.isLocked = isLocked;
    if (isHidden != undefined) updates.isHidden = isHidden;
    updates.lastUpdateAt = new Date();

    const queryBuilder = this.createQueryBuilder('trip');
    await queryBuilder
        .update(Trip)
        .set(updates)
        .where('id = :id', { id: trip.id })
        .execute();

    trip = await this._getTripByName(trip.name, user)

    return trip;
  }

  async getAllTripsByPass(){
    const query = this.createQueryBuilder("trip");
    const trips = await query.getMany();
    return trips;
  }

  async getTrips(filterDto: ListTripsDto, user: User): Promise<Trip[]> {
    const { search } = filterDto;

    const query = this.createQueryBuilder("trip");

    if (search)
      query.where("(trip.name LIKE :search)", { search: `%${search}%` });
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

  async getTripsShort(filterDto: ListTripsDto, user: User): Promise<Trip[]> {
    const { search } = filterDto;

    const query = this.createQueryBuilder("trip")
        .select(["trip.id", "trip.name", "trip.dateRange", "trip.lastUpdateAt", "trip.createdAt", "trip.isHidden"]); // Specify the columns we want to select

    if (search)
      query.where("(trip.name LIKE :search)", { search: `%${search}%` });
    query.andWhere("(trip.userId = :userId)", {
      userId: user.id,
    });

    try {
      const trips = await query.getMany();
      trips.map((x) => x.lastUpdateAt = x.lastUpdateAt ?? x.createdAt)
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
    const findOne = async (name: string, user: User) => {
      return await this.createQueryBuilder("trip")
          .where("LOWER(trip.name) = LOWER(:name)", {name})
          .andWhere("(trip.userId = :userId)", {
            userId: user.id,
          })
          .getOne();
    }

    let found = await findOne(name, user);
    if (!found) {

      name = name.replace(/\-/ig," ");
      found = await findOne(name, user);

      if (!found) {
        const lsName = name.replace(/\s/ig, "-")

        const lsNameFound = await findOne(lsName, user);
        if (!lsNameFound) {
          throw new NotFoundException(`Trip with name ${name} not found`);
        }
        return lsNameFound
      }
    }
    return found;
  }

  async duplicateTripByName(
    oldTrip: Trip,
    duplicateTripDto: DuplicateTripDto,
    user: User,
    request: Request,
    backupsService: BackupsService
  ) {
    return await this.createTrip(
      {
        name: duplicateTripDto.newName,
        allEvents: oldTrip.allEvents,
        calendarEvents: oldTrip.calendarEvents,
        sidebarEvents: oldTrip.sidebarEvents,
        calendarLocale: oldTrip.calendarLocale,
        categories: oldTrip.categories,
        dateRange: oldTrip.dateRange,
      },
      user,
      request,
      backupsService
    );
  }
}
