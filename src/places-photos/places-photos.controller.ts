import {
  Body,
  Query,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateDto } from './dto/create-dto';
import { ListDto } from './dto/list-dto';
import { AuthGuard } from '@nestjs/passport';
import { PlacesPhotosService } from './places-photos.service';
import { UpdateDto } from './dto/update-dto';
import { GetUser } from '../auth/get-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {User} from "../user/user.entity";

@ApiBearerAuth('JWT')
@ApiTags('Places Photos')
@Controller('/places-photos')
export class PlacesPhotosController {
  constructor(private placesPhotosService: PlacesPhotosService) {}

  @ApiOperation({ description: 'Create New Places Photos' })
  @Post()
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  createRecord(@Body() createDto: CreateDto, @GetUser() user: User) {
    return this.placesPhotosService.createRecord(createDto, user);
  }

  @ApiOperation({ description: 'Get All Places Photos' })
  @Get()
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  async listRecords(@Query() listDto: ListDto, @GetUser() user: User) {
    const records = await this.placesPhotosService.listRecords(listDto, user);
    return {
      total: records.length,
      data: records,
    };
  }

  @ApiOperation({ description: 'Get Places Photos by id' })
  @ApiParam({ name: 'id', required: true, type: 'number' })
  @Get('/:id')
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  async getRecord(@Param('id', ParseIntPipe) id, @GetUser() user: User) {
    return await this.placesPhotosService.getRecord(id, user);
  }

  @ApiOperation({ description: 'Delete Places Photos by id' })
  @ApiParam({ name: 'id', required: true, type: 'number' })
  @Delete('/:id')
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  deleteRecord(@Param('id', ParseIntPipe) id, @GetUser() user: User) {
    return this.placesPhotosService.deleteRecord(id, user);
  }

  @ApiOperation({ description: 'Update Places Photos by id' })
  @ApiParam({ name: 'id', required: true, type: 'number' })
  @Put('/:id')
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  updateRecord(
      @Param('id', ParseIntPipe) id,
      @Body() updateDto: UpdateDto,
      @GetUser() user: User,
  ) {
    return this.placesPhotosService.updateRecord(id, updateDto, user);
  }
}
