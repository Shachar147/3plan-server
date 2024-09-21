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
    const { place, photo, other_photos = '[]', is_poi = false } = createDto;

    const record = this.create();
    record.place = place;
    record.photo = photo;
    record.other_photos = other_photos;
    record.is_poi = is_poi;

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

    async getExistingPOIs(searchKeywords: string[], user: User): Promise<Record<string, string>> {
        const query = this.createQueryBuilder('places_photos');

        query
            .select(['places_photos.place', 'places_photos.photo', 'places_photos.is_poi'])
            .where('places_photos.place IN (:...searchKeywords)', { searchKeywords }) // Use IN operator for search keywords
            .andWhere('places_photos.is_poi = :is_poi', { is_poi: true }) // Ensure is_poi is true
            .orderBy('places_photos.id', 'ASC'); // Optional ordering

        try {
            const records = await query.getMany();

            // Return the desired format (place -> image)
            const result: Record<string, string> = {};
            records.forEach((record) => {
                if (searchKeywords.includes(record.place) && record.is_poi) {
                    result[record.place] = record.photo;
                }
            })
            return result;
        } catch (error) {
            this.logger.error(
                `Failed to get records. Keywords: ${JSON.stringify(searchKeywords)}`,
                error.stack,
            );
            throw new InternalServerErrorException();
        }
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
