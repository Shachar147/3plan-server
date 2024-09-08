import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListDto } from './dto/list-dto';
import { CreateDto } from './dto/create-dto';
import { PlacesPhotosRepository } from './places-photos.repository';
import { isDefined } from 'class-validator';
import { UpdateDto } from './dto/update-dto';
import {User} from "../user/user.entity";
import {UnsplashService} from "./unsplash.service";

@Injectable()
export class PlacesPhotosService {
  private logger = new Logger('PlacesPhotosService');
  constructor(
    @InjectRepository(PlacesPhotosRepository)
    private placesPhotosRepository: PlacesPhotosRepository,
  ) {}

  async createRecord(createDto: CreateDto, user: User) {
    return await this.placesPhotosRepository.createRecord(createDto, user);
  }

  async deleteRecord(id: number, user: User) {
    const result = await this.placesPhotosRepository.delete({
      id: id,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Record with id #${id} not found`);
    }
    return result;
  }

  async updateRecord(id: number, updateDto: UpdateDto, user: User) {
    const record = await this.placesPhotosRepository.findOne({
      id: id,
    });

    if (!record) {
      throw new NotFoundException(`Record with id #${id} not found`);
    }

     if (!isDefined(updateDto.place) && !isDefined(updateDto.photo) && !isDefined(updateDto.other_photos)) {
      throw new BadRequestException(`You have to pass fields to update`);
    }

    return await this.placesPhotosRepository.updateRecord(record, updateDto);
  }

  async listRecords(filterDto: ListDto, user: User) {
    let records = await this.placesPhotosRepository.listRecords(filterDto, user);

    // search & save to db
    if (filterDto.place && records.length == 0){
      const photos = await new UnsplashService().getPhotosByPlace(filterDto.place);
      if (photos){
        await this.placesPhotosRepository.createRecord({
          place: filterDto.place,
          photo: photos[0],
          other_photos: JSON.stringify(photos.slice(1, photos.length))
        } as unknown as CreateDto, user)

        records = await this.placesPhotosRepository.listRecords(filterDto, user);
      }
    }
    return records;
  }

  async getRecord(id: number, user: User) {
    const result = await this.placesPhotosRepository.findOne({
      id: id,
    });
    if (!result) {
      throw new NotFoundException(`Record with id #${id} not found`);
    }
    return result;
  }
}
