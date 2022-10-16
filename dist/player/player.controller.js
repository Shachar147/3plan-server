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
exports.PlayerController = void 0;
const common_1 = require("@nestjs/common");
const player_service_1 = require("./player.service");
const list_player_dto_1 = require("./dto/list-player-dto");
const create_player_dto_1 = require("./dto/create-player-dto");
const update_player_dto_1 = require("./dto/update-player-dto");
const player_position_validation_pipe_1 = require("./pipes/player-position-validation.pipe");
const player_position_enum_1 = require("./player-position.enum");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
let PlayerController = class PlayerController {
    constructor(playerService) {
        this.playerService = playerService;
    }
    async getPlayers(filterDto) {
        const players = await this.playerService.getPlayers(filterDto);
        return {
            total: players.length,
            data: players,
        };
    }
    get3PointShooters(filterDto) {
        return this.playerService.get3PointShooters(filterDto);
    }
    async getPopularPlayers(filterDto) {
        const players = await this.playerService.getPopularPlayers(filterDto);
        return {
            total: players.length,
            data: players,
        };
    }
    getPlayer(id) {
        return this.playerService.getPlayer(id);
    }
    createPlayer(createPlayerDto, position) {
        return this.playerService.createPlayer(createPlayerDto);
    }
    upsertPlayer(createPlayerDto, position) {
        return this.playerService.upsertPlayer(createPlayerDto);
    }
    async syncPlayers(filterDto) {
        return await this.playerService.syncPlayers(filterDto);
    }
    async syncPlayer(id, filterDto) {
        const player = await this.playerService.syncPlayer(filterDto, id);
        return player;
    }
    async syncPlayerByName(name, filterDto) {
        const player = await this.playerService.syncPlayerByName(filterDto, name);
        return player;
    }
    async syncPlayersByTeam(name, filterDto) {
        const players = await this.playerService.syncPlayersByTeam(filterDto, name);
        return players;
    }
    updatePlayer(id, updatePlayerDto, position) {
        return this.playerService.updatePlayer(id, updatePlayerDto);
    }
    deletePlayer(id) {
        return this.playerService.deletePlayer(id);
    }
};
__decorate([
    swagger_1.ApiOperation({ summary: 'Get Players', description: 'Get NBA players.' }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_player_dto_1.ListPlayerDto]),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "getPlayers", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get 3pt Shooter Players',
        description: 'Get NBA 3pt shooter players.',
    }),
    common_1.Get('/3pts'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_player_dto_1.ListPlayerDto]),
    __metadata("design:returntype", void 0)
], PlayerController.prototype, "get3PointShooters", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Popular Players',
        description: 'Get NBA popular players.',
    }),
    common_1.Get('/popular'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_player_dto_1.ListPlayerDto]),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "getPopularPlayers", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Player by id',
        description: 'Get NBA specific player by id.',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'id of the player',
        required: true,
        type: 'number',
    }),
    common_1.Get('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "getPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Create Player',
        description: 'Create new NBA player.',
    }),
    common_1.Post(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Body()),
    __param(1, common_1.Body('position', player_position_validation_pipe_1.PlayerPositionValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_player_dto_1.CreatePlayerDto, String]),
    __metadata("design:returntype", void 0)
], PlayerController.prototype, "createPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Upsert Player',
        description: 'Upsert NBA player (update if exist, create if not).',
    }),
    common_1.Post('/upsert'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Body()),
    __param(1, common_1.Body('position', player_position_validation_pipe_1.PlayerPositionValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_player_dto_1.CreatePlayerDto, String]),
    __metadata("design:returntype", void 0)
], PlayerController.prototype, "upsertPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sync All Players',
        description: 'Sync all NBA players (update their details based on current real-data).',
    }),
    common_1.Put('/sync'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_player_dto_1.ListPlayerDto]),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "syncPlayers", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sync Player by id',
        description: 'Sync specific NBA player by id (update its details based on current real-data).',
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
    __metadata("design:paramtypes", [Object, list_player_dto_1.ListPlayerDto]),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "syncPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sync Player by name',
        description: 'Sync specific NBA player by name (update its details based on current real-data).',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'name of the player you want to sync',
        required: true,
        type: 'string',
    }),
    common_1.Put('/sync/name/:name'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('name')),
    __param(1, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_player_dto_1.ListPlayerDto]),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "syncPlayerByName", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sync team players by team name',
        description: 'Sync specific NBA players by team name (update their details based on current real-data).',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'team of the players you want to sync',
        required: true,
        type: 'string',
    }),
    common_1.Put('/sync/team/:name'),
    __param(0, common_1.Param('name')),
    __param(1, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_player_dto_1.ListPlayerDto]),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "syncPlayersByTeam", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Update Player',
        description: 'Update player by id.',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'id of the player',
        required: true,
        type: 'number',
    }),
    common_1.Put('/:id'),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __param(2, common_1.Body('position', player_position_validation_pipe_1.PlayerPositionValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_player_dto_1.UpdatePlayerDto, String]),
    __metadata("design:returntype", void 0)
], PlayerController.prototype, "updatePlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Delete Player',
        description: 'Delete player by id.',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'id of the player',
        required: true,
        type: 'number',
    }),
    common_1.Delete('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "deletePlayer", null);
PlayerController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Players'),
    common_1.Controller('player'),
    __metadata("design:paramtypes", [player_service_1.PlayerService])
], PlayerController);
exports.PlayerController = PlayerController;
//# sourceMappingURL=player.controller.js.map