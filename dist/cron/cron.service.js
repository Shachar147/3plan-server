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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const common_1 = require("@nestjs/common");
const team_service_1 = require("../team/team.service");
const schedule_1 = require("@nestjs/schedule");
const player_service_1 = require("../player/player.service");
const player_details_service_1 = require("../player-details/player-details.service");
const server_config_1 = require("../config/server.config");
let CronService = class CronService {
    constructor(teamService, playerService, playerDetailsService) {
        this.teamService = teamService;
        this.playerService = playerService;
        this.playerDetailsService = playerDetailsService;
        this.logger = new common_1.Logger('CronService');
    }
    async autSyncTeams() {
        if (server_config_1.debug_mode)
            console.log('AUTO SYNC TEAMS');
        const result = await this.teamService.syncTeams({});
        if (server_config_1.debug_mode)
            console.log('AUTO SYNC TEAMS', result);
    }
    async autSyncPlayers() {
        if (server_config_1.debug_mode)
            console.log('AUTO SYNC PLAYERS');
        const result = await this.playerService.syncPlayers({});
        if (server_config_1.debug_mode)
            console.log('AUTO SYNC PLAYERS', result);
    }
    async autSyncPlayersDetails() {
        if (server_config_1.debug_mode)
            console.log('AUTO SYNC PLAYERS DETAILS');
        const result = await this.playerDetailsService.syncAllPlayers({});
        if (server_config_1.debug_mode)
            console.log('AUTO SYNC PLAYERS DETAILS', result);
    }
    async autSyncPlayersRatings() {
        if (server_config_1.debug_mode)
            console.log('AUTO SYNC PLAYERS RATINGS');
        const result = await this.teamService.syncTeamsRatings({});
        if (server_config_1.debug_mode)
            console.log('AUTO SYNC PLAYERS RATINGS', result);
    }
};
__decorate([
    schedule_1.Cron('0 09 * * 0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "autSyncTeams", null);
__decorate([
    schedule_1.Cron('0 09 * * 0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "autSyncPlayers", null);
__decorate([
    schedule_1.Cron('0 09 * * 0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "autSyncPlayersDetails", null);
__decorate([
    schedule_1.Cron('0 09 * * 0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "autSyncPlayersRatings", null);
CronService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [team_service_1.TeamService, typeof (_a = typeof player_service_1.PlayerService !== "undefined" && player_service_1.PlayerService) === "function" ? _a : Object, typeof (_b = typeof player_details_service_1.PlayerDetailsService !== "undefined" && player_details_service_1.PlayerDetailsService) === "function" ? _b : Object])
], CronService);
exports.CronService = CronService;
//# sourceMappingURL=cron.service.js.map