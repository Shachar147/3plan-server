"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const trip_entity_1 = require("./trip.entity");
let TripRepository = class TripRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger("TripRepository");
    }
    async createTrip(createTripDto, user) {
        const { name, dateRange, categories, calendarEvents, sidebarEvents, allEvents, calendarLocale, } = createTripDto;
        const trip = new trip_entity_1.Trip();
        trip.name = name;
        trip.dateRange = dateRange;
        trip.categories = categories;
        trip.calendarEvents = calendarEvents;
        trip.sidebarEvents = sidebarEvents;
        trip.allEvents = allEvents;
        trip.calendarLocale = calendarLocale;
        trip.user = user;
        try {
            await trip.save();
        }
        catch (error) {
            if (Number(error.code) === 23505) {
                throw new common_1.ConflictException("Trip already exists");
            }
            else {
                throw new common_1.InternalServerErrorException();
            }
        }
        return trip;
    }
    async upsertTrip(createTripDto, user) {
        const { name } = createTripDto;
        const query = this.createQueryBuilder("trip");
        query.andWhere("trip.name = :name", { name });
        query.andWhere("(trip.userId = :userId)", {
            userId: user.id,
        });
        const trips = await query.getMany();
        if (trips.length == 0)
            return await this.createTrip(createTripDto, user);
        else
            return await this.updateTrip(createTripDto, trips[0], user);
    }
    async updateTrip(updateTripDto, trip, user) {
        const { name, dateRange, categories, calendarEvents, sidebarEvents, allEvents, calendarLocale, } = updateTripDto;
        if (name)
            trip.name = name;
        if (dateRange)
            trip.dateRange = dateRange;
        if (categories)
            trip.categories = categories;
        if (calendarEvents)
            trip.calendarEvents = calendarEvents;
        if (sidebarEvents)
            trip.sidebarEvents = sidebarEvents;
        if (allEvents)
            trip.allEvents = allEvents;
        if (calendarLocale)
            trip.calendarLocale = calendarLocale;
        if (user)
            trip.user = user;
        trip.lastUpdateAt = new Date();
        try {
            await trip.save();
        }
        catch (error) {
            if (Number(error.code) === 23505) {
                throw new common_1.ConflictException("Trip already exists");
            }
            else {
                throw new common_1.InternalServerErrorException();
            }
        }
        return trip;
    }
    async getTrips(filterDto, user) {
        const { search } = filterDto;
        const query = this.createQueryBuilder("trip");
        if (search)
            query.where("(trip.name LIKE :search)", { search: `%${search}%` });
        query.andWhere("(trip.userId = :userId)", {
            userId: user.id,
        });
        try {
            const trips = await query.getMany();
            return trips;
        }
        catch (error) {
            this.logger.error(`Failed to get trips . Filters: ${JSON.stringify(filterDto)}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
    async _getTripByName(name, user) {
        return await this.createQueryBuilder("trip")
            .where("LOWER(trip.name) = LOWER(:name)", { name })
            .andWhere("(trip.userId = :userId)", {
            userId: user.id,
        })
            .getOne();
    }
};
TripRepository = __decorate([
    typeorm_1.EntityRepository(trip_entity_1.Trip)
], TripRepository);
exports.TripRepository = TripRepository;
//# sourceMappingURL=trip.repository.js.map