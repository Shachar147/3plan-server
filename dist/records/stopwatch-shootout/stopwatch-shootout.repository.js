"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StopwatchShootoutRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const stopwatch_shootout_entity_1 = require("./stopwatch-shootout.entity");
const class_validator_1 = require("class-validator");
let StopwatchShootoutRepository = class StopwatchShootoutRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('StopwatchShootoutRepository');
    }
    async createRecord(createStopwatchShootoutDto, player, user) {
        const { score, roundLength } = createStopwatchShootoutDto;
        const record = this.create();
        record.player = player;
        record.score = score;
        record.roundLength = roundLength;
        record.user = user;
        try {
            await record.save();
        }
        catch (error) {
            console.log(error);
            throw new common_1.InternalServerErrorException();
        }
        delete record.user;
        return record;
    }
    async updateRecord(record, updateStopwatchShootoutDto) {
        const { score } = updateStopwatchShootoutDto;
        if (class_validator_1.isDefined(score))
            record.score = score;
        try {
            await record.save();
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        return record;
    }
    async listRecords(filterDto, user, player) {
        const { score, roundLength } = filterDto;
        const query = this.createQueryBuilder('stopwatch_shootout');
        if (player)
            query.where('(stopwatch_shootout.playerId = :id)', { id: player.id });
        if (score)
            query.andWhere('(stopwatch_shootout.score = :score)', { score });
        if (roundLength)
            query.andWhere('(stopwatch_shootout.roundLength = :roundLength)', {
                roundLength,
            });
        query.andWhere('(stopwatch_shootout.userId = :userId)', {
            userId: user.id,
        });
        query.leftJoinAndSelect('stopwatch_shootout.player', 'player as p');
        query.orderBy('stopwatch_shootout.id', 'ASC');
        try {
            const records = await query.getMany();
            return records;
        }
        catch (error) {
            this.logger.error(`Failed to get records . Filters: ${JSON.stringify(filterDto)}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
};
StopwatchShootoutRepository = __decorate([
    typeorm_1.EntityRepository(stopwatch_shootout_entity_1.StopwatchShootout)
], StopwatchShootoutRepository);
exports.StopwatchShootoutRepository = StopwatchShootoutRepository;
//# sourceMappingURL=stopwatch-shootout.repository.js.map