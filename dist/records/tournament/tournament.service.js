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
exports.TournamentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const tournament_repository_1 = require("./tournament.repository");
const class_validator_1 = require("class-validator");
const team_service_1 = require("../../team/team.service");
const tournament_game_type_1 = require("./tournament.game.type");
const player_service_1 = require("../../player/player.service");
const time_debugger_1 = require("../../shared/time.debugger");
let TournamentService = class TournamentService {
    constructor(tournamentRepository, teamService, playerService) {
        this.tournamentRepository = tournamentRepository;
        this.teamService = teamService;
        this.playerService = playerService;
        this.logger = new common_1.Logger('TournamentService');
    }
    async createRecord(createDto, user) {
        const { winner, teams, gamesHistory, mvpPlayer } = createDto;
        const winnerTeam = await this.teamService.getTeamByName(winner);
        console.timeEnd('.. getTeamByName (winner)');
        let mvpPlayerObj;
        if (mvpPlayer) {
            mvpPlayerObj = await this.playerService.getPlayerByName(mvpPlayer);
            console.timeEnd('.. getPlayerByName (mvp)');
        }
        const teamsHash = {};
        const teamsObjects = [];
        let team_name;
        try {
            for (let i = 0; i < teams.length; i++) {
                team_name = teams[i];
                const team = await this.teamService.getTeamByName(team_name);
                if (team == undefined) {
                    throw new common_1.NotFoundException(`Team with name '${team_name}' not found`);
                }
                teamsObjects.push(team);
                teamsHash[team_name] = team;
            }
        }
        catch (err) {
            throw new common_1.NotFoundException(`Team with name '${team_name}' not found`);
        }
        console.timeEnd('.. validate teams');
        if (teams.indexOf(winner) === -1) {
            throw new common_1.BadRequestException({
                status: 'error',
                code: '404',
                message: 'winner: invalid. (should be one of played teams)',
            });
        }
        if (!Array.isArray(gamesHistory)) {
            throw new common_1.BadRequestException({
                status: 'error',
                code: '404',
                message: 'gamesHistory: invalid. (should be ARRAY)',
            });
        }
        let is_hash;
        const games = [];
        for (let i = 0; i < gamesHistory.length; i++) {
            const game = gamesHistory[i];
            is_hash = typeof game === 'object' && !Array.isArray(game);
            if (!is_hash) {
                console.error('invalid game: ', game);
                throw new common_1.BadRequestException({
                    status: 'error',
                    code: '400',
                    message: 'gamesHistory: invalid game. (should be HASH)',
                });
            }
            const validateGame = tournament_game_type_1.validateTournamentType(game);
            if (validateGame !== '') {
                console.error('invalid game: ', game);
                throw new common_1.BadRequestException({
                    status: 'error',
                    code: '400',
                    message: 'gamesHistory: invalid game. [' + validateGame + ']',
                });
            }
            if (teams.indexOf(game.player1) === -1) {
                throw new common_1.BadRequestException({
                    status: 'error',
                    code: '400',
                    message: "gamesHistory: invalid game. [player1: Team '" +
                        game.player1 +
                        "' does not exist]",
                });
            }
            else if (teams.indexOf(game.player2) === -1) {
                throw new common_1.BadRequestException({
                    status: 'error',
                    code: '400',
                    message: "gamesHistory: invalid game. [player2: Team '" +
                        game.player2 +
                        "' does not exist]",
                });
            }
            let game_mvp_player;
            if (game.mvp_player) {
                game_mvp_player = await this.playerService.getPlayerByName(game.mvp_player);
            }
            const row = Object.assign({}, game);
            row.player1 = teamsHash[row.player1];
            row.player2 = teamsHash[row.player2];
            row.mvp_player = game_mvp_player;
            row.winner = teamsHash[row.winner];
            games.push(row);
        }
        console.timeEnd('.. validate games history');
        const record = await this.tournamentRepository.createRecord(createDto, winnerTeam, teamsObjects, mvpPlayerObj, gamesHistory, user);
        console.timeEnd('.. createRecord in the repository');
        return record;
    }
    async deleteRecord(id, user) {
        const result = await this.tournamentRepository.delete({
            id: id,
            userId: user.id,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        return result;
    }
    async updateRecord(id, updateDto, user) {
        const record = await this.tournamentRepository.findOne({
            id: id,
            userId: user.id,
        });
        if (!record) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        if (!class_validator_1.isDefined(updateDto.winner)) {
            throw new common_1.NotFoundException(`You have to pass fields to update`);
        }
        const { winner } = updateDto;
        const winnerPlayer = winner
            ? await this.teamService.getTeamByName(winner)
            : undefined;
        return await this.tournamentRepository.updateRecord(record, updateDto, winnerPlayer);
    }
    async listRecords(filterDto, user) {
        const records = await this.tournamentRepository.listRecords(filterDto, user);
        return records;
    }
    async getRecord(id, user) {
        const result = await this.tournamentRepository.findOne({
            id: id,
            userId: user.id,
        });
        if (!result) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        return result;
    }
    async listStats(filterDto, user) {
        const timeDebugger = new time_debugger_1.TimeDebugger();
        await timeDebugger.timeDebugMessage('Tournament Service - before listRecords');
        const tournaments = await this.listRecords(filterDto, user);
        await timeDebugger.timeDebugMessage('Tournament Service - after listRecords');
        const generalStats = {
            total_tournaments: 0,
            total_games: 0,
            total_knockouts: 0,
            total_overtimes: 0,
            total_comebacks: 0,
            total_scored: 0,
            mvps: {},
            tournament_mvps: {},
        };
        const baseStats = {
            total_games: 0,
            total_wins: 0,
            total_lost: 0,
            total_win_percents: 0,
            total_scored: 0,
            total_suffered: 0,
            win_streak: 0,
            lose_streak: 0,
            total_home_games: 0,
            total_away_games: 0,
            total_diff: 0,
            total_diff_per_game: 0,
            total_knockouts: 0,
            total_suffered_knockouts: 0,
            total_2k_ratings: 0,
            total_won_comebacks: 0,
            total_lost_comebacks: 0,
            total_overtimes: 0,
            total_home_wins: 0,
            total_home_lost: 0,
            total_road_wins: 0,
            total_road_lost: 0,
            total_comebacks: 0,
            total_suffered_comebacks: 0,
            total_tournaments: 0,
            total_tournament_wins: 0,
        };
        const teams = {};
        const streaks = {};
        tournaments.forEach((tournament) => {
            const records = Array.from(tournament.gamesHistory);
            records.forEach((record) => {
                const team1 = record.player1;
                const team2 = record.player2;
                const _2k_rating1 = 0;
                const _2k_rating2 = 0;
                record['team1_name'] = team1;
                record['team2_name'] = team2;
                record['addedAt'] = tournament['addedAt'];
                teams[team1] = class_validator_1.isDefined(teams[team1])
                    ? teams[team1]
                    : Object.assign({}, baseStats);
                teams[team2] = class_validator_1.isDefined(teams[team2])
                    ? teams[team2]
                    : Object.assign({}, baseStats);
                teams[team1]['matchups'] = teams[team1]['matchups'] || {};
                teams[team1]['records'] = teams[team1]['records'] || [];
                teams[team2]['matchups'] = teams[team2]['matchups'] || {};
                teams[team2]['records'] = teams[team2]['records'] || [];
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
                teams[team1].matchups[team2] = teams[team1].matchups[team2] || {
                    total: 0,
                    win: 0,
                    lose: 0,
                };
                teams[team2].matchups[team1] = teams[team2].matchups[team1] || {
                    total: 0,
                    win: 0,
                    lose: 0,
                };
                const { score1, score2 } = record;
                generalStats.total_scored += score1 + score2;
                if (team1 !== team2) {
                    if (score1 > score2) {
                        teams[team1]['total_wins'] += 1;
                        teams[team2]['total_lost'] += 1;
                        teams[team2]['lose_streak'] += 1;
                        teams[team1]['win_streak'] += 1;
                        teams[team1].matchups[team2]['lose']++;
                        teams[team2].matchups[team1]['win']++;
                        teams[team1].matchups[team2]['total']++;
                        teams[team2].matchups[team1]['total']++;
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
                            generalStats.total_comebacks++;
                        }
                    }
                    else {
                        teams[team2]['total_wins'] += 1;
                        teams[team1]['total_lost'] += 1;
                        teams[team1]['lose_streak'] += 1;
                        teams[team2]['win_streak'] += 1;
                        teams[team1].matchups[team2]['win']++;
                        teams[team2].matchups[team1]['lose']++;
                        teams[team1].matchups[team2]['total']++;
                        teams[team2].matchups[team1]['total']++;
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
                            generalStats.total_comebacks++;
                        }
                    }
                }
                teams[team1].total_overtimes += record.total_overtimes;
                teams[team2].total_overtimes += record.total_overtimes;
                generalStats.total_overtimes += record.total_overtimes;
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
                    generalStats.total_knockouts++;
                }
                else if (Number(score1) === 0 && Number(score2) !== 0) {
                    teams[team1]['total_suffered_knockouts'] += 1;
                    teams[team2]['total_knockouts'] += 1;
                    generalStats.total_knockouts++;
                }
                if (record.mvp_player) {
                    const mvp = record.mvp_player;
                    generalStats.mvps[mvp] = generalStats.mvps[mvp] || 0;
                    generalStats.mvps[mvp]++;
                }
            });
            teams[tournament['winnerName']].total_tournament_wins++;
            generalStats.total_tournaments++;
            generalStats.total_games += records.length;
            tournament['teamsNames'].forEach((team) => {
                teams[team].total_tournaments++;
            });
            if (tournament['mvpPlayerName']) {
                const mvp = tournament['mvpPlayerName'];
                generalStats.tournament_mvps[mvp] =
                    generalStats.tournament_mvps[mvp] || 0;
                generalStats.tournament_mvps[mvp]++;
            }
        });
        await timeDebugger.timeDebugMessage('Tournament Service - after tournaments forEach');
        Object.keys(teams).forEach((team) => {
            streaks[team]['wins'].push(teams[team]['win_streak']);
            streaks[team]['lose'].push(teams[team]['lose_streak']);
            const wins = streaks[team]['wins'];
            const lose = streaks[team]['lose'];
            teams[team].max_win_streak = Math.max(...wins);
            teams[team].max_lose_streak = Math.max(...lose);
            teams[team].streaks = streaks[team];
        });
        await timeDebugger.timeDebugMessage('Tournament Service - after teams forEach');
        teams['stats'] = generalStats;
        return teams;
    }
};
TournamentService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(tournament_repository_1.TournamentRepository)),
    __metadata("design:paramtypes", [tournament_repository_1.TournamentRepository,
        team_service_1.TeamService, typeof (_a = typeof player_service_1.PlayerService !== "undefined" && player_service_1.PlayerService) === "function" ? _a : Object])
], TournamentService);
exports.TournamentService = TournamentService;
//# sourceMappingURL=tournament.service.js.map