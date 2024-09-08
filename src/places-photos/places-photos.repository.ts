import { EntityRepository, Repository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  Logger
} from "@nestjs/common";
import { CreateDto } from './dto/create-dto';
import { ListDto } from "./dto/list-dto";
import { PlacesPhotos } from './places-photos.entity';
import { UpdateDto } from "./dto/update-dto";
import {User} from "../user/user.entity";

@EntityRepository(PlacesPhotos)
export class PlacesPhotosRepository extends Repository<PlacesPhotos> {
  private logger = new Logger('PlacesPhotosRepository');

  async createRecord(
    createDto: CreateDto,
    user: User,
  ): Promise<PlacesPhotos> {
    const { place, photo, other_photos } = createDto;

    const record = this.create();
    record.place = place;
    record.photo = photo;
    record.other_photos = other_photos;

    try {
      await record.save();
    } catch (error) {
      if (Number(error.code) === 23505) {
        // duplicate team name
        throw new ConflictException('Record already exists');
      } else {
        console.error(`Error: ${error}`);
        throw new InternalServerErrorException();
      }
    }

    return record;
  }

  async updateRecord(record: PlacesPhotos, updateDto: UpdateDto) {

    const { place, photo, other_photos } = updateDto;

    record.place = place;
    record.photo = photo;
    record.other_photos = other_photos;

    try {
      await record.save();
    } catch (error) {
      console.error(`Error: ${error}`);
      throw new InternalServerErrorException();
    }

    return record;
  }
  
  async listRecords(filterDto: ListDto, user: User) {
    const { place } = filterDto;

    const query = this.createQueryBuilder('places_photos');

    if (place) query.andWhere('(places_photos.place = :place)', { place });

   query.orderBy('places_photos.id','ASC');

    try {
      const records = await query.getMany();
      return records;
    } catch (error) {
      this.logger.error(
        `Failed to get records . Filters: ${JSON.stringify(filterDto)}"`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
