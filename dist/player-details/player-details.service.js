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
exports.PlayerDetailsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sync_service_1 = require("../sync/sync.service");
const player_details_repository_1 = require("./player-details.repository");
const player_service_1 = require("../player/player.service");
const server_config_1 = require("../config/server.config");
let PlayerDetailsService = class PlayerDetailsService {
    constructor(playerDetailsRepository, playerService, syncService) {
        this.playerDetailsRepository = playerDetailsRepository;
        this.playerService = playerService;
        this.syncService = syncService;
        this.logger = new common_1.Logger('PlayerDetailsService');
    }
    async getPlayersDetails(filterDto) {
        return await this.playerDetailsRepository.getPlayersDetails(filterDto);
    }
    async createPlayerDetails(createPlayerDto) {
        ['name'].forEach((iter) => {
            if (createPlayerDto[iter] == undefined) {
                throw new common_1.BadRequestException(`${iter} : missing`);
            }
        });
        return await this.playerDetailsRepository.createPlayerDetails(createPlayerDto);
    }
    async syncPlayerById(filterDto, id) {
        const player = await this.playerService.getPlayer(id);
        const player_name = player.name;
        return await this.syncPlayer(filterDto, player_name);
    }
    async syncPlayer(filterDto, player_name) {
        const details = await this.syncService.getPlayerRealStats(player_name);
        if (details == undefined || Object.keys(details).length === 0) {
            throw new common_1.NotFoundException({
                message: `No data found for player ${player_name}`,
                data: {},
                error: 'Not Found',
            });
        }
        const createDetailDto = {
            name: details['name'],
            picture: details['picture'],
            GP: details['GP'],
            WP: details['WP'],
            MPG: details['MPG'],
            PPG: details['PPG'],
            RPG: details['RPG'],
            APG: details['APG'],
            SPG: details['SPG'],
            BPG: details['BPG'],
            TPG: details['TPG'],
            FGM: details['FGM'],
            FGA: details['FGA'],
            FGP: details['FGP'],
            FTM: details['FTM'],
            FTA: details['FTA'],
            FTP: details['FTP'],
            _3PM: details['_3PM'],
            _3PA: details['_3PA'],
            _3PP: details['_3PP'],
            MIN: details['MIN'],
            PTS: details['PTS'],
            REB: details['REB'],
            AST: details['AST'],
            STL: details['STL'],
            BLK: details['BLK'],
            TOV: details['TOV'],
            PF: details['PF'],
            PM: details['PM'],
        };
        return await this.createPlayerDetails(createDetailDto);
    }
    async syncPopularPlayers(filterDto) {
        const allDetails = await this.syncService.getPopularPlayersRealStats();
        const names = Object.keys(allDetails);
        for (let i = 0; i < names.length; i++) {
            const details = allDetails[names[i]];
            const createDetailDto = {
                name: details['name'],
                picture: details['picture'],
                GP: details['GP'],
                WP: details['WP'],
                MPG: details['MPG'],
                PPG: details['PPG'],
                RPG: details['RPG'],
                APG: details['APG'],
                SPG: details['SPG'],
                BPG: details['BPG'],
                TPG: details['TPG'],
                FGM: details['FGM'],
                FGA: details['FGA'],
                FGP: details['FGP'],
                FTM: details['FTM'],
                FTA: details['FTA'],
                FTP: details['FTP'],
                _3PM: details['_3PM'],
                _3PA: details['_3PA'],
                _3PP: details['_3PP'],
                MIN: details['MIN'],
                PTS: details['PTS'],
                REB: details['REB'],
                AST: details['AST'],
                STL: details['STL'],
                BLK: details['BLK'],
                TOV: details['TOV'],
                PF: details['PF'],
                PM: details['PM'],
            };
            await this.createPlayerDetails(createDetailDto);
        }
        return await this.getPlayersDetails(filterDto);
    }
    async syncAllPlayers(filterDto) {
        const players = await this.syncService.getPlayers();
        const errors = [];
        if (players && players.length > 0) {
            for (const idx in players) {
                const player = players[idx];
                const player_name = player.name;
                const details = await this.syncService.getPlayerRealStats(player_name);
                const curr = Number(idx) + 1;
                this.logger.log(`Syncing ${player_name} - ${curr}/${players.length}`);
                if (Object.keys(details).length > 0) {
                    const createDetailDto = {
                        name: details['name'],
                        picture: details['picture'],
                        GP: details['GP'],
                        WP: details['WP'],
                        MPG: details['MPG'],
                        PPG: details['PPG'],
                        RPG: details['RPG'],
                        APG: details['APG'],
                        SPG: details['SPG'],
                        BPG: details['BPG'],
                        TPG: details['TPG'],
                        FGM: details['FGM'],
                        FGA: details['FGA'],
                        FGP: details['FGP'],
                        FTM: details['FTM'],
                        FTA: details['FTA'],
                        FTP: details['FTP'],
                        _3PM: details['_3PM'],
                        _3PA: details['_3PA'],
                        _3PP: details['_3PP'],
                        MIN: details['MIN'],
                        PTS: details['PTS'],
                        REB: details['REB'],
                        AST: details['AST'],
                        STL: details['STL'],
                        BLK: details['BLK'],
                        TOV: details['TOV'],
                        PF: details['PF'],
                        PM: details['PM'],
                    };
                    try {
                        await this.createPlayerDetails(createDetailDto);
                    }
                    catch (error) {
                        const err_message = `Failed to update player details (name: ${player.name})`;
                        errors.push(err_message);
                        this.logger.error(err_message);
                    }
                }
            }
        }
        else {
            throw new common_1.NotFoundException(`No Data found for Players Details`);
        }
        return {
            total: players.length,
            total_errors: errors.length,
            errors: errors,
        };
    }
    async syncAllPlayersBulk(filterDto, start) {
        const players = await this.syncService.getPlayers();
        const errors = [];
        let counter = 0;
        const bulk = 20;
        start = (start - 1) * bulk;
        const end = start + 20;
        if (server_config_1.debug_mode)
            console.log('start: ' + start, 'end: ' + end);
        if (players && players.length > 0) {
            for (const idx in players) {
                if (counter >= start && counter < end) {
                    const player = players[idx];
                    const player_name = player.name;
                    const details = await this.syncService.getPlayerRealStats(player_name);
                    const curr = Number(idx) + 1;
                    this.logger.log(`Syncing ${player_name} - ${curr}/${players.length}`);
                    if (Object.keys(details).length > 0) {
                        const createDetailDto = {
                            name: details['name'],
                            picture: details['picture'],
                            GP: details['GP'],
                            WP: details['WP'],
                            MPG: details['MPG'],
                            PPG: details['PPG'],
                            RPG: details['RPG'],
                            APG: details['APG'],
                            SPG: details['SPG'],
                            BPG: details['BPG'],
                            TPG: details['TPG'],
                            FGM: details['FGM'],
                            FGA: details['FGA'],
                            FGP: details['FGP'],
                            FTM: details['FTM'],
                            FTA: details['FTA'],
                            FTP: details['FTP'],
                            _3PM: details['_3PM'],
                            _3PA: details['_3PA'],
                            _3PP: details['_3PP'],
                            MIN: details['MIN'],
                            PTS: details['PTS'],
                            REB: details['REB'],
                            AST: details['AST'],
                            STL: details['STL'],
                            BLK: details['BLK'],
                            TOV: details['TOV'],
                            PF: details['PF'],
                            PM: details['PM'],
                        };
                        try {
                            await this.createPlayerDetails(createDetailDto);
                        }
                        catch (error) {
                            const err_message = `Failed to update player details (name: ${player.name})`;
                            errors.push(err_message);
                            this.logger.error(err_message);
                        }
                    }
                }
                counter++;
            }
        }
        else {
            throw new common_1.NotFoundException(`No Data found for Players Details`);
        }
        return {
            total: bulk,
            total_errors: errors.length,
            errors: errors,
        };
    }
};
PlayerDetailsService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(player_details_repository_1.PlayerDetailsRepository)),
    __metadata("design:paramtypes", [player_details_repository_1.PlayerDetailsRepository, typeof (_a = typeof player_service_1.PlayerService !== "undefined" && player_service_1.PlayerService) === "function" ? _a : Object, sync_service_1.SyncService])
], PlayerDetailsService);
exports.PlayerDetailsService = PlayerDetailsService;
//# sourceMappingURL=player-details.service.js.map