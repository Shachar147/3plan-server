import {
  Body,
  Controller, Get,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthCredentialsDto } from '../auth/dto/auth-credentials.dto';
import { AuthService } from '../auth/auth.service';
import { GetUser } from '../auth/get-user.decorator';
import { User } from './user.entity';
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

import { ListUserDto } from '../auth/dto/list-user-dto';
import { UserService } from './user.service';

@ApiBearerAuth('JWT')
@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({
    summary: 'List Users',
    description:
      'List all registered users.',
  })
  @ApiBody({
    description: 'List all registered users.',
    type: ListUserDto,
  })
  @UseGuards(AuthGuard())
  @Get()
  async getUsers(
    @Body(ValidationPipe) listUserDto: ListUserDto,
  ): Promise<User[]> {
    return this.userService.getUsers(listUserDto);
  }
}
