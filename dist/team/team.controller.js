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
exports.TeamController = void 0;
const common_1 = require("@nestjs/common");
const list_teams_dto_1 = require("./dto/list-teams-dto");
const team_service_1 = require("./team.service");
const create_team_dto_1 = require("./dto/create-team-dto");
const update_team_dto_1 = require("./dto/update-team-dto");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
let TeamController = class TeamController {
    constructor(teamService) {
        this.teamService = teamService;
    }
    async getTeams(filterDto) {
        const teams = await this.teamService.getTeams(filterDto);
        return {
            total: teams.length,
            data: teams,
        };
    }
    getTeam(id) {
        return this.teamService.getTeam(id);
    }
    createTeam(createTeamDto) {
        return this.teamService.createTeam(createTeamDto);
    }
    upsertTeam(createTeamDto) {
        return this.teamService.upsertTeam(createTeamDto);
    }
    async syncTeams(filterDto) {
        return await this.teamService.syncTeams(filterDto);
    }
    async syncTeamsRatings(filterDto) {
        return await this.teamService.syncTeamsRatings(filterDto);
    }
    async syncTeam(filterDto, id) {
        const team = await this.teamService.syncTeam(filterDto, id);
        return team;
    }
    updateTeam(id, updateTeamDto) {
        return this.teamService.updateTeam(id, updateTeamDto);
    }
    deleteTeam(id) {
        return this.teamService.deleteTeam(id);
    }
};
__decorate([
    swagger_1.ApiOperation({ summary: 'Get Teams', description: 'Get all teams' }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_teams_dto_1.ListTeamsDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getTeams", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Get Team', description: 'Get specific team by id' }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'team id',
        required: true,
        type: 'number',
    }),
    common_1.Get('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getTeam", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Create Team', description: 'Create a team.' }),
    common_1.Post(),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_team_dto_1.CreateTeamDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "createTeam", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Upsert Team', description: 'Upsert a team.' }),
    common_1.Post('/upsert'),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_team_dto_1.CreateTeamDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "upsertTeam", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Sync Team', description: 'Sync a team.' }),
    common_1.Put('/sync'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_teams_dto_1.ListTeamsDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "syncTeams", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sync Teams Ratings',
        description: 'Sync teams 2k ratings.',
    }),
    common_1.Put('/sync/ratings'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_teams_dto_1.ListTeamsDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "syncTeamsRatings", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sync Specific Team Ratings',
        description: 'Sync specific team 2k ratings by id.',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'team id',
        required: true,
        type: 'number',
    }),
    common_1.Put('/sync/id/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_teams_dto_1.ListTeamsDto, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "syncTeam", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Update Team', description: 'Update team by id' }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'team id',
        required: true,
        type: 'number',
    }),
    common_1.Put('/:id'),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_team_dto_1.UpdateTeamDto]),
    __metadata("design:returntype", void 0)
], TeamController.prototype, "updateTeam", null);
__decorate([
    swagger_1.ApiOperation({ summary: 'Delete Team', description: 'Delete team by id' }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'team id',
        required: true,
        type: 'number',
    }),
    common_1.Delete('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "deleteTeam", null);
TeamController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Teams'),
    common_1.Controller('team'),
    __metadata("design:paramtypes", [team_service_1.TeamService])
], TeamController);
exports.TeamController = TeamController;
//# sourceMappingURL=team.controller.js.map