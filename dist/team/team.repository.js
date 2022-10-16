"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const team_entity_1 = require("./team.entity");
let TeamRepository = class TeamRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('TeamRepository');
    }
    async createTeam(createTeamDto) {
        const { name, logo, division, conference, _2k_rating } = createTeamDto;
        const team = new team_entity_1.Team();
        team.name = name;
        team.logo = logo;
        team.division = division;
        team.conference = conference;
        team._2k_rating = _2k_rating;
        try {
            await team.save();
        }
        catch (error) {
            if (Number(error.code) === 23505) {
                throw new common_1.ConflictException('Team already exists');
            }
            else {
                throw new common_1.InternalServerErrorException();
            }
        }
        return team;
    }
    async upsertTeam(createTeamDto) {
        const { name } = createTeamDto;
        const query = this.createQueryBuilder('team');
        query.andWhere('team.name = :name', { name });
        const teams = await query.getMany();
        if (teams.length == 0)
            return await this.createTeam(createTeamDto);
        else
            return await this.updateTeam(createTeamDto, teams[0]);
    }
    async updateTeam(updateTeamDto, team) {
        const { name, logo, division, conference, _2k_rating } = updateTeamDto;
        if (name)
            team.name = name;
        if (logo)
            team.logo = logo;
        if (division)
            team.division = division;
        if (conference)
            team.conference = conference;
        if (_2k_rating)
            team._2k_rating = _2k_rating;
        team.lastSyncAt = new Date();
        if (_2k_rating) {
            team.last2KSyncAt = new Date();
        }
        try {
            await team.save();
        }
        catch (error) {
            if (Number(error.code) === 23505) {
                throw new common_1.ConflictException('Team already exists');
            }
            else {
                throw new common_1.InternalServerErrorException();
            }
        }
        return team;
    }
    async getTeams(filterDto) {
        const { name, search, division, conference, id, _2k_rating } = filterDto;
        const query = this.createQueryBuilder('team');
        if (search)
            query.where('(team.name LIKE :search)', { search: `%${search}%` });
        if (name)
            query.andWhere('team.name = :name', { name });
        if (division)
            query.andWhere('team.division = :division', { division });
        if (conference)
            query.andWhere('team.conference = :conference', { conference });
        if (id)
            query.andWhere('team.id = :id', { id });
        if (_2k_rating)
            query.andWhere('team._2k_rating = :_2k_rating', {
                _2k_rating,
            });
        query.leftJoinAndSelect('team.players', 'player');
        query.leftJoinAndSelect('team.allstar_players', 'player p');
        try {
            const teams = await query.getMany();
            teams.forEach((team) => {
                team.players.push(...team.allstar_players);
                team.players = team.players.filter((player) => player.isActive);
                delete team.allstar_players;
            });
            return teams;
        }
        catch (error) {
            this.logger.error(`Failed to get teams . Filters: ${JSON.stringify(filterDto)}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
    async syncTeamsRatings(teams) {
        const errors = [];
        let counter = 0;
        if (teams && Object.keys(teams).length) {
            const teams_names = Object.keys(teams);
            console.log('team_names', teams_names);
            for (let i = 0; i < teams_names.length; i++) {
                const team = teams_names[i];
                console.log(`Syncing ${team}...`);
                const players_hash = teams[team];
                counter += Object.keys(players_hash).length;
                console.log(players_hash);
                await Promise.all(Object.keys(players_hash).map((player) => {
                    const rating = players_hash[player];
                    if (player === 'OVERALL') {
                        console.log(`... Syncing ${player} - rating: ${rating}...`);
                    }
                    else {
                        console.log(`... Syncing ${team} - rating: ${rating}...`);
                    }
                    let sql = `UPDATE player p
                 SET _2k_rating = $1,
                 "last2KSyncAt" = CURRENT_TIMESTAMP
                 WHERE p.name = $2 AND p."teamId" in (SELECT id from team where name = $3)`;
                    let values = [rating, player, team];
                    if (player === 'OVERALL') {
                        sql = `UPDATE team
                 SET _2k_rating = $1,
                 "last2KSyncAt" = CURRENT_TIMESTAMP
                 WHERE name = $2`;
                        values = [rating, team];
                    }
                    this.query(sql, values);
                }));
                console.log('done syncing');
            }
        }
        else {
            throw new common_1.NotFoundException(`No Data found for Teams Ratings`);
        }
        return {
            total: counter,
            total_errors: errors.length,
            errors: errors,
        };
    }
    async _getTeamByName(name) {
        return await this.createQueryBuilder('team')
            .where('LOWER(team.name) = LOWER(:name)', { name })
            .leftJoinAndSelect('team.players', 'player')
            .getOne();
    }
};
TeamRepository = __decorate([
    typeorm_1.EntityRepository(team_entity_1.Team)
], TeamRepository);
exports.TeamRepository = TeamRepository;
//# sourceMappingURL=team.repository.js.map