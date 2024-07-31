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
  ValidationPipe, NotFoundException,
} from '@nestjs/common';
import { CreateDto } from './dto/create-dto';
import { ListDto } from './dto/list-dto';
import { AuthGuard } from '@nestjs/passport';
import { SavedCollectionsItemService } from './saved-collections-item.service';
import { User } from '../../user/user.entity';
import { GetUser } from '../../auth/get-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('JWT')
@ApiTags('Saved Collections Item')
@Controller('/saved-collections-item')
export class SavedCollectionsItemController {
  constructor(private savedCollectionsItemService: SavedCollectionsItemService) {}

  @ApiOperation({ description: 'Create New Saved Collections Item' })
  @Post()
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  createSavedItem(@Body() createDto: CreateDto, @GetUser() user: User) {
    return this.savedCollectionsItemService.createSavedItem(createDto, user);
  }

  @ApiOperation({ description: 'Get All Saved Collections Items' })
  @Get()
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  async listSavedItems(@Query() listDto: ListDto, @GetUser() user: User) {
    const records = await this.savedCollectionsItemService.listSavedItems(listDto, user);
    return {
      total: records.length,
      data: records,
    };
  }

  // @ApiOperation({ description: 'Get Saved Collections Item by id' })
  // @ApiParam({ name: 'id', required: true, type: 'number' })
  // @Get('/:id')
  // @UseGuards(AuthGuard())
  // @UsePipes(new ValidationPipe({ transform: true }))
  // async getRecord(@Param('id', ParseIntPipe) id, @GetUser() user: User) {
  //   return await this.savedCollectionsItemService.getSavedItem(id, user);
  // }

  @ApiOperation({ description: 'Delete Saved Collections Item by collection id and poi id' })
  @ApiParam({ name: 'id', required: true, type: 'number' })
  @ApiParam({ name: 'id', required: true, type: 'number' })
  @Post('/delete/cid/:cid/pid/:pid')
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  async deleteSavedItem(@Param('cid', ParseIntPipe) cid, @Param('pid', ParseIntPipe) pid, @GetUser() user: User) {
    const found = await this.savedCollectionsItemService.listSavedItems({
      collectionId: cid,
      poiId: pid
    }, user);
    if (!found.length) {
      throw new NotFoundException(`saved item #${pid} from collection #${cid} not found`);
    }
    return this.savedCollectionsItemService.deleteSavedItem(found[0].id, user);
  }

  @ApiOperation({ description: 'Delete Saved Collections Item by id' })
  @ApiParam({ name: 'id', required: true, type: 'number' })
  @Delete('/by-id/:id')
  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ transform: true }))
  deleteSavedItemById(@Param('id', ParseIntPipe) id, @GetUser() user: User) {
    return this.savedCollectionsItemService.deleteSavedItem(id, user);
  }

  // @ApiOperation({ description: 'Update Saved Collections Item by id' })
  // @ApiParam({ name: 'id', required: true, type: 'number' })
  // @Put('/:id')
  // @UseGuards(AuthGuard())
  // @UsePipes(new ValidationPipe({ transform: true }))
  // updateRecord(
  //     @Param('id', ParseIntPipe) id,
  //     @Body() updateDto: UpdateDto,
  //     @GetUser() user: User,
  // ) {
  //   return this.savedCollectionsItemService.updateRecord(id, updateDto, user);
  // }
}
