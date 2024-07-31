import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { debug_mode } from '../config/server.config';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');

  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.userRepository.signUp(authCredentialsDto);
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string, id: number }> {
    const { id, username } = await this.userRepository.validateUserPassword(
      authCredentialsDto,
    );

    if (!username) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const payload: JwtPayload = { username, id };
    const accessToken = await this.jwtService.sign(payload);

    if (debug_mode)
      this.logger.debug(
        `Generated JWT token with payload: ${JSON.stringify(payload)}.`,
      );

    return { accessToken, id };
  }

  async setLastLoginAt(id: number) {
    const user = await this.userRepository.findOne(
        { id }
    );
    if (user) {
      user.lastLoginAt = new Date();
      user.numOfLogins++;
      await user.save();
    }
  }

  async getUsers() {
    return (await this.userRepository.find({})).map((x) => ({
      id: x.id,
      username: x.username,
      joinedAt: x.joinedAt,
      lastLoginAt: x.lastLoginAt,
      numOfLogins: x.numOfLogins
    })).sort((a, b) => (b.lastLoginAt?.getTime() ?? 0) - (a.lastLoginAt?.getTime() ?? 0))
  }
}
