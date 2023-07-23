import {EntityRepository, getRepository, Repository} from "typeorm";
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
import {SharedTrips} from "../shared-trips/shared-trips.entity";

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
    // if (user) updates.user = user; <- not working well on shared trips
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

  async getSharedTripsShort(filterDto: ListTripsDto, user: User): Promise<Trip[]> {
    const { search } = filterDto;

    const sharedTripRepository = getRepository(SharedTrips); // Access the SharedTrip repository directly
    const shared_query = sharedTripRepository.createQueryBuilder("shared-trips")
        .where("shared-trips.userId = :userId", { userId: user.id })
        .andWhere('shared-trips.isDeleted = :isDeleted', { isDeleted: false });
    const sharedTrips = await shared_query.getMany();
    const tripIds = sharedTrips.map((x) => x.tripId);

    if (tripIds.length == 0){
      return [];
    }

    // Specify the columns we want to select
    const shortColumns = ["trip.id", "trip.name", "trip.dateRange", "trip.lastUpdateAt", "trip.createdAt", "trip.isHidden"]

    const query = this.createQueryBuilder("trip")
        .select(shortColumns)
        .where('trip.id IN (:...ids)', { ids: tripIds }) // Use the IN keyword with :...ids to pass the array of ids

    if (search)
      query.andWhere("(trip.name LIKE :search)", { search: `%${search}%` });

    try {
      const trips = await query.getMany();
      trips.forEach((x) => {
        x.lastUpdateAt = x.lastUpdateAt ?? x.createdAt;
        // @ts-ignore
        x.canRead = sharedTrips.find((s) => s.tripId == x.id).canRead;

        // @ts-ignore
        x.canWrite = sharedTrips.find((s) => s.tripId == x.id).canWrite;
        return x;
      })
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

    // Specify the columns we want to select
    const shortColumns = ["trip.id", "trip.name", "trip.dateRange", "trip.lastUpdateAt", "trip.createdAt", "trip.isHidden"]

    const query = this.createQueryBuilder("trip")
        .select(shortColumns);

    query.where("(trip.userId = :userId)", {
      userId: user.id,
    });

    if (search)
      query.andWhere("(trip.name LIKE :search)", { search: `%${search}%` });

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

  async getSharedTrips(user: User) {
    const sharedTripRepository = getRepository(SharedTrips); // Access the SharedTrip repository directly
    const shared_query = sharedTripRepository.createQueryBuilder("shared-trips")
        .where("shared-trips.userId = :userId", { userId: user.id })
        .andWhere('shared-trips.isDeleted = :isDeleted', { isDeleted: false });
    return await shared_query.getMany(); // shared trips
  }

  async _getTripByName(name: string, user: User) {

    const sharedTrips = await this.getSharedTrips(user);

    const findOne = async (name: string, user: User, sharedTrips: SharedTrips[]) => {
      let trip = await this.createQueryBuilder("trip")
          .where("LOWER(trip.name) = LOWER(:name)", {name})
          .andWhere("(trip.userId = :userId)", {
            userId: user.id,
          })
          .getOne();

      if (!trip && sharedTrips.length > 0) {
        trip = await this.createQueryBuilder("trip")
            .where("LOWER(trip.name) = LOWER(:name)", {name})
            .where('trip.id IN (:...ids)', { ids: sharedTrips.map((x) => x.tripId) }) // Use the IN keyword with :...ids to pass the array of ids
            .getOne();

        // @ts-ignore
        trip?.canRead = sharedTrips.find((x) => x.tripId == trip.id)?.canRead ?? false;

        // @ts-ignore
        trip?.canWrite = sharedTrips.find((x) => x.tripId == trip.id)?.canWrite ?? false;
      }
      return trip;
    }

    let found = await findOne(name, user, sharedTrips);
    if (!found) {

      name = name.replace(/\-/ig," ");
      found = await findOne(name, user, sharedTrips);

      if (!found) {
        const lsName = name.replace(/\s/ig, "-")

        const lsNameFound = await findOne(lsName, user, sharedTrips);
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
