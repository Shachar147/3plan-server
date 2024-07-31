import { Injectable, Logger, NotFoundException, UseGuards} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListDto } from './dto/list-dto';
import { CreateDto } from './dto/create-dto';
import { User } from '../../user/user.entity';
import { SavedCollectionsItemRepository } from './saved-collections-item.repository';
import {AuthGuard} from "@nestjs/passport";
import {PointOfInterestService} from "../../poi/poi.service";
import {In} from "typeorm";

@Injectable()
export class SavedCollectionsItemService {
  private logger = new Logger('SavedCollectionsItemService');
  constructor(
    @InjectRepository(SavedCollectionsItemRepository)
    private savedCollectionsItemRepository: SavedCollectionsItemRepository,
    private poiService: PointOfInterestService
  ) {}

  @UseGuards(AuthGuard())
  async createSavedItem(createDto: CreateDto, user: User) {
    return await this.savedCollectionsItemRepository.createRecord(createDto, user);
  }

  @UseGuards(AuthGuard())
  async deleteSavedItem(id: number, user: User) {
    const result = await this.savedCollectionsItemRepository.delete({
      id: id,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Record with id #${id} not found`);
    }
    return result;
  }

  @UseGuards(AuthGuard())
  async listSavedItems(filterDto: ListDto, user: User) {
    const results = await this.savedCollectionsItemRepository.listRecords(filterDto, user);
    const ids = results.map((r) => r.poiId);
    const fullItems = await this.poiService.pointOfInterestRepository.find({
      where: { id: In(ids) },
    });

    // Create a map for quick lookup of full items by id
    const fullItemsMap = new Map(fullItems.map(item => [item.id, item]));

    // Enrich results with full item details
    // @ts-ignore
    const enrichedResults = results.map(result => ({
      ...result,
      fullDetails: fullItemsMap.get(result.poiId) || null,
    }));

    return enrichedResults;
  }
}
