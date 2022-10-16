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
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const sync_service_1 = require("./sync.service");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
let SyncController = class SyncController {
    constructor(syncService) {
        this.syncService = syncService;
    }
    async getTeams() {
        return this.syncService.getTeams();
    }
    async getPlayers() {
        return this.syncService.getPlayers();
    }
    async getTeamPlayersRatings(team_name) {
        return this.syncService.getTeamPlayersRatings(team_name);
    }
    async getAllTeamsPlayersRatings() {
        return this.syncService.getAllTeamsPlayersRatings();
    }
    async getPopularPlayersRealStats() {
        return await this.syncService.getPopularPlayersRealStats();
    }
    async getPlayerRealStats(player_name) {
        return this.syncService.getPlayerRealStats(player_name);
    }
};
__decorate([
    swagger_1.ApiOperation({ summary: 'Get Teams', description: 'Get Teams Sync Data' }),
    common_1.Get('/teams'),
    common_1.UseGuards(passport_1.AuthGuard('jwt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getTeams", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Players',
        description: 'Get Players Sync Data',
    }),
    common_1.Get('/players'),
    common_1.UseGuards(passport_1.AuthGuard('jwt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getPlayers", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Team Ratings',
        description: 'Get Team Ratings Sync Data by name',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'the name of the team',
        required: true,
        type: 'string',
    }),
    common_1.Get('/teams/rating/:name'),
    common_1.UseGuards(passport_1.AuthGuard('jwt')),
    __param(0, common_1.Param('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getTeamPlayersRatings", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Teams Ratings',
        description: 'Get Teams Rating Sync Data',
    }),
    common_1.Get('/teams/rating'),
    common_1.UseGuards(passport_1.AuthGuard('jwt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getAllTeamsPlayersRatings", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Popular Players Real Stats',
        description: 'Get Popular players real stats Sync Data',
    }),
    common_1.Get('/players/details/popular'),
    common_1.UseGuards(passport_1.AuthGuard('jwt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getPopularPlayersRealStats", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Players Real Stats by Player Name',
        description: 'Get player real stats Sync Data by name',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'name of the player',
        required: true,
        type: 'string',
    }),
    common_1.Get('/players/details/:name'),
    common_1.UseGuards(passport_1.AuthGuard('jwt')),
    __param(0, common_1.Param('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getPlayerRealStats", null);
SyncController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Sync'),
    common_1.Controller('sync'),
    __metadata("design:paramtypes", [sync_service_1.SyncService])
], SyncController);
exports.SyncController = SyncController;
//# sourceMappingURL=sync.controller.js.map