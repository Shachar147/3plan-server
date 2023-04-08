import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from './jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from '../user/user.repository';
import { User } from '../user/user.entity';

import * as config from 'config';

const jwtConfig = config.get('jwt');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || jwtConfig.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { username, id } = payload;

    // bad token
    if (!id || !username){
      throw new UnauthorizedException();
    }

    // const user = await this.userRepository.findOne({ username });
    const user = await this.userRepository.getUserByName(username);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
