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
  UseGuards, Req, Inject, Injectable, UnauthorizedException,
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
import { Request } from 'express';
import {MyWebSocketGateway} from "../websocket.gateway";
import {ImportCalendarEventsDto} from "./dto/import-calendar-events-dto";
import {isAdmin} from "../poi/poi.controller";

@Injectable()
@ApiBearerAuth("JWT")
@ApiTags("Trips")
@Controller("trip")
export class TripController {
  constructor(
      private tripService: TripService,
      @Inject(MyWebSocketGateway) private readonly myWebSocketGateway: MyWebSocketGateway,

  ) {}

  @Get('/autofill')
  @UseGuards(AuthGuard())
  async autoFillPlaceData(
      @GetUser() user: User,
      @Query('name') name: string,
  ): Promise<Record<string, any>> {
    if (!isAdmin(user)) {
      throw new UnauthorizedException();
    }
    return await this.tripService.autoFillData(name, user);
  }

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

  @ApiOperation({ summary: "Get Trips Short", description: "Get all trips basic info" })
  @Get('short')
  @UseGuards(AuthGuard())
  async getTripsShort(
      @Query(ValidationPipe) filterDto: ListTripsDto,
      @GetUser() user: User
  ) {
    const { trips, sharedTrips } = await this.tripService.getTripsShort(filterDto, user);
    return {
      total: trips.length,
      data: trips,
      sharedTrips
    };
  }

  @Put("/migrate/extended-props/wet")
  migrate() {
    return this.tripService.migrate({
      isDryRun: false
    });
  }

  @Put("/migrate/extended-props")
  migrateDryRun() {
    return this.tripService.migrate({

    });
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

  @ApiOperation({ summary: "Duplicate Trip", description: "Duplicate trip by name" })
  @Post("/duplicate")
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  duplicateTripByName(
      @Body() duplicateTripDto: DuplicateTripDto,
      @GetUser() user: User,
      @Req() request: Request
  ) {
    const { name } = duplicateTripDto;
    return this.tripService.duplicateTripByName(name, duplicateTripDto, user, request);
  }

  @ApiOperation({ summary: "Create Trip", description: "Create a trip." })
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  createTrip(@Body() createTripDto: CreateTripDto, @GetUser() user: User, @Req() request: Request) {
    return this.tripService.createTrip(createTripDto, user, request);
  }

  @ApiOperation({ summary: "Create Trip & auto find photos", description: "Create a trip & auto find photos." })
  @Post("/autoFill")
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  createTripFillPhotos(@Body() createTripDto: CreateTripDto, @GetUser() user: User, @Req() request: Request) {
    return this.tripService.createTrip(createTripDto, user, request, undefined, true);
  }

  @ApiOperation({ summary: "Upsert Trip", description: "Upsert a trip." })
  @Post("/upsert")
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(AuthGuard())
  upsertTrip(@Body() createTripDto: CreateTripDto, @GetUser() user: User, @Req() request: Request) {
    return this.tripService.upsertTrip(createTripDto, user, request);
  }

  @ApiOperation({
    summary: "Lock Trip By Name",
    description: "Lock trip by name",
  })
  @ApiParam({
    name: "name",
    description: "trip name",
    required: true,
    type: "string",
  })
  @UseGuards(AuthGuard())
  @Put("/lock/name/:name")
  async lockTrip(
      @Param("name") name,
      @GetUser() user: User,
      @Req() request: Request
  ) {
    const result = await this.tripService.toggleLockTrip(name, true, user, request);
    // this.myWebSocketGateway.send(JSON.stringify(result), user.id, request.headers.cid?.toString() ?? "");
    this.myWebSocketGateway.send(JSON.stringify(result), `t${result.id}`, request.headers.cid?.toString() ?? "");
    return result;
  }

  @ApiOperation({
    summary: "Unlock Trip By Name",
    description: "Unlock trip by name",
  })
  @ApiParam({
    name: "name",
    description: "trip name",
    required: true,
    type: "string",
  })
  @UseGuards(AuthGuard())
  @Put("/unlock/name/:name")
  async unlockTrip(
      @Param("name") name,
      @GetUser() user: User,
      @Req() request: Request
  ) {
    const result = await this.tripService.toggleLockTrip(name, false, user, request);
    // this.myWebSocketGateway.send(JSON.stringify(result), user.id, request.headers.cid?.toString() ?? "");
    this.myWebSocketGateway.send(JSON.stringify(result), `t${result.id}`, request.headers.cid?.toString() ?? "");
    return result;
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
  async updateTripByName(
    @Param("name") name,
    @Body() updateTripDto: UpdateTripDto,
    @GetUser() user: User,
    @Req() request: Request
  ) {
    const result = await this.tripService.updateTripByName(name, updateTripDto, user, request);
    // this.myWebSocketGateway.send(JSON.stringify(result), user.id, request.headers.cid?.toString() ?? "");
    this.myWebSocketGateway.send(JSON.stringify(result), `t${result.id}`, request.headers.cid?.toString() ?? "");
    return result;
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
  async updateTrip(
      @Param("id", ParseIntPipe) id,
      @Body() updateTripDto: UpdateTripDto,
      @GetUser() user: User,
      @Req() request: Request
  ) {
    const result = await this.tripService.updateTrip(id, updateTripDto, user, request);
    // this.myWebSocketGateway.send(JSON.stringify(result), user.id, request.headers.cid?.toString() ?? "");
    this.myWebSocketGateway.send(JSON.stringify(result), `t${id}`, request.headers.cid?.toString() ?? "");
    return result;
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
    @GetUser() user: User,
    @Req() request: Request
  ): Promise<DeleteResult> {
    return this.tripService.deleteTrip(id, user, request);
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
    @GetUser() user: User,
    @Req() request: Request
  ): Promise<DeleteResult> {
    return this.tripService.deleteTripByName(name, user, request);
  }

  @ApiOperation({
    summary: "Hide Trip By Name",
    description: "Hide trip by name",
  })
  @ApiParam({
    name: "name",
    description: "trip name",
    required: true,
    type: "string",
  })
  @UseGuards(AuthGuard())
  @Put("/hide/name/:name")
  async hideTrip(
      @Param("name") name,
      @GetUser() user: User,
      @Req() request: Request
  ) {
    const result = await this.tripService.toggleHideTrip(name, true, user, request);
    // this.myWebSocketGateway.send(JSON.stringify(result), user.id, request.headers.cid?.toString() ?? "");
    this.myWebSocketGateway.send(JSON.stringify(result), `t${result.id}`, request.headers.cid?.toString() ?? "");
    return result;
  }

  @ApiOperation({
    summary: "Unhide Trip By Name",
    description: "Unhide trip by name",
  })
  @ApiParam({
    name: "name",
    description: "trip name",
    required: true,
    type: "string",
  })
  @UseGuards(AuthGuard())
  @Put("/unhide/name/:name")
  async unhideTrip(
      @Param("name") name,
      @GetUser() user: User,
      @Req() request: Request
  ) {
    const result = await this.tripService.toggleHideTrip(name, false, user, request);
    // this.myWebSocketGateway.send(JSON.stringify(result), user.id, request.headers.cid?.toString() ?? "");
    this.myWebSocketGateway.send(JSON.stringify(result), `t${result.id}`, request.headers.cid?.toString() ?? "");
    return result;
  }

  @ApiOperation({
    summary: "Import Calendar events to trip By Name",
    description: "Import calendar events to trip by name",
  })
  @ApiParam({
    name: "name",
    description: "trip name",
    required: true,
    type: "string",
  })
  @UseGuards(AuthGuard())
  @Post("/import/calendar/name/:name")
  async importCalendarEvents(
      @Param("name") name,
      @Body() importCalendarEventsDto: ImportCalendarEventsDto,
      @GetUser() user: User,
      @Req() request: Request
  ) {
    const result = await this.tripService.importCalendarEvents(name, importCalendarEventsDto, user, request);
    // this.myWebSocketGateway.send(JSON.stringify(result), user.id, request.headers.cid?.toString() ?? "");

    // this.myWebSocketGateway.send(JSON.stringify(result), `t${result.id}`, request.headers.cid?.toString() ?? "");
    return result;
  }
}
