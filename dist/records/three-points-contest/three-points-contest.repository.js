"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreePointsContestRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const three_points_contest_entity_1 = require("./three-points-contest.entity");
let ThreePointsContestRepository = class ThreePointsContestRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('ThreePointsContestRepository');
    }
    async createRecord(createThreePointsContestDto, team1, team2, computers, randoms, winner, user) {
        const { computerLevel, leaderboard, roundLength, scoresHistory, } = createThreePointsContestDto;
        const record = this.create();
        record.team1 = team1;
        record.team2 = team2;
        record.computers = computers.map((x) => x.name);
        record.randoms = randoms.map((x) => x.name);
        record.computerLevel = computerLevel;
        record.leaderboard = leaderboard;
        record.roundLength = roundLength;
        record.scoresHistory = scoresHistory;
        record.winner = winner;
        record.user = user;
        try {
            await record.save();
        }
        catch (error) {
            console.log(error);
            throw new common_1.InternalServerErrorException();
        }
        record['team1_players'] = record.team1.map((x) => x.name);
        record['team2_players'] = record.team2.map((x) => x.name);
        delete record.team1;
        delete record.team2;
        delete record.user;
        return record;
    }
    async listRecords(filterDto, user, playerObj, winnerObj, computersObj, randomsObj) {
        const { computerLevel, roundLength, player, players } = filterDto;
        const query = this.createQueryBuilder('three-points-contest');
        if (computerLevel)
            query.where('(three-points-contest.computerLevel = :computerLevel)', {
                computerLevel: computerLevel,
            });
        if (roundLength)
            query.where('(three-points-contest.roundLength = :roundLength)', {
                roundLength: roundLength,
            });
        if (winnerObj)
            query.where('(three-points-contest.winnerId = :id)', {
                id: winnerObj.id,
            });
        query.andWhere('(three-points-contest.userId = :userId)', {
            userId: user.id,
        });
        query.leftJoinAndSelect('three-points-contest.winner', 'player as p');
        query.leftJoinAndSelect('three-points-contest.team1', 'player as p1');
        query.leftJoinAndSelect('three-points-contest.team2', 'player as p2');
        query.orderBy('three-points-contest.id', 'ASC');
        try {
            let records = await query.getMany();
            const comp_names = computersObj ? computersObj.map((x) => x.name) : [];
            const rand_names = randomsObj ? randomsObj.map((x) => x.name) : [];
            const player_names = players || [];
            if (player && player_names.indexOf(player) === -1)
                player_names.push(player);
            records = records.filter((record) => {
                if (comp_names && comp_names.length > 0) {
                    const matches = record.computers.filter((e) => comp_names.indexOf(e) !== -1);
                    if (matches.length !== comp_names.length)
                        return false;
                }
                if (rand_names && rand_names.length > 0) {
                    const matches = record.randoms.filter((e) => rand_names.indexOf(e) !== -1);
                    if (matches.length !== rand_names.length)
                        return false;
                }
                if (player_names && player_names.length > 0) {
                    const matches = [
                        ...record.team1.map((x) => x.name),
                        ...record.team2.map((x) => x.name),
                    ].filter((e) => player_names.indexOf(e) !== -1);
                    if (matches.length !== player_names.length)
                        return false;
                }
                return true;
            });
            records = records.map((record) => {
                if (record.winner) {
                    record['winner_name'] = record.winner.name;
                    delete record.winner;
                }
                record['team1_players'] = record.team1.map((x) => x.name);
                record['team2_players'] = record.team2.map((x) => x.name);
                delete record.team1;
                delete record.team2;
                return record;
            });
            return records;
        }
        catch (error) {
            this.logger.error(`Failed to get records . Filters: ${JSON.stringify(filterDto)}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
};
ThreePointsContestRepository = __decorate([
    typeorm_1.EntityRepository(three_points_contest_entity_1.ThreePointsContest)
], ThreePointsContestRepository);
exports.ThreePointsContestRepository = ThreePointsContestRepository;
//# sourceMappingURL=three-points-contest.repository.js.map