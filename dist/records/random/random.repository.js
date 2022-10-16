"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const random_entity_1 = require("./random.entity");
const class_validator_1 = require("class-validator");
const utils_1 = require("../../shared/utils");
let RandomRepository = class RandomRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('RandomRepository');
    }
    async createRecord(createRandomDto, team1, team2, mvp_player, user) {
        const { score1, score2, is_comeback, total_overtimes } = createRandomDto;
        const random = this.create();
        random.team1 = team1;
        random.team2 = team2;
        random.score1 = score1;
        random.score2 = score2;
        random.mvp_player = mvp_player;
        random.user = user;
        random.is_comeback = is_comeback;
        random.total_overtimes = total_overtimes;
        try {
            await random.save();
        }
        catch (error) {
            console.log(error);
            throw new common_1.InternalServerErrorException();
        }
        delete random.team1.players;
        delete random.team2.players;
        delete random.user;
        return random;
    }
    async updateRecord(record, updateRandomDto, mvp_player) {
        const { score1, score2, is_comeback, total_overtimes } = updateRandomDto;
        if (class_validator_1.isDefined(score1))
            record.score1 = score1;
        if (class_validator_1.isDefined(score2))
            record.score2 = score2;
        if (class_validator_1.isDefined(mvp_player))
            record.mvp_player = mvp_player;
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
    async listRecords(filterDto, user, team, mvp_player, loser, winner) {
        const { score1, score2, diff, is_comeback, total_overtimes } = filterDto;
        const query = this.createQueryBuilder('random');
        if (team)
            query.where('(random.team1Id = :id OR random.team2Id = :id)', {
                id: team.id,
            });
        if (mvp_player)
            query.where('(random.mvpPlayerId = :id)', { id: mvp_player.id });
        if (winner)
            query.andWhere('((random.team1Id = :id AND random.score1 > random.score2) OR (random.team2Id = :id AND random.score2 > random.score1))', { id: winner.id });
        if (loser)
            query.andWhere('((random.team1Id = :id AND random.score1 < random.score2) OR (random.team2Id = :id AND random.score2 < random.score1))', { id: loser.id });
        if (score1)
            query.andWhere('(random.score1 = :score1)', { score1 });
        if (score2)
            query.andWhere('(random.score2 = :score2)', { score2 });
        if (class_validator_1.isDefined(is_comeback))
            query.andWhere('(random.is_comeback = :is_comeback)', { is_comeback });
        if (class_validator_1.isDefined(total_overtimes))
            query.andWhere('(random.total_overtimes = :total_overtimes)', {
                total_overtimes,
            });
        if (diff)
            query.andWhere('((random.score2 - random.score1 = :diff) OR (random.score1 - random.score2 = :diff))', { diff });
        query.andWhere('(random.userId = :userId)', { userId: user.id });
        query.leftJoinAndSelect('random.team1', 'team as t');
        query.leftJoinAndSelect('random.team2', 'team');
        query.leftJoinAndSelect('random.mvp_player', 'team as p');
        query.orderBy('random.id', 'ASC');
        try {
            const records = await query.getMany();
            return records;
        }
        catch (error) {
            this.logger.error(`Failed to get records . Filters: ${JSON.stringify(filterDto)}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
    async listRecordsByDate(date, filterDto, user, team, mvp_player, loser, winner) {
        const records = await this.listRecords(filterDto, user, team, mvp_player, loser, winner);
        const filtered = [];
        records.forEach((record) => {
            const dt = utils_1.formatDate(new Date(record.addedAt))
                .split('/')
                .reverse()
                .join('-');
            if (dt === date) {
                filtered.push(record);
            }
        });
        return filtered;
    }
};
RandomRepository = __decorate([
    typeorm_1.EntityRepository(random_entity_1.Random)
], RandomRepository);
exports.RandomRepository = RandomRepository;
//# sourceMappingURL=random.repository.js.map