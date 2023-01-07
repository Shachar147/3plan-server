import {
  Body,
  Controller, Delete, Get, Param, ParseIntPipe,
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
  ApiOperation, ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ListUserDto } from '../auth/dto/list-user-dto';
import { UserService } from './user.service';
import {DeleteResult} from "typeorm";

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

  @ApiOperation({ summary: 'Delete User', description: 'Delete user by id' })
  @ApiParam({
    name: 'id',
    description: 'user id',
    required: true,
    type: 'number',
  })
  @Delete('/:id')
  @UseGuards(AuthGuard())
  deleteUser(@Param('id', ParseIntPipe) id): Promise<DeleteResult> {
    return this.userService.deleteUser(id);
  }

  @ApiOperation({ summary: 'Delete Users', description: 'Delete users in bulk by ids comma separated' })
  @ApiParam({
    name: 'ids',
    description: 'user id',
    required: true,
    type: 'string',
  })
  @Delete('/bulk/:ids')
  @UseGuards(AuthGuard())
  deleteUsers(@Param('ids') ids): Promise<DeleteResult> {
    return this.userService.deleteUsersByIds(ids.split(',').map(x => parseInt(x)));
  }

  @ApiOperation({ summary: 'Delete User by name', description: 'Delete user by name' })
  @ApiParam({
    name: 'name',
    description: 'the name of the user',
    required: true,
    type: 'string',
  })
  @Delete('/name/:name')
  @UseGuards(AuthGuard())
  deleteUserByName(@Param('name') name): Promise<DeleteResult> {
    return this.userService.deleteUserByName(name);
  }
}
