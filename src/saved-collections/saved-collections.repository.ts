import { EntityRepository, Repository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  Logger
} from "@nestjs/common";
import { CreateDto } from './dto/create-dto';
import { User } from '../user/user.entity';
import { ListDto } from "./dto/list-dto";
import { SavedCollections } from './saved-collections.entity';
import { UpdateDto } from "./dto/update-dto";

@EntityRepository(SavedCollections)
export class SavedCollectionsRepository extends Repository<SavedCollections> {
  private logger = new Logger('SavedCollectionsRepository');

  async createCollection(
    createDto: CreateDto,
    user: User,
  ): Promise<SavedCollections> {
    const { name, destination } = createDto;

    const record = this.create();
    record.name = name;
    record.destination = destination;
    record.user = user;

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

    delete record.user;

    return record;
  }

  async updateRecord(record: SavedCollections, updateDto: UpdateDto) {

    const { name, destination } = updateDto;

    record.name = name;
    record.destination = destination;

    try {
      await record.save();
    } catch (error) {
      console.error(`Error: ${error}`);
      throw new InternalServerErrorException();
    }

    return record;
  }
  
  async listRecords(filterDto: ListDto, user: User) {
    const { name, destination } = filterDto;

    const query = this.createQueryBuilder('saved_collections');

    if (name) query.andWhere('(saved_collections.name = :name)', { name });
    if (destination) query.andWhere('(saved_collections.destination = :destination)', { destination });

    query.andWhere('(saved_collections.userId = :userId)', { userId: user.id });

     query.orderBy('saved_collections.id','ASC');

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
