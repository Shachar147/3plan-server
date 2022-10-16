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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tournament = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../user/user.entity");
const team_entity_1 = require("../../team/team.entity");
const player_entity_1 = require("../../player/player.entity");
let Tournament = class Tournament extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Tournament.prototype, "id", void 0);
__decorate([
    typeorm_1.ManyToOne((type) => user_entity_1.User, (user) => user.tournaments, { eager: false }),
    __metadata("design:type", user_entity_1.User)
], Tournament.prototype, "user", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], Tournament.prototype, "userId", void 0);
__decorate([
    typeorm_1.Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", String)
], Tournament.prototype, "addedAt", void 0);
__decorate([
    typeorm_1.ManyToOne((type) => team_entity_1.Team, (player) => player.wonTournaments, {
        eager: false,
    }),
    __metadata("design:type", team_entity_1.Team)
], Tournament.prototype, "winner", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], Tournament.prototype, "winnerId", void 0);
__decorate([
    typeorm_1.JoinTable(),
    typeorm_1.ManyToMany((type) => team_entity_1.Team),
    __metadata("design:type", Array)
], Tournament.prototype, "teams", void 0);
__decorate([
    typeorm_1.Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Tournament.prototype, "gamesHistory", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], Tournament.prototype, "numberOfTeams", void 0);
__decorate([
    typeorm_1.ManyToOne((type) => player_entity_1.Player, (player) => player.mvpTournaments, {
        eager: false,
        nullable: true,
    }),
    __metadata("design:type", typeof (_a = typeof player_entity_1.Player !== "undefined" && player_entity_1.Player) === "function" ? _a : Object)
], Tournament.prototype, "mvpPlayer", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], Tournament.prototype, "mvpPlayerId", void 0);
Tournament = __decorate([
    typeorm_1.Entity()
], Tournament);
exports.Tournament = Tournament;
//# sourceMappingURL=tournament.entity.js.map