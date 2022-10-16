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
exports.Team = void 0;
const typeorm_1 = require("typeorm");
const team_division_enum_1 = require("./team-division.enum");
const team_conference_enum_1 = require("./team-conference.enum");
const player_entity_1 = require("../player/player.entity");
const random_entity_1 = require("../records/random/random.entity");
const class_validator_1 = require("class-validator");
const tournament_entity_1 = require("../records/tournament/tournament.entity");
let Team = class Team extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Team.prototype, "id", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Team.prototype, "name", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Team.prototype, "logo", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Team.prototype, "division", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Team.prototype, "conference", void 0);
__decorate([
    typeorm_1.OneToMany((type) => player_entity_1.Player, (player) => player.team, { eager: true }),
    __metadata("design:type", Array)
], Team.prototype, "players", void 0);
__decorate([
    typeorm_1.Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Team.prototype, "lastSyncAt", void 0);
__decorate([
    typeorm_1.OneToMany((type) => random_entity_1.Random, (record) => record.team1, { eager: true }),
    __metadata("design:type", Array)
], Team.prototype, "randomHomeEntities", void 0);
__decorate([
    typeorm_1.OneToMany((type) => random_entity_1.Random, (record) => record.team2, { eager: true }),
    __metadata("design:type", Array)
], Team.prototype, "randomAwayEntities", void 0);
__decorate([
    typeorm_1.OneToMany((type) => player_entity_1.Player, (player) => player.allStarTeam, { eager: true }),
    __metadata("design:type", Array)
], Team.prototype, "allstar_players", void 0);
__decorate([
    typeorm_1.OneToMany((type) => tournament_entity_1.Tournament, (record) => record.winner, { eager: true }),
    __metadata("design:type", Array)
], Team.prototype, "wonTournaments", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Team.prototype, "_2k_rating", void 0);
__decorate([
    typeorm_1.Column('timestamp', { nullable: true }),
    __metadata("design:type", Date)
], Team.prototype, "last2KSyncAt", void 0);
Team = __decorate([
    typeorm_1.Unique(['name']),
    typeorm_1.Entity()
], Team);
exports.Team = Team;
//# sourceMappingURL=team.entity.js.map