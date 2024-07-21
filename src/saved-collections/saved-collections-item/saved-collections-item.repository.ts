import { EntityRepository, Repository } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  Logger
} from "@nestjs/common";
import { CreateDto } from './dto/create-dto';
import { User } from '../../user/user.entity';
import { ListDto } from "./dto/list-dto";
import { SavedCollectionsItem } from './saved-collections-item.entity';
import { UpdateDto } from "./dto/update-dto";

@EntityRepository(SavedCollectionsItem)
export class SavedCollectionsItemRepository extends Repository<SavedCollectionsItem> {
  private logger = new Logger('SavedCollectionsItemRepository');

  async createRecord(
    createDto: CreateDto,
    user: User,
  ): Promise<SavedCollectionsItem> {
    const { collectionId, poiId } = createDto;

    const record = this.create();
    record.collectionId = collectionId;
    record.poiId = poiId;

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

  async updateRecord(record: SavedCollectionsItem, updateDto: UpdateDto) {

    const { collectionId, poiId } = updateDto;

    record.collectionId = collectionId;
    record.poiId = poiId;

    try {
      await record.save();
    } catch (error) {
      console.error(`Error: ${error}`);
      throw new InternalServerErrorException();
    }

    return record;
  }
  
  async listRecords(filterDto: ListDto, user: User) {
    const { collectionId, poiId } = filterDto;

    const query = this.createQueryBuilder('saved_collections_item');

    if (collectionId) query.andWhere('(saved_collections_item.collectionId = :collectionId)', { collectionId });
    if (poiId) query.andWhere('(saved_collections_item.poiId = :poiId)', { poiId });

    // query.andWhere('(saved_collections_item.userId = :userId)', { userId: user.id });

     query.orderBy('saved_collections_item.id','ASC');

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
