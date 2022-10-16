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
exports.StopwatchShootoutService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const stopwatch_shootout_repository_1 = require("./stopwatch-shootout.repository");
const player_service_1 = require("../../player/player.service");
const class_validator_1 = require("class-validator");
let StopwatchShootoutService = class StopwatchShootoutService {
    constructor(stopwatchRepository, playerService) {
        this.stopwatchRepository = stopwatchRepository;
        this.playerService = playerService;
        this.logger = new common_1.Logger('StopwatchShootoutService');
    }
    async createRecord(createDto, user) {
        const name = createDto.player;
        ['player', 'roundLength', 'score'].forEach((iter) => {
            if (createDto[iter] == undefined) {
                throw new common_1.BadRequestException(`${iter} : missing`);
            }
        });
        const player = await this.playerService.getPlayerByName(name);
        const record = await this.stopwatchRepository.createRecord(createDto, player, user);
        const listDto = {};
        const stats = await this.listRecordsByPlayer(listDto, user);
        const toReturn = {};
        toReturn[name] = stats[name];
        return toReturn;
    }
    async deleteRecord(id, user) {
        const result = await this.stopwatchRepository.delete({
            id: id,
            userId: user.id,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        return result;
    }
    async updateRecord(id, updateStopwatchShootoutDto, user) {
        const record = await this.stopwatchRepository.findOne({
            id: id,
            userId: user.id,
        });
        const player = await this.playerService.getPlayer(record.playerId);
        if (!class_validator_1.isDefined(updateStopwatchShootoutDto.score)) {
            throw new common_1.BadRequestException(`You have to pass fields to update`);
        }
        const updated = await this.stopwatchRepository.updateRecord(record, updateStopwatchShootoutDto);
        const listDto = {};
        const stats = await this.listRecordsByPlayer(listDto, user);
        const toReturn = {};
        toReturn[player.name] = stats[player.name];
        return toReturn;
    }
    async listRecords(filterDto, user) {
        const { player } = filterDto;
        const playerObj = class_validator_1.isDefined(player)
            ? await this.playerService.getPlayerByName(player)
            : undefined;
        const records = await this.stopwatchRepository.listRecords(filterDto, user, playerObj);
        records.map((iter) => {
            iter['player_name'] = iter.player.name;
            delete iter.player;
            return iter;
        });
        return records;
    }
    async listRecordsByPlayer(filterDto, user) {
        const { player, roundLength, score } = filterDto;
        const playerObj = class_validator_1.isDefined(player)
            ? await this.playerService.getPlayerByName(player)
            : undefined;
        const records = await this.stopwatchRepository.listRecords(filterDto, user, playerObj);
        const players = {};
        const baseStats = {
            total_games: 0,
            total_scored: 0,
            total_minutes: 0,
            average_points_per_minute: 0,
            average_round_length: 0,
        };
        records.forEach((record) => {
            const player = record.player.name;
            players[player] = class_validator_1.isDefined(players[player])
                ? players[player]
                : Object.assign({}, baseStats);
            players[player].total_games += 1;
            players[player].total_scored += record.score;
            players[player].total_minutes += record.roundLength;
            players[player].average_round_length = (players[player].total_minutes / players[player].total_games).toFixed(2);
            players[player].average_points_per_minute = (players[player].total_scored / players[player].total_games).toFixed(2);
            players[player].records = players[player].records || [];
            players[player].records.push(record);
        });
        return players;
    }
};
StopwatchShootoutService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(stopwatch_shootout_repository_1.StopwatchShootoutRepository)),
    __metadata("design:paramtypes", [stopwatch_shootout_repository_1.StopwatchShootoutRepository, typeof (_a = typeof player_service_1.PlayerService !== "undefined" && player_service_1.PlayerService) === "function" ? _a : Object])
], StopwatchShootoutService);
exports.StopwatchShootoutService = StopwatchShootoutService;
//# sourceMappingURL=stopwatch-shootout.service.js.map