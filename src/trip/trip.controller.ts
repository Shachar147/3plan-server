import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { ListTripsDto } from './dto/list-trips-dto';
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip-dto';
import { UpdateTripDto } from './dto/update-trip-dto';
import { Trip } from './trip.entity';
import { DeleteResult } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiBearerAuth('JWT')
@ApiTags('Trips')
@Controller('trip')
export class TripController {
  constructor(private tripService: TripService) {}

  @ApiOperation({ summary: 'Get Trips', description: 'Get all trips' })
  @Get()
  @UseGuards(AuthGuard())
  async getTrips(@Query(ValidationPipe) filterDto: ListTripsDto) {
    const trips = await this.tripService.getTrips(filterDto);
    return {
      total: trips.length,
      data: trips,
    };
  }

  @ApiOperation({ summary: 'Get Trip', description: 'Get specific trip by id' })
  @ApiParam({
    name: 'id',
    description: 'trip id',
    required: true,
    type: 'number',
  })
  @Get('/:id')
  @UseGuards(AuthGuard())
  getTrip(@Param('id', ParseIntPipe) id): Promise<Trip> {
    return this.tripService.getTrip(id);
  }

  @ApiOperation({ summary: 'Create Trip', description: 'Create a trip.' })
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  createTrip(@Body() createTripDto: CreateTripDto) {
    return this.tripService.createTrip(createTripDto);
  }

  @ApiOperation({ summary: 'Upsert Trip', description: 'Upsert a trip.' })
  @Post('/upsert')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  upsertTrip(@Body() createTripDto: CreateTripDto) {
    return this.tripService.upsertTrip(createTripDto);
  }

  @ApiOperation({ summary: 'Update Trip', description: 'Update trip by id' })
  @ApiParam({
    name: 'id',
    description: 'trip id',
    required: true,
    type: 'number',
  })
  @Put('/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  updateTrip(
    @Param('id', ParseIntPipe) id,
    @Body() updateTripDto: UpdateTripDto,
  ) {
    return this.tripService.updateTrip(id, updateTripDto);
  }

  @ApiOperation({ summary: 'Delete Trip', description: 'Delete trip by id' })
  @ApiParam({
    name: 'id',
    description: 'trip id',
    required: true,
    type: 'number',
  })
  @Delete('/:id')
  @UseGuards(AuthGuard())
  deleteTrip(@Param('id', ParseIntPipe) id): Promise<DeleteResult> {
    return this.tripService.deleteTrip(id);
  }

  @ApiOperation({ summary: 'Delete Trip', description: 'Delete trip by id' })
  @ApiParam({
    name: 'id',
    description: 'trip id',
    required: true,
    type: 'number',
  })
  @Delete('/name/:name')
  @UseGuards(AuthGuard())
  deleteTripByName(@Param('name') name): Promise<DeleteResult> {
    return this.tripService.deleteTripByName(name);
  }
}
