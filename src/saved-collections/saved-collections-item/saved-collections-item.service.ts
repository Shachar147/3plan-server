import {BadRequestException, Injectable, Logger, NotFoundException, UseGuards} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListDto } from './dto/list-dto';
import { CreateDto } from './dto/create-dto';
import { User } from '../../user/user.entity';
import { SavedCollectionsItemRepository } from './saved-collections-item.repository';
import { isDefined } from 'class-validator';
import { UpdateDto } from './dto/update-dto';
import {AuthGuard} from "@nestjs/passport";

@Injectable()
export class SavedCollectionsItemService {
  private logger = new Logger('SavedCollectionsItemService');
  constructor(
    @InjectRepository(SavedCollectionsItemRepository)
    private savedCollectionsItemRepository: SavedCollectionsItemRepository,
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
    return await this.savedCollectionsItemRepository.listRecords(filterDto, user);
  }
}
