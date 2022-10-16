"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceJamRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const space_jam_entity_1 = require("./space-jam.entity");
let SpaceJamRepository = class SpaceJamRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('SpaceJamRepository');
    }
    async createRecord(createOneOnOneDto, player1, player2, user) {
        const { score1, score2, total_overtimes, is_comeback } = createOneOnOneDto;
        const record = this.create();
        record.player1 = player1.nickname;
        record.player2 = player2.nickname;
        record.score1 = score1;
        record.score2 = score2;
        record.user = user;
        record.total_overtimes = total_overtimes;
        record.is_comeback = is_comeback;
        try {
            await record.save();
        }
        catch (error) {
            console.error(`error: ${error}`);
            throw new common_1.InternalServerErrorException();
        }
        delete record.user;
        return record;
    }
    async updateRecord(record, updateDto) {
        const { score1, score2, is_comeback, total_overtimes } = updateDto;
        if (class_validator_1.isDefined(score1))
            record.score1 = score1;
        if (class_validator_1.isDefined(score2))
            record.score2 = score2;
        if (class_validator_1.isDefined(is_comeback))
            record.is_comeback = is_comeback;
        if (class_validator_1.isDefined(total_overtimes))
            record.total_overtimes = total_overtimes;
        try {
            await record.save();
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        return record;
    }
    async listRecords(filterDto, user, player, loser, winner) {
        const { score1, score2, diff, is_comeback, total_overtimes } = filterDto;
        const query = this.createQueryBuilder('space_jam_one_on_one');
        if (player)
            query.where('(space_jam_one_on_one.player1 = :player OR space_jam_one_on_one.player2 = :player)', { player: player });
        if (winner)
            query.andWhere('((space_jam_one_on_one.player1 = :player AND space_jam_one_on_one.score1 > space_jam_one_on_one.score2) OR (space_jam_one_on_one.player2 = :player AND space_jam_one_on_one.score2 > space_jam_one_on_one.score1))', { player: winner });
        if (loser)
            query.andWhere('((space_jam_one_on_one.player1 = :player AND space_jam_one_on_one.score1 < space_jam_one_on_one.score2) OR (space_jam_one_on_one.player2 = :player AND space_jam_one_on_one.score2 < space_jam_one_on_one.score1))', { player: loser });
        if (score1)
            query.andWhere('(space_jam_one_on_one.score1 = :score1)', { score1 });
        if (class_validator_1.isDefined(is_comeback))
            query.andWhere('(space_jam_one_on_one.is_comeback = :is_comeback)', {
                is_comeback,
            });
        if (class_validator_1.isDefined(total_overtimes))
            query.andWhere('(space_jam_one_on_one.total_overtimes = :total_overtimes)', {
                total_overtimes,
            });
        if (score2)
            query.andWhere('(space_jam_one_on_one.score2 = :score2)', { score2 });
        if (diff)
            query.andWhere('((space_jam_one_on_one.score2 - space_jam_one_on_one.score1 = :diff) OR (space_jam_one_on_one.score1 - space_jam_one_on_one.score2 = :diff))', { diff });
        query.andWhere('(space_jam_one_on_one.userId = :userId)', {
            userId: user.id,
        });
        query.orderBy('space_jam_one_on_one.id', 'ASC');
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
SpaceJamRepository = __decorate([
    typeorm_1.EntityRepository(space_jam_entity_1.SpaceJamOneOnOne)
], SpaceJamRepository);
exports.SpaceJamRepository = SpaceJamRepository;
//# sourceMappingURL=space-jam.repository.js.map