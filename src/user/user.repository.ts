import { EntityRepository, Repository } from 'typeorm';
import { User } from './user.entity';
import { AuthCredentialsDto } from '../auth/dto/auth-credentials.dto';
import {
  ConflictException,
  InternalServerErrorException, Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { isDefined } from 'class-validator';
import { ListUserDto } from '../auth/dto/list-user-dto';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  private logger = new Logger('UserRepository');
  
  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = authCredentialsDto;

    const User = await this.getUserByName(username);
    if (isDefined(User)) {
      throw new ConflictException('Username already exists');
    }

    const user = this.create();
    user.username = username;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
    } catch (error) {
      if (Number(error.code) === 23505) {
        // duplicate username
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getUserByName(username) {
    return await this.createQueryBuilder()
      .where('LOWER(username) = LOWER(:username)', { username })
      .getOne();
  }

  async validateUserPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<string> {
    const { username, password } = authCredentialsDto;
    const user = await this.getUserByName(username);

    if (user && (await user.validatePassword(password))) {
      return user.username;
    } else {
      return null;
    }
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }

  async getUsers(filterDto: ListUserDto): Promise<User[]> {
    const {
      name,
      search,
      names,

    } = filterDto;
    
    const query = this.createQueryBuilder('user');

    if (search)
      query.where('(user.name LIKE :search)', { search: `%${search}%` });
    if (name) query.andWhere('user.name = :name', { name });
    
    // if (id) query.andWhere('user.id = :id', { id });

    if (names && names.split(',').length > 0) {
      const options = [];
      const values = {};
      names.split(',').forEach((name, idx) => {
        const key = 'name' + idx;
        options.push('(user.name = :' + key + ')');
        values[key] = name;
      });

      query.andWhere('(' + options.join(' OR ') + ')', values);
    }

    try {
      const users = await query.getMany();
      return users;
    } catch (error) {
      this.logger.error(
        `Failed to get users . Filters: ${JSON.stringify(filterDto)}"`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
