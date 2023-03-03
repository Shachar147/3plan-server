import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  HttpService,
} from "@nestjs/common";
import { ListTripsDto } from "./dto/list-trips-dto";
import { CreateTripDto } from "./dto/create-trip-dto";
import { UpdateTripDto } from "./dto/update-trip-dto";
import { TripRepository } from "./trip.repository";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../user/user.entity";
import {DuplicateTripDto} from "./dto/duplicate-trip-dto";
import {BackupsService} from "../backups/backups.service";
import { Request } from 'express';

@Injectable()
export class TripService {
  private logger = new Logger("TripService");
  constructor(
    @InjectRepository(TripRepository)
    private tripRepository: TripRepository,
    private backupsService: BackupsService,
  ) {

  }

  async getTrips(filterDto: ListTripsDto, user: User) {
    return await this.tripRepository.getTrips(filterDto, user);
  }

  async getTrip(id: number, user: User) {
    const found = await this.tripRepository.findOne(id);
    if (!found || (found && found.user.id !== user.id)) {
      throw new NotFoundException(`Trip with id #${id} not found`);
    }
    return found;
  }

  async getTripByNameFull(name: string) {
    const found = await this.tripRepository.findOne({ name: name });
    if (!found) {
      throw new NotFoundException(`Trip with name ${name} not found`);
    }
    return found;
  }

  async getTripByName(name: string, user: User) {
    // debug - simulate long load
    // await new Promise(r => setTimeout(r, 10000)); // todo remove

    // const found = await this.tripRepository.createQueryBuilder('trip').where("LOWER(trip.name) = LOWER(:name)", { name }).leftJoinAndSelect('trip.players', 'player').getOne();

    let found = await this.tripRepository._getTripByName(name, user);
    if (!found) {

      name.replace(/-/ig," ");
      found = await this.tripRepository._getTripByName(name, user);

      if (!found) {
        const lsName = name.replace(/\s/ig, "-")

        const lsNameFound = await this.tripRepository._getTripByName(lsName, user);
        if (!lsNameFound) {
          throw new NotFoundException(`Trip with name ${name} not found`);
        }
        return lsNameFound
      }
    }
    return found;
  }

  async createTrip(createTripDto: CreateTripDto, user: User, request: Request) {
    // // validation
    // ['name', 'logo', 'division', 'conference'].forEach((iter) => {
    //   if (createTripDto[iter] == undefined) {
    //     throw new BadRequestException(`${iter} : missing`);
    //   }
    // });
    return await this.tripRepository.createTrip(createTripDto, user, request, this.backupsService);
  }

  async upsertTrip(createTripDto: CreateTripDto, user: User, request: Request) {
    const { name } = createTripDto;

    if (!name) {
      throw new BadRequestException("name : missing");
    }

    return await this.tripRepository.upsertTrip(createTripDto, user, request, this.backupsService);
  }

  async updateTrip(id: number, updateTripDto: UpdateTripDto, user: User, request: Request) {
    const trip = await this.getTrip(id, user);

    // if (
    //   !updateTripDto.name &&
    //   !updateTripDto.logo &&
    //   !updateTripDto.division &&
    //   !updateTripDto.conference
    // ) {
    //   throw new NotFoundException(`You have to pass fields to update`);
    // }

    return this.tripRepository.updateTrip(updateTripDto, trip, user, request, this.backupsService);
  }

  async updateTripByName(
    name: string,
    updateTripDto: UpdateTripDto,
    user: User,
    request: Request
  ) {
    const trip = await this.getTripByName(name, user);

    // if (
    //   !updateTripDto.name &&
    //   !updateTripDto.logo &&
    //   !updateTripDto.division &&
    //   !updateTripDto.conference
    // ) {
    //   throw new NotFoundException(`You have to pass fields to update`);
    // }

    return this.tripRepository.updateTrip(updateTripDto, trip, user, request, this.backupsService);
  }

  async deleteTrip(id: number, user: User, request: Request) {
    const trip = await this.getTrip(id, user);
    if (!trip) {
      throw new NotFoundException(`Trip with id #${id} not found`);
    }

    // backup
    await this.tripRepository.keepBackup({id}, trip, request, user, this.backupsService)

    const result = await this.tripRepository.delete({ id: id });
    if (result.affected === 0) {
      throw new NotFoundException(`Trip with id #${id} not found`);
    }
    return result;
  }

  async deleteTripByName(name: string, user: User, request: Request) {
    const trip = await this.getTripByName(name, user);
    if (!trip) {
      throw new NotFoundException(`Trip with name ${name} not found`);
    }
    const result = await this.tripRepository.delete({ name: name });
    if (result.affected === 0) {
      throw new NotFoundException(`Trip with name "${name}" not found`);
    }
    return result;
  }

  async duplicateTripByName(name: string, duplicateTripDto: DuplicateTripDto, user:User, request: Request) {
    const trip = await this.getTripByName(name, user);
    if (!trip) {
      throw new NotFoundException(`Trip with name ${name} not found`);
    }

    await this.tripRepository.duplicateTripByName(trip, duplicateTripDto, user, request, this.backupsService);
    return await this.getTripByName(duplicateTripDto.newName, user);
  }
}
