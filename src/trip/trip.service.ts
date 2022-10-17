import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ListTripsDto } from './dto/list-trips-dto';
import { CreateTripDto } from './dto/create-trip-dto';
import { UpdateTripDto } from './dto/update-trip-dto';
import { TripRepository } from './trip.repository';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TripService {
  private logger = new Logger('TripService');
  constructor(
    @InjectRepository(TripRepository)
    private tripRepository: TripRepository,
  ) {}

  async getTrips(filterDto: ListTripsDto) {
    return await this.tripRepository.getTrips(filterDto);
  }

  async getTrip(id: number) {
    const found = await this.tripRepository.findOne(id);
    if (!found) {
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

  async getTripByName(name: string) {
    // const found = await this.tripRepository.createQueryBuilder('trip').where("LOWER(trip.name) = LOWER(:name)", { name }).leftJoinAndSelect('trip.players', 'player').getOne();
    const found = await this.tripRepository._getTripByName(name);
    if (!found) {
      throw new NotFoundException(`Trip with name ${name} not found`);
    }
    return found;
  }

  async createTrip(createTripDto: CreateTripDto) {
    // // validation
    // ['name', 'logo', 'division', 'conference'].forEach((iter) => {
    //   if (createTripDto[iter] == undefined) {
    //     throw new BadRequestException(`${iter} : missing`);
    //   }
    // });
    return await this.tripRepository.createTrip(createTripDto);
  }

  async upsertTrip(createTripDto: CreateTripDto) {
    const { name } = createTripDto;

    if (!name) {
      throw new BadRequestException('name : missing');
    }

    return await this.tripRepository.upsertTrip(createTripDto);
  }

  async updateTrip(id: number, updateTripDto: UpdateTripDto) {
    const trip = await this.getTrip(id);

    // if (
    //   !updateTripDto.name &&
    //   !updateTripDto.logo &&
    //   !updateTripDto.division &&
    //   !updateTripDto.conference
    // ) {
    //   throw new NotFoundException(`You have to pass fields to update`);
    // }

    return this.tripRepository.updateTrip(updateTripDto, trip);
  }

  async deleteTrip(id: number) {
    const result = await this.tripRepository.delete({ id: id });
    if (result.affected === 0) {
      throw new NotFoundException(`Trip with id #${id} not found`);
    }
    return result;
  }

  async deleteTripByName(name: string) {
    const result = await this.tripRepository.delete({ name: name });
    if (result.affected === 0) {
      throw new NotFoundException(`Trip with name "${name}" not found`);
    }
    return result;
  }
}
