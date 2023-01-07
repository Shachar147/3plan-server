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

  async deleteUser(id: number) {
    if (id == 1){
      throw new NotFoundException(`You cannot delete a superadmin`);
    }
    const result = await this.userRepository.delete({ id: id });
    if (result.affected === 0) {
      throw new NotFoundException(`User with id #${id} not found`);
    }
    return result;
  }

  async deleteUserByName(name: string) {
    const user = await this.userRepository.getUserByName(name)
    return this.deleteUser(user.id);
  }

  async deleteUsersByIds(ids: number[]){
    let affected = 0;
    const errors = [];
    const promises = ids.map((id) => this.deleteUser(id));

    // @ts-ignore
    const results = await Promise.allSettled(promises);
    results.forEach((result, index) => {
      if (result.status !== 200) {
        errors.push({
          id: ids[index],
          state: result.status,
          message: result.reason.message
        });
      } else {
        affected += 1;
      }
    })

    return {
      affected,
      errors,
      raw: undefined
    }
  }
}
