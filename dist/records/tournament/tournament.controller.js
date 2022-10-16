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
exports.TournamentController = void 0;
const common_1 = require("@nestjs/common");
const create_dto_1 = require("./dto/create-dto");
const list_dto_1 = require("./dto/list-dto");
const passport_1 = require("@nestjs/passport");
const tournament_service_1 = require("./tournament.service");
const update_dto_1 = require("./dto/update-dto");
const user_entity_1 = require("../../user/user.entity");
const get_user_decorator_1 = require("../../auth/get-user.decorator");
const time_debugger_1 = require("../../shared/time.debugger");
const swagger_1 = require("@nestjs/swagger");
let TournamentController = class TournamentController {
    constructor(tournamentService) {
        this.tournamentService = tournamentService;
    }
    async createRecord(createDtp, user) {
        const record = await this.tournamentService.createRecord(createDtp, user);
        return record;
    }
    async listRecords(listDto, user) {
        const records = await this.tournamentService.listRecords(listDto, user);
        return {
            total: records.length,
            data: records,
        };
    }
    async listStats(listDto, user) {
        const timeDebugger = new time_debugger_1.TimeDebugger();
        await timeDebugger.timeDebugMessage('Tournament Controller - listStats');
        const records = await this.tournamentService.listStats(listDto, user);
        await timeDebugger.timeDebugMessage('Tournament Controller - after listStats');
        const stats = records['stats'];
        delete records['stats'];
        return {
            total: Object.keys(records).length,
            data: records,
            stats: stats,
        };
    }
    async listStatsBySpecificTeam(listDto, name, user) {
        const records = await this.tournamentService.listStats(listDto, user);
        const tournament_mvps = records['stats'].tournament_mvps;
        const team = await this.tournamentService.teamService.getTeamByName(name);
        const players = team.players.map((iter) => iter.name);
        const teamStats = {};
        Object.keys(tournament_mvps).forEach((player) => {
            if (players.indexOf(player) !== -1) {
                teamStats[player] = tournament_mvps[player];
            }
        });
        let toReturn;
        if (records[name]) {
            toReturn = records[name];
            toReturn['tournament_mvps'] = teamStats;
        }
        return toReturn || {};
    }
    async getRecord(id, user) {
        return await this.tournamentService.getRecord(id, user);
    }
    deleteRecord(id, user) {
        return this.tournamentService.deleteRecord(id, user);
    }
    updateRecord(id, updateDto, user) {
        return this.tournamentService.updateRecord(id, updateDto, user);
    }
};
__decorate([
    swagger_1.ApiOperation({
        summary: 'Create Record',
        description: 'Create Tournament Record.',
    }),
    common_1.Post(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Body()), __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dto_1.CreateDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "createRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Records',
        description: 'Get All Tournament Records.',
    }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_dto_1.ListDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "listRecords", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Stats',
        description: 'Get Tournaments Stats.',
    }),
    common_1.Get('/stats'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()), __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_dto_1.ListDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "listStats", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Stats by Team',
        description: 'Get Tournaments Stats by specific team name.',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'name of the team you want to get stats for',
        required: true,
        type: 'string',
    }),
    common_1.Get('/stats/:name'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, common_1.Param('name')),
    __param(2, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_dto_1.ListDto, String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "listStatsBySpecificTeam", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Record',
        description: 'Get Tournament Record by id.',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'id of the record',
        required: true,
        type: 'number',
    }),
    common_1.Get('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)), __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TournamentController.prototype, "getRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Delete Record',
        description: 'Delete Tournament Record by id.',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'id of the record',
        required: true,
        type: 'number',
    }),
    common_1.Delete('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)), __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "deleteRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Update Record',
        description: 'Update Tournament Record by id.',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'id of the record',
        required: true,
        type: 'number',
    }),
    common_1.Put('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __param(2, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_dto_1.UpdateDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], TournamentController.prototype, "updateRecord", null);
TournamentController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Records - Tournament'),
    common_1.Controller('/records/tournament'),
    __metadata("design:paramtypes", [tournament_service_1.TournamentService])
], TournamentController);
exports.TournamentController = TournamentController;
//# sourceMappingURL=tournament.controller.js.map