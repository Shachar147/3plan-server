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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const team_entity_1 = require("../team/team.entity");
const datanbanet_service_1 = require("./api/datanbanet.service");
const basketballreference_service_1 = require("./api/basketballreference.service");
const twokratings_service_1 = require("./api/twokratings.service");
const statmuse_service_1 = require("./api/statmuse.service");
const const_1 = require("../shared/const");
const team_division_enum_1 = require("../team/team-division.enum");
const team_conference_enum_1 = require("../team/team-conference.enum");
const server_config_1 = require("../config/server.config");
let SyncService = class SyncService {
    constructor(NbaAPI, BasketballReferenceAPI, _2KRatingsAPI, statMuseAPI) {
        this.NbaAPI = NbaAPI;
        this.BasketballReferenceAPI = BasketballReferenceAPI;
        this._2KRatingsAPI = _2KRatingsAPI;
        this.statMuseAPI = statMuseAPI;
    }
    async getTeams() {
        const api_teams = await this.NbaAPI.getTeams();
        const teams = [];
        if (api_teams && api_teams.data) {
            api_teams.data.forEach(function (iter) {
                const team = new team_entity_1.Team();
                team.name = iter.name;
                team.logo = iter.logo;
                team.division = iter.division;
                team.conference = iter.conference;
                teams.push(team);
            });
        }
        const allstar_teams = await this.getAllStarTeams();
        teams.push(...allstar_teams);
        return teams;
    }
    async getAllStarTeams() {
        const teams = [];
        const team = new team_entity_1.Team();
        team.name = 'Team LeBron';
        team.logo = '/team-lebron.png';
        team.division = team_division_enum_1.TeamDivision.ALLSTAR;
        team.conference = team_conference_enum_1.TeamConference.WEST;
        teams.push(team);
        const team2 = new team_entity_1.Team();
        team2.name = 'Team Durant';
        team2.logo = '/team-durant.png';
        team2.division = team_division_enum_1.TeamDivision.ALLSTAR;
        team2.conference = team_conference_enum_1.TeamConference.EAST;
        teams.push(team2);
        return teams;
    }
    async get3PointShooters() {
        const players = await this.BasketballReferenceAPI.get3PointShooters();
        return players;
    }
    async getPlayers() {
        const api_players = await this.NbaAPI.getPlayers();
        const players = [];
        if (api_players) {
            api_players.forEach(function (iter) {
                const player = {};
                player['name'] = iter.name;
                player['weight_pounds'] = iter.weight_pounds;
                player['position'] = iter.position;
                player['picture'] = iter.picture;
                player['height_inches'] = iter.height_inches;
                player['height_feet'] = iter.height_feet;
                if (iter.team)
                    player['team_name'] = iter.team;
                player['weight_kgs'] = iter.weight_kgs;
                player['jersey'] = iter.jersey;
                player['debut_year'] = iter.debut_year;
                player['height_meters'] = iter.height_meters;
                player['isActive'] = iter.isActive;
                player['date_of_birth'] = iter.date_of_birth;
                player['college_name'] = iter.college_name;
                player['country'] = iter.country;
                player['draft_round'] = iter.draft_round;
                player['draft_pick'] = iter.draft_pick;
                player['allstar_team_name'] = iter.allStarTeam;
                players.push(player);
            });
        }
        return players;
    }
    async getTeamPlayersRatings(team_name) {
        if (team_name.indexOf('Team ') !== -1) {
            return {};
        }
        return await this._2KRatingsAPI.getTeamPlayers2KRatings(team_name);
    }
    async getAllTeamsPlayersRatings() {
        const teams = await this.getTeams();
        const all_teams = {};
        for (let i = 0; i < teams.length; i++) {
            const team_name = teams[i].name;
            console.log('team name - ' + team_name);
            if (team_name.indexOf('Team ') === -1) {
                const ratings = await this.getTeamPlayersRatings(team_name);
                all_teams[team_name] = ratings;
            }
        }
        return all_teams;
    }
    async getPlayerRealStats(player_name) {
        return await this.statMuseAPI.getPlayerRealStats(player_name);
    }
    async getPopularPlayersRealStats() {
        const popularPlayers = const_1.POPULAR_PLAYERS;
        const toReturn = {};
        for (let i = 0; i < popularPlayers.length; i++) {
            const player_name = popularPlayers[i];
            if (server_config_1.debug_mode)
                console.log(`getting real stats for - ${i}/${popularPlayers.length} - ${player_name} ...`);
            toReturn[player_name] = await this.statMuseAPI.getPlayerRealStats(player_name);
            if (server_config_1.debug_mode)
                console.log(toReturn[player_name]);
            if (Object.keys(toReturn[player_name]).length === 0) {
                console.error(`--- ERROR: No data found for player ${player_name}`);
            }
        }
        return toReturn;
    }
};
SyncService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [datanbanet_service_1.DatanbanetService,
        basketballreference_service_1.BasketballreferenceService,
        twokratings_service_1.TwoKRatingsService,
        statmuse_service_1.StatMuseService])
], SyncService);
exports.SyncService = SyncService;
//# sourceMappingURL=sync.service.js.map