"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneOnOneRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const one_on_one_entity_1 = require("./one-on-one.entity");
const class_validator_1 = require("class-validator");
let OneOnOneRepository = class OneOnOneRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('OneOnOneRepository');
    }
    async createRecord(createOneOnOneDto, player1, player2, user) {
        const { score1, score2, total_overtimes, is_comeback } = createOneOnOneDto;
        const oneOnOne = this.create();
        oneOnOne.player1 = player1;
        oneOnOne.player2 = player2;
        oneOnOne.score1 = score1;
        oneOnOne.score2 = score2;
        oneOnOne.user = user;
        oneOnOne.total_overtimes = total_overtimes;
        oneOnOne.is_comeback = is_comeback;
        try {
            await oneOnOne.save();
        }
        catch (error) {
            console.error(`error: ${error}`);
            throw new common_1.InternalServerErrorException();
        }
        delete oneOnOne.user;
        return oneOnOne;
    }
    async updateRecord(record, updateOneOnOneDto) {
        const { score1, score2, is_comeback, total_overtimes } = updateOneOnOneDto;
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
        const query = this.createQueryBuilder('one_on_one');
        if (player)
            query.where('(one_on_one.player1Id = :id OR one_on_one.player2Id = :id)', { id: player.id });
        if (winner)
            query.andWhere('((one_on_one.player1Id = :id AND one_on_one.score1 > one_on_one.score2) OR (one_on_one.player2Id = :id AND one_on_one.score2 > one_on_one.score1))', { id: winner.id });
        if (loser)
            query.andWhere('((one_on_one.player1Id = :id AND one_on_one.score1 < one_on_one.score2) OR (one_on_one.player2Id = :id AND one_on_one.score2 < one_on_one.score1))', { id: loser.id });
        if (score1)
            query.andWhere('(one_on_one.score1 = :score1)', { score1 });
        if (class_validator_1.isDefined(is_comeback))
            query.andWhere('(one_on_one.is_comeback = :is_comeback)', {
                is_comeback,
            });
        if (class_validator_1.isDefined(total_overtimes))
            query.andWhere('(one_on_one.total_overtimes = :total_overtimes)', {
                total_overtimes,
            });
        if (score2)
            query.andWhere('(one_on_one.score2 = :score2)', { score2 });
        if (diff)
            query.andWhere('((one_on_one.score2 - one_on_one.score1 = :diff) OR (one_on_one.score1 - one_on_one.score2 = :diff))', { diff });
        query.andWhere('(one_on_one.userId = :userId)', { userId: user.id });
        query.leftJoinAndSelect('one_on_one.player1', 'player as p');
        query.leftJoinAndSelect('one_on_one.player2', 'player');
        query.orderBy('one_on_one.id', 'ASC');
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
OneOnOneRepository = __decorate([
    typeorm_1.EntityRepository(one_on_one_entity_1.OneOnOne)
], OneOnOneRepository);
exports.OneOnOneRepository = OneOnOneRepository;
//# sourceMappingURL=one-on-one.repository.js.map