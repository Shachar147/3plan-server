"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const tournament_entity_1 = require("./tournament.entity");
let TournamentRepository = class TournamentRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('TournamentRepository');
    }
    async createRecord(createDto, winner, teams, mvpPlayer, gamesHistory, user) {
        var _a;
        const { addedAt } = createDto;
        const record = this.create();
        record.addedAt = addedAt;
        record.winner = winner;
        record.teams = teams;
        record.numberOfTeams = teams.length;
        record.gamesHistory = gamesHistory;
        record.mvpPlayer = mvpPlayer;
        record.user = user;
        try {
            await record.save();
        }
        catch (error) {
            if (Number(error.code) === 23505) {
                throw new common_1.ConflictException('Record already exists');
            }
            else {
                console.error(error);
                throw new common_1.InternalServerErrorException();
            }
        }
        delete record.user;
        record['winner_name'] = (_a = record.winner) === null || _a === void 0 ? void 0 : _a.name;
        delete record.winner;
        const teams_names = [];
        record.teams.forEach((iter) => {
            teams_names.push(iter.name);
        });
        delete record.teams;
        record['teams_names'] = teams_names;
        return record;
    }
    async updateRecord(record, updateDto, winnerPlayer) {
        var _a;
        const { winner } = updateDto;
        if (winnerPlayer)
            record.winner = winnerPlayer;
        try {
            await record.save();
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        record['winner_name'] = (_a = record.winner) === null || _a === void 0 ? void 0 : _a.name;
        delete record.winner;
        return record;
    }
    async listRecords(filterDto, user) {
        const { winner, numberOfTeams } = filterDto;
        const query = this.createQueryBuilder('tournament');
        if (numberOfTeams)
            query.andWhere('(tournament.numberOfTeams = :numberOfTeams)', {
                numberOfTeams,
            });
        query.andWhere('(tournament.userId = :userId)', { userId: user.id });
        query.orderBy('tournament.id', 'ASC');
        query.leftJoinAndSelect('tournament.winner', 'team');
        if (winner)
            query.andWhere('(team.name = :winner)', { winner });
        query.leftJoinAndSelect('tournament.teams', 'team as t2');
        query.leftJoinAndSelect('tournament.mvpPlayer', 'player');
        try {
            const records = await query.getMany();
            records.forEach((iter) => {
                var _a, _b;
                iter['winnerName'] = (_a = iter.winner) === null || _a === void 0 ? void 0 : _a.name;
                delete iter.winner;
                iter['teamsNames'] = iter.teams.map((iter) => iter.name);
                delete iter.teams;
                iter['mvpPlayerName'] = (_b = iter === null || iter === void 0 ? void 0 : iter.mvpPlayer) === null || _b === void 0 ? void 0 : _b.name;
                delete iter.mvpPlayer;
            });
            return records;
        }
        catch (error) {
            this.logger.error(`Failed to get records . Filters: ${JSON.stringify(filterDto)}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
};
TournamentRepository = __decorate([
    typeorm_1.EntityRepository(tournament_entity_1.Tournament)
], TournamentRepository);
exports.TournamentRepository = TournamentRepository;
//# sourceMappingURL=tournament.repository.js.map