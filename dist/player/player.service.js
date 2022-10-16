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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const player_repository_1 = require("./player.repository");
const sync_service_1 = require("../sync/sync.service");
const player_position_enum_1 = require("./player-position.enum");
const team_service_1 = require("../team/team.service");
const const_1 = require("../shared/const");
const server_config_1 = require("../config/server.config");
let PlayerService = class PlayerService {
    constructor(playerRepository, syncService, teamService) {
        this.playerRepository = playerRepository;
        this.syncService = syncService;
        this.teamService = teamService;
        this.logger = new common_1.Logger('PlayerService');
    }
    async getPlayers(filterDto) {
        return await this.playerRepository.getPlayers(filterDto);
    }
    async get3PointShooters(filterDto) {
        const _3ptplayers = await this.syncService.get3PointShooters();
        let players = await this.playerRepository.getPlayers(filterDto);
        const hash = _3ptplayers.reduce(function (map, obj) {
            map[obj.name] = obj.percents;
            return map;
        }, {});
        players = players
            .filter(function (iter) {
            if (hash[iter.name] != undefined) {
                iter['3pt_percents'] = hash[iter.name];
                return true;
            }
            else if (const_1.POPULAR_PLAYERS.indexOf(iter.name) !== -1) {
                iter['3pt_percents'] = iter['3pt_percents'] || 'N/A';
                return true;
            }
            return false;
        })
            .sort((a, b) => {
            let per1 = a['3pt_percents'].replace('%', '');
            let per2 = b['3pt_percents'].replace('%', '');
            if (per1 === 'N/A')
                per1 = 0;
            if (per2 === 'N/A')
                per2 = 0;
            return parseFloat(per2) - parseFloat(per1);
        });
        return players;
    }
    async getPopularPlayers(filterDto) {
        const _popularPlayers = const_1.POPULAR_PLAYERS;
        let players = await this.playerRepository.getPlayers(filterDto);
        const teams_ratings = {};
        const hash = {};
        _popularPlayers.forEach(function (iter) {
            hash[iter] = 1;
        });
        players = players.filter(function (iter) {
            if (iter.team == undefined) {
                return false;
            }
            teams_ratings[iter.team.name] = {};
            if (hash[iter.name] != undefined) {
                hash[iter.name] = 0;
                return true;
            }
            return false;
        });
        let { names } = filterDto;
        names = names || '';
        const names_arr = names.split(',');
        Object.keys(hash).forEach(function (name) {
            if (hash[name] === 1) {
                if (names_arr.length === 0 ||
                    (names_arr.length > 0 && names_arr.indexOf(name) !== -1)) {
                    console.log('Not Found: ' + name);
                }
            }
        });
        return players;
    }
    async getPlayer(id) {
        const found = await this.playerRepository.getPlayer(id);
        if (!found) {
            throw new common_1.NotFoundException(`Player with id #${id} not found`);
        }
        return found;
    }
    async getPlayerByNameFull(name) {
        const found = await this.playerRepository.getPlayerByName(name);
        if (!found) {
            throw new common_1.NotFoundException(`Player with name ${name} not found`);
        }
        return found;
    }
    async getPlayerByName(name) {
        const found = await this.playerRepository._getPlayerByName(name);
        if (!found) {
            throw new common_1.NotFoundException(`Player with name ${name} not found`);
        }
        return found;
    }
    async createPlayer(createPlayerDto) {
        const { team_name, allstar_team_name } = createPlayerDto;
        ['name'].forEach((iter) => {
            if (createPlayerDto[iter] == undefined) {
                throw new common_1.BadRequestException(`${iter} : missing`);
            }
        });
        if (team_name) {
            const team_obj = await this.teamService.getTeamByName(team_name);
            const allstar_team_obj = allstar_team_name
                ? await this.teamService.getTeamByName(allstar_team_name)
                : undefined;
            return await this.playerRepository.createPlayer(createPlayerDto, team_obj, allstar_team_obj);
        }
        else {
            throw new common_1.BadRequestException(`missing: team_name`);
        }
    }
    async deletePlayer(id) {
        const result = await this.playerRepository.delete({ id: id });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Player with id #${id} not found`);
        }
        return result;
    }
    async updatePlayer(id, updatePlayerDto) {
        const player = await this.getPlayer(id);
        if (!updatePlayerDto.name &&
            !updatePlayerDto.picture &&
            !updatePlayerDto.position &&
            !updatePlayerDto.height_feet &&
            !updatePlayerDto.height_inches &&
            !updatePlayerDto.weight_pounds &&
            !updatePlayerDto.weight_kgs &&
            !updatePlayerDto.jersey &&
            !updatePlayerDto.debut_year &&
            !updatePlayerDto.height_meters &&
            !updatePlayerDto._2k_rating &&
            !updatePlayerDto.team_name &&
            !updatePlayerDto.isActive &&
            !updatePlayerDto.date_of_birth &&
            !updatePlayerDto.college_name &&
            !updatePlayerDto.country &&
            !updatePlayerDto.draft_round &&
            !updatePlayerDto.draft_pick) {
            throw new common_1.BadRequestException(`You have to pass fields to update`);
        }
        const { team_name, allstar_team_name } = updatePlayerDto;
        if (team_name) {
            const team_obj = await this.teamService.getTeamByName(team_name);
            const allstar_team_obj = allstar_team_name
                ? await this.teamService.getTeamByName(allstar_team_name)
                : undefined;
            return this.playerRepository.updatePlayer(updatePlayerDto, player, team_obj, allstar_team_obj);
        }
        const allstar_team_obj = allstar_team_name
            ? await this.teamService.getTeamByName(allstar_team_name)
            : undefined;
        return this.playerRepository.updatePlayer(updatePlayerDto, player, undefined, allstar_team_obj);
    }
    async upsertPlayer(createPlayerDto) {
        const { team_name, allstar_team_name, name } = createPlayerDto;
        if (!name) {
            throw new common_1.BadRequestException('name : missing');
        }
        if (team_name) {
            const team_obj = await this.teamService.getTeamByName(team_name);
            const allstar_team_obj = allstar_team_name
                ? await this.teamService.getTeamByName(allstar_team_name)
                : undefined;
            delete team_obj.players;
            return await this.playerRepository.upsertPlayer(createPlayerDto, team_obj, allstar_team_obj);
        }
        const allstar_team_obj = allstar_team_name
            ? await this.teamService.getTeamByName(allstar_team_name)
            : undefined;
        return await this.playerRepository.upsertPlayer(createPlayerDto, undefined, allstar_team_obj);
    }
    async syncPlayers(filterDto) {
        const existingPlayers = await this.playerRepository.getPlayers(filterDto);
        const existingPlayersName = existingPlayers.map((x) => x.name);
        const players = await this.syncService.getPlayers();
        const hash = {};
        existingPlayersName.forEach((name) => (hash[name] = 1));
        const errors = [];
        let skipped = 0;
        if (!(players != undefined && players.length > 0)) {
            throw new common_1.NotFoundException(`No Data found for Players`);
        }
        else {
            for (const idx in players) {
                const player = players[idx];
                if (server_config_1.debug_mode)
                    console.log(`syncing player ${Number(idx) + 1}/${players.length}...`);
                if (!player.isActive &&
                    existingPlayersName.indexOf(player.name) === -1) {
                    skipped++;
                    continue;
                }
                delete hash[player.name];
                if (player.position) {
                    const original_position = player.position;
                    player.position = player_position_enum_1.PlayerPosition[player.position];
                    if (Object.values(player_position_enum_1.PlayerPosition).indexOf(player.position) === -1) {
                        const error = "Couldn't sync player " +
                            player.name +
                            ' - position is invalid: ' +
                            player.position +
                            ' (' +
                            original_position +
                            ')';
                        this.logger.error(error);
                        errors.push(error);
                        return;
                    }
                }
                try {
                    await this.upsertPlayer(player);
                }
                catch (error) {
                    const err_message = `Failed to upsert player (name: ${player.name}) - ` + error;
                    errors.push(err_message);
                    this.logger.error(err_message);
                }
            }
            const nonExistingPlayers = Object.keys(hash);
            nonExistingPlayers.forEach(async (playerName) => {
                await this.inActivePlayer(playerName);
            });
        }
        if (filterDto) {
            filterDto.name = undefined;
            filterDto.search = undefined;
            filterDto.id = undefined;
            filterDto.weight_pounds = undefined;
            filterDto.height_inch = undefined;
            filterDto.height_feet = undefined;
            filterDto.position = undefined;
            filterDto.debut_year = undefined;
            filterDto.weight_kgs = undefined;
            filterDto.jersey = undefined;
            filterDto.height_meters = undefined;
            filterDto._2k_rating = undefined;
            filterDto.isActive = undefined;
            filterDto.date_of_birth = undefined;
            filterDto.college_name = undefined;
            filterDto.country = undefined;
            filterDto.draft_round = undefined;
            filterDto.draft_pick = undefined;
        }
        return {
            total: players.length - skipped,
            total_errors: errors.length,
            errors: errors,
        };
    }
    async syncPlayerByName(filterDto, name) {
        const player = await this.getPlayerByName(name);
        const player_id = player.id;
        return await this.syncPlayer(filterDto, player_id);
    }
    async syncPlayersByTeam(filterDto, name) {
        const team = await this.teamService.getTeamByName(name);
        const orig_players = team.players;
        for (const idx in orig_players) {
            const iter = orig_players[idx];
            await this.syncPlayer(filterDto, iter.id);
        }
        const response = await this.teamService.getTeamByName(name);
        return response;
    }
    async _getPlayerPosition(player) {
        if (player.position) {
            const original_position = player.position;
            if (Object.values(player_position_enum_1.PlayerPosition).indexOf(player.position) !== -1) {
                return player.position;
            }
            player.position = player_position_enum_1.PlayerPosition[player.position];
            if (Object.values(player_position_enum_1.PlayerPosition).indexOf(player.position) === -1) {
                console.log("Couldn't sync player " +
                    player.name +
                    ' - position is invalid: ' +
                    player.position +
                    ' (' +
                    original_position +
                    ')');
                return 'invalid';
            }
        }
        return player.position;
    }
    async syncPlayer(filterDto, id) {
        const players = await this.syncService.getPlayers();
        const orig_player = await this.playerRepository.getPlayer(id);
        if (!orig_player) {
            throw new common_1.NotFoundException(`Player with id #${id} not found`);
        }
        if (players && players.length > 0) {
            players.forEach(async (player) => {
                var _a;
                if (player.name === orig_player.name) {
                    player.position = this._getPlayerPosition(player);
                    if (player.position && player.position === 'invalid')
                        return;
                    const updatePlayerDto = {
                        name: player.name,
                        picture: player.picture || orig_player.picture,
                        height_feet: player.height_feet || orig_player.height_feet,
                        height_inches: player.height_inches || orig_player.height_inches,
                        weight_pounds: player.weight_pounds || orig_player.weight_pounds,
                        team_name: player.team_name || orig_player.team.name,
                        position: player.position || orig_player.position,
                        jersey: player.jersey || orig_player.jersey,
                        debut_year: player.debut_year || orig_player.debut_year,
                        weight_kgs: player.weight_kgs || orig_player.weight_kgs,
                        height_meters: player.height_meters || orig_player.height_meters,
                        _2k_rating: player._2k_rating || orig_player._2k_rating,
                        isActive: player.isActive || orig_player.isActive,
                        date_of_birth: player.date_of_birth || orig_player.date_of_birth,
                        college_name: player.college_name || orig_player.college_name,
                        country: player.country || orig_player.country,
                        draft_round: player.draft_round || orig_player.draft_round,
                        draft_pick: player.draft_pick || orig_player.draft_pick,
                        allstar_team_name: (player === null || player === void 0 ? void 0 : player.allstar_team_name) || ((_a = orig_player === null || orig_player === void 0 ? void 0 : orig_player.allStarTeam) === null || _a === void 0 ? void 0 : _a.name),
                    };
                    await this.updatePlayer(id, updatePlayerDto);
                }
            });
        }
        else {
            throw new common_1.NotFoundException(`No Data found for Players`);
        }
        return await this.getPlayer(id);
    }
    async inActivePlayer(name) {
        const player = await this.getPlayerByName(name);
        return await this.playerRepository.inActivePlayer(player);
    }
};
PlayerService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(player_repository_1.PlayerRepository)),
    __metadata("design:paramtypes", [player_repository_1.PlayerRepository,
        sync_service_1.SyncService,
        team_service_1.TeamService])
], PlayerService);
exports.PlayerService = PlayerService;
//# sourceMappingURL=player.service.js.map