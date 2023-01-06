"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripController = void 0;
const common_1 = require("@nestjs/common");
const list_trips_dto_1 = require("./dto/list-trips-dto");
const trip_service_1 = require("./trip.service");
const create_trip_dto_1 = require("./dto/create-trip-dto");
const update_trip_dto_1 = require("./dto/update-trip-dto");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
let TripController = class TripController {
    constructor(tripService) {
        this.tripService = tripService;
    }
    async getTrips(filterDto) {
        const trips = await this.tripService.getTrips(filterDto);
        return {
            total: trips.length,
            data: trips,
        };
    }
    getTrip(id) {
        return this.tripService.getTrip(id);
    }
    createTrip(createTripDto) {
        return this.tripService.createTrip(createTripDto);
    }
    upsertTrip(createTripDto) {
        return this.tripService.upsertTrip(createTripDto);
    }
    updateTrip(id, updateTripDto) {
        return this.tripService.updateTrip(id, updateTripDto);
    }
    updateTripByName(name, updateTripDto) {
        return this.tripService.updateTripByName(name, updateTripDto);
    }
    deleteTrip(id) {
        return this.tripService.deleteTrip(id);
    }
    deleteTripByName(name) {
        return this.tripService.deleteTripByName(name);
    }
};
__decorate([
    swagger_1.ApiOperation({ summary: 'Get Trips', description: 'Get all trips' }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_trips_dto_1.ListTripsDto]),
    __metadata("design:returntype", Promise)
], TripController.prototype, "getTrips", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Get Trip', description: 'Get specific trip by id' }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'trip id',
        required: true,
        type: 'number',
    }),
    common_1.Get('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TripController.prototype, "getTrip", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Create Trip', description: 'Create a trip.' }),
    common_1.Post(),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_trip_dto_1.CreateTripDto]),
    __metadata("design:returntype", void 0)
], TripController.prototype, "createTrip", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Upsert Trip', description: 'Upsert a trip.' }),
    common_1.Post('/upsert'),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_trip_dto_1.CreateTripDto]),
    __metadata("design:returntype", void 0)
], TripController.prototype, "upsertTrip", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Update Trip', description: 'Update trip by id' }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'trip id',
        required: true,
        type: 'number',
    }),
    common_1.Put('/:id'),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_trip_dto_1.UpdateTripDto]),
    __metadata("design:returntype", void 0)
], TripController.prototype, "updateTrip", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Update Trip By Name', description: 'Update trip by name' }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'trip name',
        required: true,
        type: 'string',
    }),
    common_1.Put('/name/:name'),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('name')),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_trip_dto_1.UpdateTripDto]),
    __metadata("design:returntype", void 0)
], TripController.prototype, "updateTripByName", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Delete Trip', description: 'Delete trip by id' }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'trip id',
        required: true,
        type: 'number',
    }),
    common_1.Delete('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TripController.prototype, "deleteTrip", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Delete Trip By Name', description: 'Delete trip by name' }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'trip name',
        required: true,
        type: 'string',
    }),
    common_1.Delete('/name/:name'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TripController.prototype, "deleteTripByName", null);
TripController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Trips'),
    common_1.Controller('trip'),
    __metadata("design:paramtypes", [trip_service_1.TripService])
], TripController);
exports.TripController = TripController;
//# sourceMappingURL=trip.controller.js.map