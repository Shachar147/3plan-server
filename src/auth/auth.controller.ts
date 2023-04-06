import {
  Body,
  Controller, NotFoundException,
  Post,
  Req, UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { AuthService } from './auth.service';
import { GetUser } from './get-user.decorator';
import { User } from '../user/user.entity';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import * as config from 'config';
const jwtConfig = config.get('jwt');

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: 'Sign Up',
    description:
      'Sign up. supply username & password to create a new user in the system.',
  })
  @ApiBody({
    description: 'User credentials: username & password',
    type: AuthCredentialsDto,
  })
  @Post('/signup')
  async signUp(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<void> {
    return this.authService.signUp(authCredentialsDto);
  }

  @ApiOperation({
    summary: 'Sign In',
    description:
      'Sign in. supply username & password and get JWT token in return.',
  })
  @ApiOkResponse({
    description: 'Returns JWT token of this user',
  })
  @ApiUnauthorizedResponse({
    description: 'Indicates that the given credentials are incorrect.',
  })
  @ApiBadRequestResponse({
    description:
      'Indicates that one (or more) of the given parameters was invalid.',
  })
  @ApiBody({
    description: 'User credentials: username & password',
    type: AuthCredentialsDto,
  })
  @Post('/signin')
  async singIn(
    @Body(ValidationPipe) authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string; expiresIn: number; expiresAt: number }> {
    const { accessToken } = await this.authService.signIn(authCredentialsDto);

    return {
      accessToken,
      expiresIn: jwtConfig.expiresIn,
      expiresAt: Date.now() + jwtConfig.expiresIn * 1000,
    };
  }

  @ApiOperation({
    summary: 'Test',
    description:
      'Test Token. supply JWT token and get matching username. useful for debug purposes.',
  })
  @ApiBearerAuth('JWT')
  @Post('/isLoggedIn')
  @UseGuards(AuthGuard())
  isLoggedIn(@GetUser() user: User) {
    return {
      loggedIn: true,
      loggedInUser: {
        id: user.id,
        username: user.username
      },
    };
  }

  @ApiOperation({
    summary: 'Test',
    description:
        'Test Token. supply JWT token and get matching username. useful for debug purposes.',
  })
  @ApiBearerAuth('JWT')
  @Post('/isAdmin')
  @UseGuards(AuthGuard())
  isAdmin(@GetUser() user: User) {
    if (user.username !== 'Shachar'){
      throw new UnauthorizedException();
    }
    return {
      loggedIn: true,
      loggedInUser: {
        id: user.id,
        username: user.username
      },
    };
  }
}
