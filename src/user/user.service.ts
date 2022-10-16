import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ListUserDto } from '../auth/dto/list-user-dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private logger = new Logger('PlayerService');

  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository
  ) {}

  async getUsers(filterDto: ListUserDto) {
    const users = await this.userRepository.getUsers(filterDto);
    users.forEach((user) => {
      delete user.salt;
      delete user.password;
    });
    
    return users;
  }

}
