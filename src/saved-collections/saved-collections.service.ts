import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListDto } from './dto/list-dto';
import { CreateDto } from './dto/create-dto';
import { User } from '../user/user.entity';
import { SavedCollectionsRepository } from './saved-collections.repository';
import { isDefined } from 'class-validator';
import { UpdateDto } from './dto/update-dto';
import {SavedCollectionsItemService} from "./saved-collections-item/saved-collections-item.service";

@Injectable()
export class SavedCollectionsService {
  private logger = new Logger('SavedCollectionsService');
  constructor(
    @InjectRepository(SavedCollectionsRepository)
    private savedCollectionsRepository: SavedCollectionsRepository,
    private savedCollectionsItemService: SavedCollectionsItemService,
  ) {}

  async upsertCollection(createDto: CreateDto, user: User) {

    // find or create
    let collection = await this.savedCollectionsRepository.findOne({
      destination: createDto.destination,
      userId: user.id
    })
    if (!collection){
      collection = await this.savedCollectionsRepository.createCollection(createDto, user);
    }

    const { items } = createDto;

    const promises = [];
    for (let i =0; i<items.length; i++){
      promises.push(
          this.savedCollectionsItemService.createSavedItem({
            collectionId: collection.id,
            poiId: items[i]
          }, user).catch(() => {})
      )
    }

    await Promise.all(promises);

    // get updated collection
    collection = await this.savedCollectionsRepository.findOne({
      destination: createDto.destination,
      userId: user.id
    })
    const collectionItems = await this.savedCollectionsItemService.listSavedItems({
      collectionId: collection.id
    }, user);

    return {
      collection,
      items: collectionItems
    };
  }

  async createCollection(createDto: CreateDto, user: User) {
    const collection = await this.savedCollectionsRepository.createCollection(createDto, user);

    const { items } = createDto;

    const promises = items.map((item) =>
      this.savedCollectionsItemService.createSavedItem({
        collectionId: collection.id,
        poiId: item
      }, user)
    );

    const addedItems = await Promise.all(promises);

    return {
      collection,
      items: addedItems
    };
  }

  async deleteRecord(id: number, user: User) {
    const result = await this.savedCollectionsRepository.delete({
      id: id,
      userId: user.id,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Record with id #${id} not found`);
    }
    return result;
  }

  async updateCollection(id: number, updateDto: UpdateDto, user: User) {
    const record = await this.savedCollectionsRepository.findOne({
      id: id,
      userId: user.id,
    });

    if (!record) {
      throw new NotFoundException(`Collection with id #${id} not found`);
    }

     if (!isDefined(updateDto.name) && !isDefined(updateDto.destination)) {
      throw new BadRequestException(`You have to pass fields to update`);
    }

    return await this.savedCollectionsRepository.updateRecord(record, updateDto);
  }

  async listCollections(filterDto: ListDto, user: User) {
    const collections = await this.savedCollectionsRepository.listRecords(filterDto, user);

    for (let i = 0; i < collections.length; i++){
      const items = await this.savedCollectionsItemService.listSavedItems({
        collectionId: collections[i].id
      }, user);

      // @ts-ignore
      collections[i].items = items;
    }

    return collections;
  }

  async getCollection(id: number, user: User) {
    const result = await this.savedCollectionsRepository.findOne({
      id: id,
      userId: user.id,
    });
    if (!result) {
      throw new NotFoundException(`Collection with id #${id} not found`);
    }
    return result;
  }
}
