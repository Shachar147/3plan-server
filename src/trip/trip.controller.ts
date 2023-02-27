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
} from "@nestjs/common";
import { ListTripsDto } from "./dto/list-trips-dto";
import { TripService } from "./trip.service";
import { CreateTripDto } from "./dto/create-trip-dto";
import { UpdateTripDto } from "./dto/update-trip-dto";
import { Trip } from "./trip.entity";
import { DeleteResult } from "typeorm";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { GetUser } from "../auth/get-user.decorator";
import { User } from "../user/user.entity";
import {DuplicateTripDto} from "./dto/duplicate-trip-dto";

@ApiBearerAuth("JWT")
@ApiTags("Trips")
@Controller("trip")
export class TripController {
  constructor(private tripService: TripService) {}

  @ApiOperation({ summary: "Get Trips", description: "Get all trips" })
  @Get()
  @UseGuards(AuthGuard())
  async getTrips(
    @Query(ValidationPipe) filterDto: ListTripsDto,
    @GetUser() user: User
  ) {
    const trips = await this.tripService.getTrips(filterDto, user);
    return {
      total: trips.length,
      data: trips,
    };
  }

  @ApiOperation({ summary: "Get Trip", description: "Get specific trip by id" })
  @ApiParam({
    name: "id",
    description: "trip id",
    required: true,
    type: "number",
  })
  @Get("/:id")
  @UseGuards(AuthGuard())
  getTrip(@Param("id", ParseIntPipe) id, @GetUser() user: User): Promise<Trip> {
    return this.tripService.getTrip(id, user);
  }

  @ApiOperation({
    summary: "Get Trip By Name",
    description: "Get specific trip by name",
  })
  @ApiParam({
    name: "name",
    description: "trip name",
    required: true,
    type: "string",
  })
  @Get("/name/:name")
  @UseGuards(AuthGuard())
  getTripByName(@Param("name") name, @GetUser() user: User): Promise<Trip> {
    return this.tripService.getTripByName(name, user);
  }

  @ApiOperation({ summary: "Create Trip", description: "Create a trip." })
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  createTrip(@Body() createTripDto: CreateTripDto, @GetUser() user: User) {
    return this.tripService.createTrip(createTripDto, user);
  }

  @ApiOperation({ summary: "Upsert Trip", description: "Upsert a trip." })
  @Post("/upsert")
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  upsertTrip(@Body() createTripDto: CreateTripDto, @GetUser() user: User) {
    return this.tripService.upsertTrip(createTripDto, user);
  }

  @ApiOperation({ summary: "Duplicate Trip", description: "Duplicate trip by name" })
  @Post("/duplicate")
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  duplicateTripByName(
      @Body() duplicateTripDto: DuplicateTripDto,
      @GetUser() user: User
  ) {
    const { name } = duplicateTripDto;
    return this.tripService.duplicateTripByName(name, duplicateTripDto, user);
  }

  @ApiOperation({ summary: "Update Trip", description: "Update trip by id" })
  @ApiParam({
    name: "id",
    description: "trip id",
    required: true,
    type: "number",
  })
  @Put("/:id")
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  updateTrip(
    @Param("id", ParseIntPipe) id,
    @Body() updateTripDto: UpdateTripDto,
    @GetUser() user: User
  ) {
    return this.tripService.updateTrip(id, updateTripDto, user);
  }

  @ApiOperation({
    summary: "Update Trip By Name",
    description: "Update trip by name",
  })
  @ApiParam({
    name: "name",
    description: "trip name",
    required: true,
    type: "string",
  })
  @Put("/name/:name")
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  updateTripByName(
    @Param("name") name,
    @Body() updateTripDto: UpdateTripDto,
    @GetUser() user: User
  ) {
    return this.tripService.updateTripByName(name, updateTripDto, user);
  }

  @ApiOperation({ summary: "Delete Trip", description: "Delete trip by id" })
  @ApiParam({
    name: "id",
    description: "trip id",
    required: true,
    type: "number",
  })
  @Delete("/:id")
  @UseGuards(AuthGuard())
  deleteTrip(
    @Param("id", ParseIntPipe) id,
    @GetUser() user: User
  ): Promise<DeleteResult> {
    return this.tripService.deleteTrip(id, user);
  }

  @ApiOperation({
    summary: "Delete Trip By Name",
    description: "Delete trip by name",
  })
  @ApiParam({
    name: "name",
    description: "trip name",
    required: true,
    type: "string",
  })
  @Delete("/name/:name")
  @UseGuards(AuthGuard())
  deleteTripByName(
    @Param("name") name,
    @GetUser() user: User
  ): Promise<DeleteResult> {
    return this.tripService.deleteTripByName(name, user);
  }
}
