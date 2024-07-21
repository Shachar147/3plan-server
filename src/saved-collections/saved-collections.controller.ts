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
import { SavedCollectionsService } from './saved-collections.service';
import { UpdateDto } from './dto/update-dto';
import { User } from '../user/user.entity';
import { GetUser } from '../auth/get-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('JWT')
@ApiTags('Saved Collections')
@Controller('/saved-collections')
export class SavedCollectionsController {
  constructor(private savedCollectionsService: SavedCollectionsService) {}

  @ApiOperation({ description: 'Create New Saved Collection' })
  @Post()
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  createCollection(@Body() createDto: CreateDto, @GetUser() user: User) {
    return this.savedCollectionsService.createCollection(createDto, user);
  }

  @ApiOperation({ description: 'Upsert Saved Collection' })
  @Post("/upsert")
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  upsertCollection(@Body() createDto: CreateDto, @GetUser() user: User) {
    return this.savedCollectionsService.upsertCollection(createDto, user);
  }

  @ApiOperation({ description: 'Get All Saved Collectionss' })
  @Get()
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  async listRecords(@Query() listDto: ListDto, @GetUser() user: User) {
    const records = await this.savedCollectionsService.listCollections(listDto, user);
    return {
      total: records.length,
      data: records,
    };
  }

  @ApiOperation({ description: 'Get Saved Collections by id' })
  @ApiParam({ name: 'id', required: true, type: 'number' })
  @Get('/:id')
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  async getRecord(@Param('id', ParseIntPipe) id, @GetUser() user: User) {
    return await this.savedCollectionsService.getCollection(id, user);
  }

  @ApiOperation({ description: 'Delete Saved Collections by id' })
  @ApiParam({ name: 'id', required: true, type: 'number' })
  @Delete('/:id')
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  deleteRecord(@Param('id', ParseIntPipe) id, @GetUser() user: User) {
    return this.savedCollectionsService.deleteRecord(id, user);
  }

  @ApiOperation({ description: 'Update Saved Collections by id' })
  @ApiParam({ name: 'id', required: true, type: 'number' })
  @Put('/:id')
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  updateRecord(
      @Param('id', ParseIntPipe) id,
      @Body() updateDto: UpdateDto,
      @GetUser() user: User,
  ) {
    return this.savedCollectionsService.updateCollection(id, updateDto, user);
  }
}
