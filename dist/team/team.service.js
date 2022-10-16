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
exports.TeamService = void 0;
const common_1 = require("@nestjs/common");
const team_repository_1 = require("./team.repository");
const typeorm_1 = require("@nestjs/typeorm");
const sync_service_1 = require("../sync/sync.service");
let TeamService = class TeamService {
    constructor(teamRepository, syncService) {
        this.teamRepository = teamRepository;
        this.syncService = syncService;
        this.logger = new common_1.Logger('TeamService');
    }
    async getTeams(filterDto) {
        return await this.teamRepository.getTeams(filterDto);
    }
    async getTeam(id) {
        const found = await this.teamRepository.findOne(id);
        if (!found) {
            throw new common_1.NotFoundException(`Team with id #${id} not found`);
        }
        return found;
    }
    async getTeamByNameFull(name) {
        const found = await this.teamRepository.findOne({ name: name });
        if (!found) {
            throw new common_1.NotFoundException(`Team with name ${name} not found`);
        }
        return found;
    }
    async getTeamByName(name) {
        const found = await this.teamRepository._getTeamByName(name);
        if (!found) {
            throw new common_1.NotFoundException(`Team with name ${name} not found`);
        }
        return found;
    }
    async createTeam(createTeamDto) {
        ['name', 'logo', 'division', 'conference'].forEach((iter) => {
            if (createTeamDto[iter] == undefined) {
                throw new common_1.BadRequestException(`${iter} : missing`);
            }
        });
        return await this.teamRepository.createTeam(createTeamDto);
    }
    async upsertTeam(createTeamDto) {
        const { name } = createTeamDto;
        if (!name) {
            throw new common_1.BadRequestException('name : missing');
        }
        return await this.teamRepository.upsertTeam(createTeamDto);
    }
    async syncTeam(filterDto, id) {
        const teams = await this.syncService.getTeams();
        const orig_team = await this.getTeam(id);
        if (teams && teams.length > 0) {
            teams.forEach(async (team) => {
                if (team.name === orig_team.name) {
                    await this.upsertTeam(team);
                }
            });
        }
        else {
            throw new common_1.NotFoundException(`No Data found for Teams`);
        }
        if (filterDto) {
            filterDto.name = undefined;
            filterDto.search = undefined;
            filterDto.id = undefined;
            filterDto.conference = undefined;
            filterDto.division = undefined;
            filterDto._2k_rating = undefined;
        }
        return await this.getTeam(id);
    }
    async syncTeams(filterDto) {
        const teams = await this.syncService.getTeams();
        const errors = [];
        if (teams && teams.length > 0) {
            for (const idx in teams) {
                const team = teams[idx];
                try {
                    await this.upsertTeam(team);
                }
                catch (error) {
                    const err_message = `Failed to upsert team (name: ${team.name})`;
                    errors.push(err_message);
                    this.logger.error(err_message);
                }
            }
        }
        else {
            throw new common_1.NotFoundException(`No Data found for Teams`);
        }
        if (filterDto) {
            filterDto.name = undefined;
            filterDto.search = undefined;
            filterDto.id = undefined;
            filterDto.conference = undefined;
            filterDto.division = undefined;
        }
        return {
            total: teams.length,
            total_errors: errors.length,
            errors: errors,
        };
    }
    async syncTeamsRatings(filterDto) {
        const teams = await this.syncService.getAllTeamsPlayersRatings();
        return await this.teamRepository.syncTeamsRatings(teams);
    }
    async updateTeam(id, updateTeamDto) {
        const team = await this.getTeam(id);
        if (!updateTeamDto.name &&
            !updateTeamDto.logo &&
            !updateTeamDto.division &&
            !updateTeamDto.conference) {
            throw new common_1.NotFoundException(`You have to pass fields to update`);
        }
        return this.teamRepository.updateTeam(updateTeamDto, team);
    }
    async deleteTeam(id) {
        const result = await this.teamRepository.delete({ id: id });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Team with id #${id} not found`);
        }
        return result;
    }
};
TeamService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(team_repository_1.TeamRepository)),
    __metadata("design:paramtypes", [team_repository_1.TeamRepository, typeof (_a = typeof sync_service_1.SyncService !== "undefined" && sync_service_1.SyncService) === "function" ? _a : Object])
], TeamService);
exports.TeamService = TeamService;
//# sourceMappingURL=team.service.js.map