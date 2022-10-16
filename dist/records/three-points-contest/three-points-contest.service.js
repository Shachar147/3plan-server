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
exports.ThreePointsContestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const three_points_contest_repository_1 = require("./three-points-contest.repository");
const player_service_1 = require("../../player/player.service");
const class_validator_1 = require("class-validator");
const utils_1 = require("../../shared/utils");
let ThreePointsContestService = class ThreePointsContestService {
    constructor(threePointsContestRepository, playerService) {
        this.threePointsContestRepository = threePointsContestRepository;
        this.playerService = playerService;
        this.logger = new common_1.Logger('ThreePointsContestService');
    }
    async createRecord(createDto, user) {
        const { team1_players, team2_players, computer_players, random_players, winner_name, } = createDto;
        const team1 = [];
        for (let i = 0; i < team1_players.length; i++) {
            const player_name = team1_players[i];
            const player = await this.playerService.getPlayerByName(player_name);
            team1.push(player);
        }
        const team2 = [];
        for (let i = 0; i < team2_players.length; i++) {
            const player_name = team2_players[i];
            const player = await this.playerService.getPlayerByName(player_name);
            team2.push(player);
        }
        const computers = [];
        for (let i = 0; i < computer_players.length; i++) {
            const player_name = computer_players[i];
            const player = await this.playerService.getPlayerByName(player_name);
            computers.push(player);
        }
        const randoms = [];
        for (let i = 0; i < random_players.length; i++) {
            const player_name = random_players[i];
            const player = await this.playerService.getPlayerByName(player_name);
            randoms.push(player);
        }
        const all_players = [...team1, ...team2];
        const winner = await this.playerService.getPlayerByName(winner_name);
        const validation = all_players.filter((p) => {
            return p.id === winner.id;
        });
        if (validation.length === 0) {
            throw new common_1.BadRequestException(`winner_name must be one of the players from team1 or team2.`);
        }
        const record = await this.threePointsContestRepository.createRecord(createDto, team1, team2, computers, randoms, winner, user);
        const listDto = {};
        const stats = await this.listRecordsByPlayer(listDto, user);
        return stats;
    }
    async deleteRecord(id, user) {
        const result = await this.threePointsContestRepository.delete({
            id: id,
            userId: user.id,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        return result;
    }
    async listRecords(filterDto, user) {
        const { player, computer_players, random_players, winner_name, players, } = filterDto;
        const playerObj = class_validator_1.isDefined(player)
            ? await this.playerService.getPlayerByName(player)
            : undefined;
        const winnerObj = class_validator_1.isDefined(winner_name)
            ? await this.playerService.getPlayerByName(winner_name)
            : undefined;
        if (class_validator_1.isDefined(players)) {
            for (let i = 0; i < players.length; i++) {
                await this.playerService.getPlayerByName(players[i]);
            }
        }
        const computersObj = [];
        if (class_validator_1.isDefined(computer_players)) {
            for (let i = 0; i < computer_players.length; i++) {
                const name = computer_players[i];
                const computer = await this.playerService.getPlayerByName(name);
                computersObj.push(computer);
            }
        }
        const randomsObj = [];
        if (class_validator_1.isDefined(random_players)) {
            for (let i = 0; i < random_players.length; i++) {
                const random = await this.playerService.getPlayerByName(random_players[i]);
                randomsObj.push(random);
            }
        }
        const records = await this.threePointsContestRepository.listRecords(filterDto, user, playerObj, winnerObj, computersObj, randomsObj);
        return records;
    }
    async listRecordsByPlayer(filterDto, user) {
        const records = await this.listRecords(filterDto, user);
        const players = {};
        const computers = {};
        const baseStats = {
            total_wins: 0,
            total_lost: 0,
            total_games: 0,
            total_win_percents: 0,
            place: [],
            average_place: 0,
            records: [],
            total_scored: 0,
            total_from: 0,
            win_streak: 0,
            lose_streak: 0,
            total_randoms: 0,
            total_computers: 0,
            perfect_scores: 0,
            no_scores: 0,
            total_rounds: 0,
            max_perfect_scores_in_game: 0,
            max_no_scores_in_game: 0,
            average_perfect_scores_in_game: 0,
            perfect_scores_percents: 0,
            max_perfect_scores_in_game_date: '',
            max_perfect_scores_in_game_percents: '',
            max_perfect_scores_in_game_place: '',
            max_no_scores_in_game_date: '',
            max_no_scores_in_game_percents: '',
            max_no_scores_in_game_place: '',
            best_percentage_in_game: 0,
            best_percentage_in_game_shots: 0,
            best_percentage_in_game_attempts: 0,
            best_percentage_in_game_date: '',
            best_percentage_in_game_percents: '',
            best_percentage_in_game_place: '',
            worst_percentage_in_game: 999,
            worst_percentage_in_game_shots: 0,
            worst_percentage_in_game_attempts: 0,
            worst_percentage_in_game_date: '',
            worst_percentage_in_game_percents: '',
            worst_percentage_in_game_place: '',
        };
        const streaks = {};
        records.forEach((record) => {
            const team1_players = record['team1_players'];
            const team2_players = record['team2_players'];
            const all_players = [...team1_players, ...team2_players];
            all_players.forEach((player) => {
                players[player] = class_validator_1.isDefined(players[player])
                    ? players[player]
                    : utils_1.deepClone(baseStats);
                streaks[player] = class_validator_1.isDefined(streaks[player])
                    ? streaks[player]
                    : utils_1.deepClone({ wins: [], lose: [] });
                if (record.computers.indexOf(player) === -1) {
                    players[player].total_games++;
                    if (player === record['winner_name']) {
                        players[player].total_wins++;
                        players[player].win_streak++;
                        streaks[player]['lose'].push(players[player]['lose_streak']);
                        players[player].lose_streak = 0;
                    }
                    else {
                        players[player].total_lost++;
                        players[player].lose_streak++;
                        streaks[player]['wins'].push(players[player]['win_streak']);
                        players[player].win_streak = 0;
                    }
                    players[player].total_win_percents =
                        ((players[player].total_wins / players[player].total_games) *
                            100).toFixed(2) + '%';
                    players[player].records.push(record);
                }
            });
            record.randoms.forEach((player) => {
                if (players[player]) {
                    players[player].total_randoms++;
                }
            });
            record.computers.forEach((player) => {
                if (players[player]) {
                    players[player].total_computers++;
                }
            });
            Object.keys(record.leaderboard).forEach((place) => {
                const name = record.leaderboard[place].split(' (')[0];
                if (record.computers.indexOf(name) === -1) {
                    if (players[name]) {
                        players[name].place = players[name].place || [];
                        players[name].place.push(Number(place));
                        const sum = players[name].place.reduce((a, b) => a + b, 0);
                        const avg = (sum / players[name].place.length).toFixed(0) || 0;
                        players[name].average_place = Number(avg);
                    }
                }
            });
            Object.keys(record.scoresHistory).forEach((name) => {
                const player_name = name.split(' (')[0];
                if (record.computers.indexOf(player_name) === -1 &&
                    record.computers.indexOf(name) === -1) {
                    if (players[player_name]) {
                        const values = record.scoresHistory[name] || [0];
                        const sum = values.reduce((a, b) => a + b, 0);
                        players[player_name].total_scored += sum;
                        players[player_name].total_from +=
                            values.length * record.roundLength;
                        let perfect_scores_this_game = 0;
                        let no_scores_this_game = 0;
                        values.forEach((val) => {
                            if (val === record.roundLength) {
                                perfect_scores_this_game++;
                            }
                            else if (val === 0) {
                                no_scores_this_game++;
                            }
                        });
                        players[player_name].perfect_scores += perfect_scores_this_game;
                        players[player_name].no_scores += no_scores_this_game;
                        if (perfect_scores_this_game >
                            players[player_name].max_perfect_scores_in_game) {
                            players[player_name].max_perfect_scores_in_game = perfect_scores_this_game;
                            players[player_name].max_perfect_scores_in_game_date = utils_1.formatDate(new Date(record.addedAt));
                            players[player_name].max_perfect_scores_in_game_percents =
                                ((sum / (values.length * record.roundLength)) * 100).toFixed(2) + '%';
                            players[player_name].max_perfect_scores_in_game_place = 'N/A';
                            Object.keys(record.leaderboard).map((place) => {
                                if (record.leaderboard[place].split(' (')[0] === player_name) {
                                    players[player_name].max_perfect_scores_in_game_place =
                                        place +
                                            utils_1.nth(place) +
                                            ' out of ' +
                                            Object.keys(record.leaderboard).length;
                                }
                            });
                        }
                        if (no_scores_this_game > players[player_name].max_no_scores_in_game) {
                            players[player_name].max_no_scores_in_game = no_scores_this_game;
                            players[player_name].max_no_scores_in_game_date = utils_1.formatDate(new Date(record.addedAt));
                            players[player_name].max_no_scores_in_game_percents =
                                ((sum / (values.length * record.roundLength)) * 100).toFixed(2) + '%';
                            players[player_name].max_no_scores_in_game_place = 'N/A';
                            Object.keys(record.leaderboard).map((place) => {
                                if (record.leaderboard[place].split(' (')[0] === player_name) {
                                    players[player_name].max_no_scores_in_game_place =
                                        place +
                                            utils_1.nth(place) +
                                            ' out of ' +
                                            Object.keys(record.leaderboard).length;
                                }
                            });
                        }
                        players[player_name].total_rounds += values.length;
                        players[player_name].average_perfect_scores_in_game = (players[player_name].perfect_scores /
                            players[player_name].total_games).toFixed(2);
                        players[player_name].perfect_scores_percents =
                            ((players[player_name].perfect_scores /
                                players[player_name].total_rounds) *
                                100).toFixed(2) + '%';
                        const attempts = values.length * record.roundLength;
                        const curr_game_percents = ((sum / attempts) * 100).toFixed(2);
                        if (curr_game_percents > players[player_name].best_percentage_in_game) {
                            players[player_name].best_percentage_in_game = curr_game_percents;
                            players[player_name].best_percentage_in_game_date = utils_1.formatDate(new Date(record.addedAt));
                            players[player_name].best_percentage_in_game_percents =
                                curr_game_percents + '%';
                            players[player_name].best_percentage_in_game_shots = sum;
                            players[player_name].best_percentage_in_game_attempts = attempts;
                            players[player_name].best_percentage_in_game_place = 'N/A';
                            Object.keys(record.leaderboard).map((place) => {
                                if (record.leaderboard[place].split(' (')[0] === player_name) {
                                    players[player_name].best_percentage_in_game_place =
                                        place +
                                            utils_1.nth(place) +
                                            ' out of ' +
                                            Object.keys(record.leaderboard).length;
                                }
                            });
                        }
                        if (curr_game_percents < players[player_name].worst_percentage_in_game) {
                            players[player_name].worst_percentage_in_game = curr_game_percents;
                            players[player_name].worst_percentage_in_game_date = utils_1.formatDate(new Date(record.addedAt));
                            players[player_name].worst_percentage_in_game_percents =
                                curr_game_percents + '%';
                            players[player_name].worst_percentage_in_game_shots = sum;
                            players[player_name].worst_percentage_in_game_attempts = attempts;
                            players[player_name].worst_percentage_in_game_place = 'N/A';
                            Object.keys(record.leaderboard).map((place) => {
                                if (record.leaderboard[place].split(' (')[0] === player_name) {
                                    players[player_name].worst_percentage_in_game_place =
                                        place +
                                            utils_1.nth(place) +
                                            ' out of ' +
                                            Object.keys(record.leaderboard).length;
                                }
                            });
                        }
                    }
                }
            });
        });
        Object.keys(players).forEach((player) => {
            streaks[player]['wins'].push(players[player]['win_streak']);
            streaks[player]['lose'].push(players[player]['lose_streak']);
            players[player]['total_shot_average'] =
                players[player]['total_from'] === 0
                    ? 'N/A'
                    : ((players[player]['total_scored'] /
                        players[player]['total_from']) *
                        100).toFixed(2) + '%';
            const wins = streaks[player]['wins'];
            const lose = streaks[player]['lose'];
            players[player].max_win_streak = Math.max(...wins);
            players[player].max_lose_streak = Math.max(...lose);
            players[player].streaks = streaks[player];
            if (players[player].worst_percentage_in_game === 999) {
                players[player].worst_percentage_in_game = 0;
            }
        });
        return players;
    }
    async listRecordsStats(filterDto, user) {
        const records = await this.listRecords(filterDto, user);
        const stats = {};
        const base_stats = {
            total_games: 0,
            total_percents: 0,
            total_scored: 0,
            total_from: 0,
        };
        records.forEach((record) => {
            const dt = new Date(record.addedAt).toLocaleDateString();
            stats[dt] = stats[dt] || Object.assign({}, base_stats);
            stats[dt].total_games++;
            Object.keys(record.scoresHistory).forEach((name) => {
                const player_name = name.split(' (')[0];
                if (record.computers.indexOf(player_name) === -1 &&
                    record.computers.indexOf(name) === -1) {
                    const values = record.scoresHistory[name] || [0];
                    const sum = values.reduce((a, b) => a + b, 0);
                    stats[dt].total_scored += sum;
                    stats[dt].total_from += values.length * record.roundLength;
                    stats[dt].total_percents = ((stats[dt].total_scored / stats[dt].total_from) *
                        100).toFixed(2);
                }
            });
        });
        const days_with_most_games = Object.keys(stats).sort((a, b) => {
            return stats[b].total_games - stats[a].total_games;
        });
        const days_with_most_percents = Object.keys(stats).sort((a, b) => {
            return stats[b].total_percents - stats[a].total_percents;
        });
        const max_stats = {
            days_with_most_games: days_with_most_games.map((dt) => dt + ' - ' + stats[dt].total_games),
            days_with_most_percents: days_with_most_percents.map((dt) => dt + ' - ' + stats[dt].total_percents),
        };
        return { stats, max_stats };
    }
};
ThreePointsContestService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(three_points_contest_repository_1.ThreePointsContestRepository)),
    __metadata("design:paramtypes", [three_points_contest_repository_1.ThreePointsContestRepository, typeof (_a = typeof player_service_1.PlayerService !== "undefined" && player_service_1.PlayerService) === "function" ? _a : Object])
], ThreePointsContestService);
exports.ThreePointsContestService = ThreePointsContestService;
//# sourceMappingURL=three-points-contest.service.js.map