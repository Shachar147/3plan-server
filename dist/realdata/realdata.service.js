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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealdataService = void 0;
const common_1 = require("@nestjs/common");
const datanbanet_service_1 = require("../sync/api/datanbanet.service");
const espn_service_1 = require("../sync/api/espn.service");
const player_service_1 = require("../player/player.service");
let RealdataService = class RealdataService {
    constructor(NbaAPI, espnService, playerService) {
        this.NbaAPI = NbaAPI;
        this.espnService = espnService;
        this.playerService = playerService;
    }
    async getTodayGames(date) {
        return await this.NbaAPI.getTodayGames(date);
    }
    async getInjuredPlayers() {
        const results = [];
        const injured = await this.espnService.getInjuredPlayers();
        for (let i = 0; i < injured.length; i++) {
            const row = injured[i];
            const name = row.name;
            try {
                row.player = await this.playerService.getPlayerByName(name);
                row.team_name = row.player.team.name;
                row.injury_status_severity =
                    row.status.toLowerCase() === 'out'
                        ? 2
                        : row.status.toLowerCase() === 'day-to-day'
                            ? 1
                            : 0;
                results.push(row);
            }
            catch (e) {
                console.error(`player named ${name} not found: ${e}`);
            }
        }
        return results;
    }
};
RealdataService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [datanbanet_service_1.DatanbanetService,
        espn_service_1.ESPNService, typeof (_a = typeof player_service_1.PlayerService !== "undefined" && player_service_1.PlayerService) === "function" ? _a : Object])
], RealdataService);
exports.RealdataService = RealdataService;
//# sourceMappingURL=realdata.service.js.map