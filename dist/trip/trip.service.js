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
exports.TripService = void 0;
const common_1 = require("@nestjs/common");
const trip_repository_1 = require("./trip.repository");
const typeorm_1 = require("@nestjs/typeorm");
let TripService = class TripService {
    constructor(tripRepository) {
        this.tripRepository = tripRepository;
        this.logger = new common_1.Logger('TripService');
    }
    async getTrips(filterDto, user) {
        return await this.tripRepository.getTrips(filterDto, user);
    }
    async getTrip(id, user) {
        const found = await this.tripRepository.findOne(id);
        if (!found || (found && found.user.id !== user.id)) {
            throw new common_1.NotFoundException(`Trip with id #${id} not found`);
        }
        return found;
    }
    async getTripByNameFull(name) {
        const found = await this.tripRepository.findOne({ name: name });
        if (!found) {
            throw new common_1.NotFoundException(`Trip with name ${name} not found`);
        }
        return found;
    }
    async getTripByName(name, user) {
        const found = await this.tripRepository._getTripByName(name, user);
        if (!found) {
            throw new common_1.NotFoundException(`Trip with name ${name} not found`);
        }
        return found;
    }
    async createTrip(createTripDto, user) {
        return await this.tripRepository.createTrip(createTripDto, user);
    }
    async upsertTrip(createTripDto, user) {
        const { name } = createTripDto;
        if (!name) {
            throw new common_1.BadRequestException('name : missing');
        }
        return await this.tripRepository.upsertTrip(createTripDto, user);
    }
    async updateTrip(id, updateTripDto, user) {
        const trip = await this.getTrip(id, user);
        return this.tripRepository.updateTrip(updateTripDto, trip, user);
    }
    async updateTripByName(name, updateTripDto, user) {
        const trip = await this.getTripByName(name, user);
        return this.tripRepository.updateTrip(updateTripDto, trip, user);
    }
    async deleteTrip(id, user) {
        const trip = this.getTrip(id, user);
        if (!trip) {
            throw new common_1.NotFoundException(`Trip with id #${id} not found`);
        }
        const result = await this.tripRepository.delete({ id: id });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Trip with id #${id} not found`);
        }
        return result;
    }
    async deleteTripByName(name, user) {
        const trip = this.getTripByName(name, user);
        if (!trip) {
            throw new common_1.NotFoundException(`Trip with name ${name} not found`);
        }
        const result = await this.tripRepository.delete({ name: name });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Trip with name "${name}" not found`);
        }
        return result;
    }
};
TripService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(trip_repository_1.TripRepository)),
    __metadata("design:paramtypes", [trip_repository_1.TripRepository])
], TripService);
exports.TripService = TripService;
//# sourceMappingURL=trip.service.js.map