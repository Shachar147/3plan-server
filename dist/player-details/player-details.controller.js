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
exports.PlayerDetailsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const player_details_service_1 = require("./player-details.service");
const list_player_details_dto_1 = require("./dto/list-player-details-dto");
const create_player_details_dto_1 = require("./dto/create-player-details-dto");
const swagger_1 = require("@nestjs/swagger");
let PlayerDetailsController = class PlayerDetailsController {
    constructor(playerDetailsService) {
        this.playerDetailsService = playerDetailsService;
    }
    async getPlayers(filterDto) {
        const details = await this.playerDetailsService.getPlayersDetails(filterDto);
        return {
            total: details.length,
            data: details,
        };
    }
    createPlayer(createPlayerDetailsDto) {
        return this.playerDetailsService.createPlayerDetails(createPlayerDetailsDto);
    }
    async syncPlayerById(id, filterDto) {
        const details = await this.playerDetailsService.syncPlayerById(filterDto, id);
        return details;
    }
    async syncPlayer(name, filterDto) {
        const details = await this.playerDetailsService.syncPlayer(filterDto, name);
        return details;
    }
    async syncPopularPlayers(filterDto) {
        const details = await this.playerDetailsService.syncPopularPlayers(filterDto);
        return details;
    }
    async syncAllPlayers(filterDto) {
        const details = await this.playerDetailsService.syncAllPlayers(filterDto);
        return details;
    }
    async syncAllPlayersBulk(filterDto, start) {
        const details = await this.playerDetailsService.syncAllPlayersBulk(filterDto, start);
        return details;
    }
};
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Players Details',
        description: 'Get NBA Players Details',
    }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_player_details_dto_1.ListPlayerDetailsDto]),
    __metadata("design:returntype", Promise)
], PlayerDetailsController.prototype, "getPlayers", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Create Player Details',
        description: 'Create New NBA Player Details',
    }),
    common_1.Post(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_player_details_dto_1.CreatePlayerDetailsDto]),
    __metadata("design:returntype", void 0)
], PlayerDetailsController.prototype, "createPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sync Player Details by id',
        description: 'Sync specific NBA player details by id (update its details based on current real-data).',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'id of the player',
        required: true,
        type: 'number',
    }),
    common_1.Put('/sync/id/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __param(1, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_player_details_dto_1.ListPlayerDetailsDto]),
    __metadata("design:returntype", Promise)
], PlayerDetailsController.prototype, "syncPlayerById", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sync Player Details by name',
        description: 'Sync specific NBA player details by name (update its details based on current real-data).',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'name of the player',
        required: true,
        type: 'string',
    }),
    common_1.Put('/sync/name/:name'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('name')),
    __param(1, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_player_details_dto_1.ListPlayerDetailsDto]),
    __metadata("design:returntype", Promise)
], PlayerDetailsController.prototype, "syncPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Create Popular Players Details',
        description: 'Sync popular NBA players details (update their details based on current real-data).',
    }),
    common_1.Put('/sync/popular'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_player_details_dto_1.ListPlayerDetailsDto]),
    __metadata("design:returntype", Promise)
], PlayerDetailsController.prototype, "syncPopularPlayers", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sync All Players Details',
        description: 'Sync all NBA player details (update their details based on current real-data).',
    }),
    common_1.Put('/sync/'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_player_details_dto_1.ListPlayerDetailsDto]),
    __metadata("design:returntype", Promise)
], PlayerDetailsController.prototype, "syncAllPlayers", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sync All Players Details - Bulks',
        description: 'Sync all NBA player details in bulks (splitted to pages) - (update their details based on current real-data).',
    }),
    swagger_1.ApiParam({
        name: 'start',
        description: 'page number',
        required: true,
        type: 'number',
    }),
    common_1.Put('/sync/bulk/:start'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __param(1, common_1.Param('start')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_player_details_dto_1.ListPlayerDetailsDto, Object]),
    __metadata("design:returntype", Promise)
], PlayerDetailsController.prototype, "syncAllPlayersBulk", null);
PlayerDetailsController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Player Details'),
    common_1.Controller('playerdetails'),
    __metadata("design:paramtypes", [player_details_service_1.PlayerDetailsService])
], PlayerDetailsController);
exports.PlayerDetailsController = PlayerDetailsController;
//# sourceMappingURL=player-details.controller.js.map