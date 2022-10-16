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
exports.Player = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
const player_position_enum_1 = require("./player-position.enum");
const team_entity_1 = require("../team/team.entity");
const one_on_one_entity_1 = require("../records/one-on-one/one-on-one.entity");
const random_entity_1 = require("../records/random/random.entity");
const stopwatch_shootout_entity_1 = require("../records/stopwatch-shootout/stopwatch-shootout.entity");
const tournament_entity_1 = require("../records/tournament/tournament.entity");
let Player = class Player extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Player.prototype, "id", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Player.prototype, "name", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Player.prototype, "picture", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", String)
], Player.prototype, "position", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Player.prototype, "height_feet", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Player.prototype, "height_meters", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Player.prototype, "height_inches", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Player.prototype, "weight_pounds", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], Player.prototype, "weight_kgs", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Player.prototype, "jersey", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Player.prototype, "debut_year", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Player.prototype, "_2k_rating", void 0);
__decorate([
    typeorm_1.ManyToOne((type) => team_entity_1.Team, (team) => team.players, {
        eager: false,
        onDelete: 'CASCADE',
    }),
    __metadata("design:type", team_entity_1.Team)
], Player.prototype, "team", void 0);
__decorate([
    typeorm_1.OneToMany((type) => one_on_one_entity_1.OneOnOne, (record) => record.player2, { eager: true }),
    __metadata("design:type", Array)
], Player.prototype, "oneOnOneHomeEntities", void 0);
__decorate([
    typeorm_1.OneToMany((type) => one_on_one_entity_1.OneOnOne, (record) => record.player1, { eager: true }),
    __metadata("design:type", Array)
], Player.prototype, "oneOnOneAwayEntities", void 0);
__decorate([
    typeorm_1.Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Player.prototype, "lastSyncAt", void 0);
__decorate([
    typeorm_1.Column('timestamp', { nullable: true }),
    __metadata("design:type", Date)
], Player.prototype, "last2KSyncAt", void 0);
__decorate([
    typeorm_1.OneToMany((type) => random_entity_1.Random, (record) => record.mvp_player, { eager: true }),
    __metadata("design:type", Array)
], Player.prototype, "randomMVPs", void 0);
__decorate([
    typeorm_1.OneToMany((type) => tournament_entity_1.Tournament, (record) => record.mvpPlayer, {
        eager: true,
    }),
    __metadata("design:type", Array)
], Player.prototype, "mvpTournaments", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Player.prototype, "draft_pick", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", String)
], Player.prototype, "date_of_birth", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", String)
], Player.prototype, "college_name", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", String)
], Player.prototype, "country", void 0);
__decorate([
    class_validator_1.IsOptional(),
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Player.prototype, "draft_round", void 0);
__decorate([
    typeorm_1.Column({ default: () => 'true' }),
    __metadata("design:type", Boolean)
], Player.prototype, "isActive", void 0);
__decorate([
    typeorm_1.OneToMany((type) => stopwatch_shootout_entity_1.StopwatchShootout, (record) => record.player, {
        eager: true,
    }),
    __metadata("design:type", Array)
], Player.prototype, "stopwatchShootoutPlayerEntities", void 0);
__decorate([
    typeorm_1.ManyToOne((type) => team_entity_1.Team, (allStarTeam) => allStarTeam.players, {
        eager: false,
        onDelete: 'CASCADE',
    }),
    __metadata("design:type", team_entity_1.Team)
], Player.prototype, "allStarTeam", void 0);
Player = __decorate([
    typeorm_1.Unique(['name']),
    typeorm_1.Entity()
], Player);
exports.Player = Player;
//# sourceMappingURL=player.entity.js.map