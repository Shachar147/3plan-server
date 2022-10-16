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
exports.OneOnOneService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const one_on_one_repository_1 = require("./one-on-one.repository");
const player_service_1 = require("../../player/player.service");
const class_validator_1 = require("class-validator");
let OneOnOneService = class OneOnOneService {
    constructor(oneOnOneRepository, playerService) {
        this.oneOnOneRepository = oneOnOneRepository;
        this.playerService = playerService;
        this.logger = new common_1.Logger('OneOnOneService');
    }
    async createRecord(createDto, user) {
        const name1 = createDto.player1;
        const name2 = createDto.player2;
        ['player1', 'player2', 'score1', 'score2'].forEach((iter) => {
            if (createDto[iter] == undefined) {
                throw new common_1.BadRequestException(`${iter} : missing`);
            }
        });
        const player1 = await this.playerService.getPlayerByName(name1);
        const player2 = await this.playerService.getPlayerByName(name2);
        const record = await this.oneOnOneRepository.createRecord(createDto, player1, player2, user);
        const listDto = {};
        const stats = await this.listRecordsByPlayer(listDto, user);
        const toReturn = {};
        toReturn[name1] = stats[name1];
        toReturn[name2] = stats[name2];
        return toReturn;
    }
    async deleteRecord(id, user) {
        const result = await this.oneOnOneRepository.delete({
            id: id,
            userId: user.id,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        return result;
    }
    async updateRecord(id, updateOneOnOneDto, user) {
        const record = await this.oneOnOneRepository.findOne({
            id: id,
            userId: user.id,
        });
        if (!record) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        const player1 = await this.playerService.getPlayer(record.player1Id);
        const player2 = await this.playerService.getPlayer(record.player2Id);
        if (!class_validator_1.isDefined(updateOneOnOneDto.score1) &&
            !class_validator_1.isDefined(updateOneOnOneDto.score2)) {
            throw new common_1.BadRequestException(`You have to pass fields to update`);
        }
        const updated = await this.oneOnOneRepository.updateRecord(record, updateOneOnOneDto);
        const listDto = {};
        const stats = await this.listRecordsByPlayer(listDto, user);
        const toReturn = {};
        toReturn[player1.name] = stats[player1.name];
        toReturn[player2.name] = stats[player2.name];
        return toReturn;
    }
    async listRecords(filterDto, user) {
        const { player, winner_name, loser_name } = filterDto;
        const playerObj = class_validator_1.isDefined(player)
            ? await this.playerService.getPlayerByName(player)
            : undefined;
        const winnerObj = class_validator_1.isDefined(winner_name)
            ? await this.playerService.getPlayerByName(winner_name)
            : undefined;
        const loserObj = class_validator_1.isDefined(loser_name)
            ? await this.playerService.getPlayerByName(loser_name)
            : undefined;
        const records = await this.oneOnOneRepository.listRecords(filterDto, user, playerObj, loserObj, winnerObj);
        records.map((iter) => {
            iter['player1_name'] = iter.player1.name;
            iter['player2_name'] = iter.player2.name;
            delete iter.player1;
            delete iter.player2;
            return iter;
        });
        return records;
    }
    async listRecordsByPlayer(filterDto, user) {
        const { player, winner_name, loser_name } = filterDto;
        const playerObj = class_validator_1.isDefined(player)
            ? await this.playerService.getPlayerByName(player)
            : undefined;
        const winnerObj = class_validator_1.isDefined(winner_name)
            ? await this.playerService.getPlayerByName(winner_name)
            : undefined;
        const loserObj = class_validator_1.isDefined(loser_name)
            ? await this.playerService.getPlayerByName(loser_name)
            : undefined;
        const records = await this.oneOnOneRepository.listRecords(filterDto, user, playerObj, loserObj, winnerObj) || [];
        const players = {};
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
            const player1 = record['player1_name'] || record.player1.name;
            const player2 = record['player2_name'] || record.player2.name;
            const _2k_rating1 = record.player1._2k_rating;
            const _2k_rating2 = record.player2._2k_rating;
            delete record.player1;
            delete record.player2;
            record['player1_name'] = player1;
            record['player2_name'] = player2;
            players[player1] = class_validator_1.isDefined(players[player1])
                ? players[player1]
                : Object.assign({}, baseStats);
            players[player2] = class_validator_1.isDefined(players[player2])
                ? players[player2]
                : Object.assign({}, baseStats);
            players[player1]['records'] = class_validator_1.isDefined(players[player1]['records'])
                ? players[player1]['records']
                : [];
            players[player1]['records'].push(record);
            if (player1 !== player2) {
                players[player2]['records'] = class_validator_1.isDefined(players[player2]['records'])
                    ? players[player2]['records']
                    : [];
                players[player2]['records'].push(record);
            }
            players[player1]['total_games'] += 1;
            if (player1 !== player2) {
                players[player2]['total_games'] += 1;
            }
            const { score1, score2 } = record;
            if (player1 !== player2) {
                if (score1 > score2) {
                    players[player1]['total_wins'] += 1;
                    players[player2]['total_lost'] += 1;
                    players[player2]['lose_streak'] += 1;
                    players[player1]['win_streak'] += 1;
                    streaks[player1] = class_validator_1.isDefined(streaks[player1])
                        ? streaks[player1]
                        : { wins: [], lose: [] };
                    streaks[player1]['lose'].push(players[player1]['lose_streak']);
                    players[player1]['lose_streak'] = 0;
                    streaks[player2] = class_validator_1.isDefined(streaks[player2])
                        ? streaks[player2]
                        : { wins: [], lose: [] };
                    streaks[player2]['wins'].push(players[player2]['win_streak']);
                    players[player2]['win_streak'] = 0;
                    if (record.is_comeback) {
                        players[player1].total_won_comebacks++;
                        players[player2].total_lost_comebacks++;
                    }
                }
                else {
                    players[player2]['total_wins'] += 1;
                    players[player1]['total_lost'] += 1;
                    players[player1]['lose_streak'] += 1;
                    players[player2]['win_streak'] += 1;
                    streaks[player2] = class_validator_1.isDefined(streaks[player2])
                        ? streaks[player2]
                        : { wins: [], lose: [] };
                    streaks[player2]['lose'].push(players[player2]['lose_streak']);
                    players[player2]['lose_streak'] = 0;
                    streaks[player1] = class_validator_1.isDefined(streaks[player1])
                        ? streaks[player1]
                        : { wins: [], lose: [] };
                    streaks[player1]['wins'].push(players[player1]['win_streak']);
                    players[player1]['win_streak'] = 0;
                    if (record.is_comeback) {
                        players[player2].total_won_comebacks++;
                        players[player1].total_lost_comebacks++;
                    }
                }
            }
            players[player1].total_overtimes += record.total_overtimes;
            players[player2].total_overtimes += record.total_overtimes;
            if (player1 !== player2) {
                players[player1]['total_2k_ratings'] += _2k_rating2;
                players[player2]['total_2k_ratings'] += _2k_rating1;
                players[player1]['avg_2k_rating'] =
                    players[player1]['total_2k_ratings'] /
                        players[player1]['total_games'];
                players[player2]['avg_2k_rating'] =
                    players[player2]['total_2k_ratings'] /
                        players[player2]['total_games'];
            }
            players[player1]['total_scored'] += score1;
            players[player1]['total_suffered'] += score2;
            players[player2]['total_scored'] += score2;
            players[player2]['total_suffered'] += score1;
            players[player1]['total_diff'] += score1 - score2;
            players[player2]['total_diff'] += score2 - score1;
            if (player1 !== player2) {
                players[player2]['total_home_games'] += 1;
                players[player1]['total_away_games'] += 1;
                if (score2 > score1) {
                    players[player2]['total_home_wins'] += 1;
                    players[player1]['total_road_lost'] += 1;
                }
                else {
                    players[player1]['total_road_wins'] += 1;
                    players[player2]['total_home_lost'] += 1;
                }
            }
            players[player1]['total_win_percents'] =
                players[player1]['total_games'] === 0
                    ? '0.00%'
                    : ((players[player1]['total_wins'] /
                        players[player1]['total_games']) *
                        100).toFixed(2) + '%';
            players[player2]['total_win_percents'] =
                players[player2]['total_games'] === 0
                    ? '0.00%'
                    : ((players[player2]['total_wins'] /
                        players[player2]['total_games']) *
                        100).toFixed(2) + '%';
            players[player1]['total_diff_per_game'] = (players[player1]['total_diff'] / players[player1]['total_games']).toFixed(2);
            players[player2]['total_diff_per_game'] = (players[player2]['total_diff'] / players[player2]['total_games']).toFixed(2);
            if (Number(score2) === 0 && Number(score1) !== 0) {
                players[player2]['total_suffered_knockouts'] += 1;
                players[player1]['total_knockouts'] += 1;
            }
            else if (Number(score1) === 0 && Number(score2) !== 0) {
                players[player1]['total_suffered_knockouts'] += 1;
                players[player2]['total_knockouts'] += 1;
            }
        });
        Object.keys(players).forEach((player) => {
            streaks[player]['wins'].push(players[player]['win_streak']);
            streaks[player]['lose'].push(players[player]['lose_streak']);
            const wins = streaks[player]['wins'];
            const lose = streaks[player]['lose'];
            players[player].max_win_streak = Math.max(...wins);
            players[player].max_lose_streak = Math.max(...lose);
            players[player].streaks = streaks[player];
        });
        return players;
    }
};
OneOnOneService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(one_on_one_repository_1.OneOnOneRepository)),
    __metadata("design:paramtypes", [one_on_one_repository_1.OneOnOneRepository, typeof (_a = typeof player_service_1.PlayerService !== "undefined" && player_service_1.PlayerService) === "function" ? _a : Object])
], OneOnOneService);
exports.OneOnOneService = OneOnOneService;
//# sourceMappingURL=one-on-one.service.js.map