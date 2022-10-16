"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const player_entity_1 = require("./player.entity");
let PlayerRepository = class PlayerRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('PlayerRepository');
    }
    async createPlayer(createPlayerDto, team, all_star_team) {
        const { name, picture, height_feet, height_inches, position, weight_pounds, weight_kgs, jersey, debut_year, _2k_rating, height_meters, isActive, date_of_birth, college_name, country, draft_round, draft_pick, } = createPlayerDto;
        const player = this.create();
        player.name = name;
        player.picture = picture;
        player.height_feet = height_feet;
        player.height_inches = height_inches;
        player.position = position;
        player.weight_pounds = weight_pounds;
        player.weight_kgs = weight_kgs;
        player.jersey = jersey;
        player.debut_year = debut_year;
        player.height_meters = height_meters;
        player._2k_rating = _2k_rating;
        player.isActive = isActive;
        player.date_of_birth = date_of_birth;
        player.college_name = college_name;
        player.country = country;
        player.draft_round = draft_round;
        player.draft_pick = draft_pick;
        player.allStarTeam = all_star_team;
        const missing = [];
        if (!name) {
            missing.push('missing: name');
        }
        if (!picture) {
            missing.push('missing: picture');
        }
        if (team) {
            player.team = team;
        }
        else {
            missing.push('missing: team_name');
        }
        if (missing.length > 0) {
            throw new common_1.BadRequestException(missing);
        }
        try {
            await player.save();
        }
        catch (error) {
            if (Number(error.code) === 23505) {
                throw new common_1.ConflictException('Player already exists');
            }
            else {
                throw new common_1.InternalServerErrorException();
            }
        }
        return player;
    }
    async _getPlayerByName(name) {
        const query = this.createQueryBuilder('player');
        query.andWhere('player.name = :name', { name });
        query.leftJoinAndSelect('player.team', 'team');
        query.leftJoinAndSelect('player.allStarTeam', 'team t');
        const players = await query.getMany();
        return players.length == 0 ? undefined : players[0];
    }
    async upsertPlayer(createPlayerDto, team, all_star_team) {
        const { name } = createPlayerDto;
        if (!name) {
            throw new common_1.BadRequestException('name : missing');
        }
        const player = await this._getPlayerByName(name);
        if (!player)
            return await this.createPlayer(createPlayerDto, team, all_star_team);
        else
            return await this.updatePlayer(createPlayerDto, player, team, all_star_team);
    }
    async updatePlayer(updatePlayerDto, player, team, all_star_team) {
        const { name, picture, height_inches, height_feet, weight_pounds, position, weight_kgs, jersey, debut_year, _2k_rating, height_meters, isActive, date_of_birth, college_name, country, draft_round, draft_pick, } = updatePlayerDto;
        if (name)
            player.name = name;
        if (picture)
            player.picture = picture;
        if (height_inches)
            player.height_inches = height_inches;
        if (height_feet)
            player.height_feet = height_feet;
        if (weight_pounds)
            player.weight_pounds = weight_pounds;
        if (position)
            player.position = position;
        if (weight_kgs)
            player.weight_kgs = weight_kgs;
        if (jersey)
            player.jersey = jersey;
        if (debut_year)
            player.debut_year = debut_year;
        if (team)
            player.team = team;
        if (height_meters)
            player.height_meters = height_meters;
        if (_2k_rating)
            player._2k_rating = _2k_rating;
        if (isActive != undefined)
            player.isActive = isActive;
        if (date_of_birth)
            player.date_of_birth = date_of_birth;
        if (college_name)
            player.college_name = college_name;
        if (country)
            player.country = country;
        if (draft_round)
            player.draft_round = draft_round;
        if (draft_pick)
            player.draft_pick = draft_pick;
        if (all_star_team)
            player.allStarTeam = all_star_team;
        player.lastSyncAt = new Date();
        if (_2k_rating) {
            player.last2KSyncAt = new Date();
        }
        try {
            await player.save();
        }
        catch (error) {
            console.log(error);
            throw new common_1.InternalServerErrorException();
        }
        return await this.getPlayerByName(name);
    }
    async getPlayerByName(name) {
        const query = this.createQueryBuilder('player');
        if (name)
            query.andWhere('player.name = :name', { name });
        query.leftJoinAndSelect('player.team', 'team');
        query.leftJoinAndSelect('player.allStarTeam', 'team t');
        try {
            return await query.getOne();
        }
        catch (error) {
            this.logger.error(`Failed to get player with name ${name}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
    async getPlayer(id) {
        const query = this.createQueryBuilder('player');
        if (id)
            query.andWhere('player.id = :id', { id });
        query.leftJoinAndSelect('player.team', 'team');
        query.leftJoinAndSelect('player.allStarTeam', 'team t');
        try {
            return await query.getOne();
        }
        catch (error) {
            this.logger.error(`Failed to get player id #${id}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
    async getPlayers(filterDto) {
        const { name, search, position, height_feet, height_inch, height_meters, weight_pounds, id, weight_kgs, jersey, debut_year, _2k_rating, names, isActive, date_of_birth, college_name, country, draft_round, draft_pick, } = filterDto;
        const { include_inactive } = filterDto;
        const query = this.createQueryBuilder('player');
        if (search)
            query.where('(player.name LIKE :search)', { search: `%${search}%` });
        if (name)
            query.andWhere('player.name = :name', { name });
        if (position)
            query.andWhere('player.position = :position', { position });
        if (height_feet)
            query.andWhere('player.height_feet = :height_feet', { height_feet });
        if (height_inch)
            query.andWhere('player.height_inch = :height_inch', { height_inch });
        if (height_meters)
            query.andWhere('player.height_meters = :height_meters', {
                height_meters,
            });
        if (weight_pounds)
            query.andWhere('player.weight_pounds = :weight_pounds', {
                weight_pounds,
            });
        if (weight_kgs)
            query.andWhere('player.weight_kgs = :weight_kgs', {
                weight_kgs,
            });
        if (jersey)
            query.andWhere('player.jersey = :jersey', {
                jersey,
            });
        if (debut_year)
            query.andWhere('player.debut_year = :debut_year', {
                debut_year,
            });
        if (_2k_rating)
            query.andWhere('player._2k_rating = :_2k_rating', {
                _2k_rating,
            });
        if (!include_inactive) {
            query.andWhere('player.isActive = true', {});
        }
        if (id)
            query.andWhere('player.id = :id', { id });
        if (isActive != undefined) {
            query.andWhere('player.isActive = :isActive', { isActive });
        }
        if (date_of_birth)
            query.andWhere('player.date_of_birth = :date_of_birth', {
                date_of_birth,
            });
        if (college_name)
            query.andWhere('player.college_name = :college_name', { college_name });
        if (country)
            query.andWhere('player.country = :country', { country });
        if (draft_round)
            query.andWhere('player.draft_round = :draft_round', { draft_round });
        if (draft_pick)
            query.andWhere('player.draft_pick = :draft_pick', { draft_pick });
        if (names && names.split(',').length > 0) {
            const options = [];
            const values = {};
            names.split(',').forEach((name, idx) => {
                const key = 'name' + idx;
                options.push('(player.name = :' + key + ')');
                values[key] = name;
            });
            query.andWhere('(' + options.join(' OR ') + ')', values);
        }
        query.leftJoinAndSelect('player.team', 'team');
        query.leftJoinAndSelect('player.allStarTeam', 'team t');
        try {
            const players = await query.getMany();
            return players;
        }
        catch (error) {
            this.logger.error(`Failed to get players . Filters: ${JSON.stringify(filterDto)}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
    async inActivePlayer(player) {
        player.isActive = false;
        try {
            await player.save();
        }
        catch (error) {
            console.log(error);
            throw new common_1.InternalServerErrorException();
        }
        return await this.getPlayerByName(player.name);
    }
};
PlayerRepository = __decorate([
    typeorm_1.EntityRepository(player_entity_1.Player)
], PlayerRepository);
exports.PlayerRepository = PlayerRepository;
//# sourceMappingURL=player.repository.js.map