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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const random_repository_1 = require("./random.repository");
const player_service_1 = require("../../player/player.service");
const class_validator_1 = require("class-validator");
const team_service_1 = require("../../team/team.service");
let RandomService = class RandomService {
    constructor(randomRepository, teamService, playerService) {
        this.randomRepository = randomRepository;
        this.teamService = teamService;
        this.playerService = playerService;
        this.logger = new common_1.Logger('RandomService');
    }
    async createRecord(createDto, user) {
        var _a;
        const name1 = createDto.team1;
        const name2 = createDto.team2;
        ['team1', 'team2', 'score1', 'score2'].forEach((iter) => {
            if (createDto[iter] == undefined) {
                throw new common_1.BadRequestException(`${iter} : missing`);
            }
        });
        const mvp_player_name = createDto.mvp_player;
        const team1 = await this.teamService.getTeamByName(name1);
        const team2 = await this.teamService.getTeamByName(name2);
        const mvp_player = mvp_player_name
            ? await this.playerService.getPlayerByName(mvp_player_name)
            : undefined;
        if (mvp_player) {
            const { score1, score2 } = createDto;
            const winner_team = score1 > score2 ? team1 : score2 < score1 ? team2 : undefined;
            if (winner_team &&
                mvp_player.team.name !== winner_team.name &&
                ((_a = mvp_player === null || mvp_player === void 0 ? void 0 : mvp_player.allStarTeam) === null || _a === void 0 ? void 0 : _a.name) !== winner_team.name) {
                throw new common_1.BadRequestException({
                    statusCode: 404,
                    error: 'Not Found',
                    message: 'MVP must be from the winning team',
                });
            }
        }
        const record = await this.randomRepository.createRecord(createDto, team1, team2, mvp_player, user);
        const listDto = {};
        const stats = await this.listRecordsByTeam(listDto, user);
        const toReturn = {};
        toReturn[name1] = stats[name1];
        toReturn[name2] = stats[name2];
        return toReturn;
    }
    async deleteRecord(id, user) {
        const result = await this.randomRepository.delete({
            id: id,
            userId: user.id,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        return result;
    }
    async updateRecord(id, updateRandomDto, user) {
        var _a;
        const record = await this.randomRepository.findOne({
            id: id,
            userId: user.id,
        });
        const team1 = await this.teamService.getTeam(record.team1Id);
        const team2 = await this.teamService.getTeam(record.team2Id);
        if (!class_validator_1.isDefined(updateRandomDto.score1) &&
            !class_validator_1.isDefined(updateRandomDto.score2)) {
            throw new common_1.BadRequestException(`You have to pass fields to update`);
        }
        const { mvp_player } = updateRandomDto;
        let playerObj = class_validator_1.isDefined(mvp_player)
            ? await this.playerService.getPlayerByNameFull(mvp_player)
            : undefined;
        const validate_mvp = playerObj;
        let score1 = class_validator_1.isDefined(updateRandomDto.score1)
            ? updateRandomDto.score1
            : record.score1;
        let score2 = class_validator_1.isDefined(updateRandomDto.score2)
            ? updateRandomDto.score2
            : record.score2;
        score1 = Number(score1);
        score2 = Number(score2);
        const winner_team = score1 > score2 ? team1 : score2 > score1 ? team2 : undefined;
        if (winner_team &&
            validate_mvp &&
            validate_mvp.team.name !== winner_team.name &&
            ((_a = validate_mvp === null || validate_mvp === void 0 ? void 0 : validate_mvp.allStarTeam) === null || _a === void 0 ? void 0 : _a.name) !== winner_team.name) {
            playerObj = undefined;
        }
        const updated = await this.randomRepository.updateRecord(record, updateRandomDto, playerObj);
        const listDto = {};
        const stats = await this.listRecordsByTeam(listDto, user);
        const toReturn = {};
        toReturn[team1.name] = stats[team1.name];
        toReturn[team2.name] = stats[team2.name];
        return toReturn;
    }
    async listRecords(filterDto, user) {
        const { team, mvp_player, winner_name, loser_name } = filterDto;
        const playerObj = class_validator_1.isDefined(mvp_player)
            ? await this.playerService.getPlayerByName(mvp_player)
            : undefined;
        const teamObj = class_validator_1.isDefined(team)
            ? await this.teamService.getTeamByName(team)
            : undefined;
        const winnerObj = class_validator_1.isDefined(winner_name)
            ? await this.teamService.getTeamByName(winner_name)
            : undefined;
        const loserObj = class_validator_1.isDefined(loser_name)
            ? await this.teamService.getTeamByName(loser_name)
            : undefined;
        const records = await this.randomRepository.listRecords(filterDto, user, teamObj, playerObj, loserObj, winnerObj);
        records.map((iter) => {
            var _a;
            iter['team1_name'] = iter.team1.name;
            iter['team2_name'] = iter.team2.name;
            iter['mvp_player_name'] = ((_a = iter === null || iter === void 0 ? void 0 : iter.mvp_player) === null || _a === void 0 ? void 0 : _a.name) || null;
            delete iter.team1;
            delete iter.team2;
            delete iter.mvp_player;
            return iter;
        });
        return records;
    }
    async listRecordsByTeam(filterDto, user) {
        const { team, mvp_player, winner_name, loser_name } = filterDto;
        const playerObj = class_validator_1.isDefined(mvp_player)
            ? await this.playerService.getPlayerByName(mvp_player)
            : undefined;
        const teamObj = class_validator_1.isDefined(team)
            ? await this.teamService.getTeamByName(team)
            : undefined;
        const winnerObj = class_validator_1.isDefined(winner_name)
            ? await this.teamService.getTeamByName(winner_name)
            : undefined;
        const loserObj = class_validator_1.isDefined(loser_name)
            ? await this.teamService.getTeamByName(loser_name)
            : undefined;
        const records = await this.randomRepository.listRecords(filterDto, user, teamObj, playerObj, loserObj, winnerObj);
        const teams = {};
        const baseStats = {
            total_wins: 0,
            total_lost: 0,
            total_win_percents: 0,
            total_home_games: 0,
            total_away_games: 0,
            total_diff: 0,
            total_diff_per_game: 0,
            total_games: 0,
            total_scored: 0,
            total_suffered: 0,
            total_knockouts: 0,
            total_suffered_knockouts: 0,
            win_streak: 0,
            lose_streak: 0,
            total_2k_ratings: 0,
            total_won_comebacks: 0,
            total_lost_comebacks: 0,
            total_overtimes: 0,
            total_home_wins: 0,
            total_home_lost: 0,
            total_road_wins: 0,
            total_road_lost: 0,
        };
        const streaks = {};
        records.forEach((record) => {
            const team1 = record.team1.name;
            const team2 = record.team2.name;
            const _2k_rating1 = 0;
            const _2k_rating2 = 0;
            delete record.team1;
            delete record.team2;
            record['team1_name'] = team1;
            record['team2_name'] = team2;
            teams[team1] = class_validator_1.isDefined(teams[team1])
                ? teams[team1]
                : Object.assign({}, baseStats);
            teams[team2] = class_validator_1.isDefined(teams[team2])
                ? teams[team2]
                : Object.assign({}, baseStats);
            teams[team1]['records'] = class_validator_1.isDefined(teams[team1]['records'])
                ? teams[team1]['records']
                : [];
            teams[team1]['records'].push(record);
            if (team1 !== team2) {
                teams[team2]['records'] = class_validator_1.isDefined(teams[team2]['records'])
                    ? teams[team2]['records']
                    : [];
                teams[team2]['records'].push(record);
            }
            teams[team1]['total_games'] += 1;
            if (team1 !== team2) {
                teams[team2]['total_games'] += 1;
            }
            const { score1, score2 } = record;
            if (team1 !== team2) {
                if (score1 > score2) {
                    teams[team1]['total_wins'] += 1;
                    teams[team2]['total_lost'] += 1;
                    teams[team2]['lose_streak'] += 1;
                    teams[team1]['win_streak'] += 1;
                    streaks[team1] = class_validator_1.isDefined(streaks[team1])
                        ? streaks[team1]
                        : { wins: [], lose: [] };
                    streaks[team1]['lose'].push(teams[team1]['lose_streak']);
                    teams[team1]['lose_streak'] = 0;
                    streaks[team2] = class_validator_1.isDefined(streaks[team2])
                        ? streaks[team2]
                        : { wins: [], lose: [] };
                    streaks[team2]['wins'].push(teams[team2]['win_streak']);
                    teams[team2]['win_streak'] = 0;
                    if (record.is_comeback) {
                        teams[team1].total_won_comebacks++;
                        teams[team2].total_lost_comebacks++;
                    }
                }
                else {
                    teams[team2]['total_wins'] += 1;
                    teams[team1]['total_lost'] += 1;
                    teams[team1]['lose_streak'] += 1;
                    teams[team2]['win_streak'] += 1;
                    streaks[team2] = class_validator_1.isDefined(streaks[team2])
                        ? streaks[team2]
                        : { wins: [], lose: [] };
                    streaks[team2]['lose'].push(teams[team2]['lose_streak']);
                    teams[team2]['lose_streak'] = 0;
                    streaks[team1] = class_validator_1.isDefined(streaks[team1])
                        ? streaks[team1]
                        : { wins: [], lose: [] };
                    streaks[team1]['wins'].push(teams[team1]['win_streak']);
                    teams[team1]['win_streak'] = 0;
                    if (record.is_comeback) {
                        teams[team2].total_won_comebacks++;
                        teams[team1].total_lost_comebacks++;
                    }
                }
            }
            teams[team1].total_overtimes += record.total_overtimes;
            teams[team2].total_overtimes += record.total_overtimes;
            if (team1 !== team2) {
                teams[team1]['total_2k_ratings'] += _2k_rating2;
                teams[team2]['total_2k_ratings'] += _2k_rating1;
                teams[team1]['avg_2k_rating'] =
                    teams[team1]['total_2k_ratings'] / teams[team1]['total_games'];
                teams[team2]['avg_2k_rating'] =
                    teams[team2]['total_2k_ratings'] / teams[team2]['total_games'];
            }
            teams[team1]['total_scored'] += score1;
            teams[team1]['total_suffered'] += score2;
            teams[team2]['total_scored'] += score2;
            teams[team2]['total_suffered'] += score1;
            teams[team1]['total_diff'] += score1 - score2;
            teams[team2]['total_diff'] += score2 - score1;
            if (team1 !== team2) {
                teams[team2]['total_home_games'] += 1;
                teams[team1]['total_away_games'] += 1;
                if (score2 >= score1) {
                    teams[team2]['total_home_wins'] += 1;
                    teams[team1]['total_road_lost'] += 1;
                }
                else {
                    teams[team1]['total_road_wins'] += 1;
                    teams[team2]['total_home_lost'] += 1;
                }
            }
            teams[team1]['total_win_percents'] =
                teams[team1]['total_games'] === 0
                    ? '0.00%'
                    : ((teams[team1]['total_wins'] / teams[team1]['total_games']) *
                        100).toFixed(2) + '%';
            teams[team2]['total_win_percents'] =
                teams[team2]['total_games'] === 0
                    ? '0.00%'
                    : ((teams[team2]['total_wins'] / teams[team2]['total_games']) *
                        100).toFixed(2) + '%';
            teams[team1]['total_diff_per_game'] = (teams[team1]['total_diff'] / teams[team1]['total_games']).toFixed(2);
            teams[team2]['total_diff_per_game'] = (teams[team2]['total_diff'] / teams[team2]['total_games']).toFixed(2);
            if (Number(score2) === 0 && Number(score1) !== 0) {
                teams[team2]['total_suffered_knockouts'] += 1;
                teams[team1]['total_knockouts'] += 1;
            }
            else if (Number(score1) === 0 && Number(score2) !== 0) {
                teams[team1]['total_suffered_knockouts'] += 1;
                teams[team2]['total_knockouts'] += 1;
            }
        });
        Object.keys(teams).forEach((team) => {
            streaks[team]['wins'].push(teams[team]['win_streak']);
            streaks[team]['lose'].push(teams[team]['lose_streak']);
            const wins = streaks[team]['wins'];
            const lose = streaks[team]['lose'];
            teams[team].max_win_streak = Math.max(...wins);
            teams[team].max_lose_streak = Math.max(...lose);
            teams[team].streaks = streaks[team];
        });
        return teams;
    }
    async listRecordsByDate(date, filterDto, user) {
        const { team, mvp_player, winner_name, loser_name } = filterDto;
        const playerObj = class_validator_1.isDefined(mvp_player)
            ? await this.playerService.getPlayerByName(mvp_player)
            : undefined;
        const teamObj = class_validator_1.isDefined(team)
            ? await this.teamService.getTeamByName(team)
            : undefined;
        const winnerObj = class_validator_1.isDefined(winner_name)
            ? await this.teamService.getTeamByName(winner_name)
            : undefined;
        const loserObj = class_validator_1.isDefined(loser_name)
            ? await this.teamService.getTeamByName(loser_name)
            : undefined;
        const records = await this.randomRepository.listRecordsByDate(date, filterDto, user, teamObj, playerObj, loserObj, winnerObj);
        records.map((iter) => {
            var _a;
            iter['team1_name'] = iter.team1.name;
            iter['team2_name'] = iter.team2.name;
            iter['mvp_player_name'] = ((_a = iter === null || iter === void 0 ? void 0 : iter.mvp_player) === null || _a === void 0 ? void 0 : _a.name) || null;
            delete iter.team1;
            delete iter.team2;
            delete iter.mvp_player;
            return iter;
        });
        return records;
    }
};
RandomService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(random_repository_1.RandomRepository)),
    __metadata("design:paramtypes", [random_repository_1.RandomRepository,
        team_service_1.TeamService, typeof (_a = typeof player_service_1.PlayerService !== "undefined" && player_service_1.PlayerService) === "function" ? _a : Object])
], RandomService);
exports.RandomService = RandomService;
//# sourceMappingURL=random.service.js.map