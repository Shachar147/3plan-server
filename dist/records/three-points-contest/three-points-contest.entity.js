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
exports.ThreePointsContest = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../user/user.entity");
const player_entity_1 = require("../../player/player.entity");
let ThreePointsContest = class ThreePointsContest extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], ThreePointsContest.prototype, "id", void 0);
__decorate([
    typeorm_1.ManyToOne((type) => user_entity_1.User, (user) => user.oneOnOneEntities, { eager: false }),
    __metadata("design:type", user_entity_1.User)
], ThreePointsContest.prototype, "user", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], ThreePointsContest.prototype, "userId", void 0);
__decorate([
    typeorm_1.JoinTable(),
    typeorm_1.ManyToMany((type) => player_entity_1.Player),
    __metadata("design:type", Array)
], ThreePointsContest.prototype, "team1", void 0);
__decorate([
    typeorm_1.JoinTable(),
    typeorm_1.ManyToMany((type) => player_entity_1.Player),
    __metadata("design:type", Array)
], ThreePointsContest.prototype, "team2", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], ThreePointsContest.prototype, "roundLength", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], ThreePointsContest.prototype, "computerLevel", void 0);
__decorate([
    typeorm_1.Column('text', { array: true }),
    __metadata("design:type", Array)
], ThreePointsContest.prototype, "computers", void 0);
__decorate([
    typeorm_1.Column('text', { array: true }),
    __metadata("design:type", Array)
], ThreePointsContest.prototype, "randoms", void 0);
__decorate([
    typeorm_1.Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ThreePointsContest.prototype, "leaderboard", void 0);
__decorate([
    typeorm_1.Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ThreePointsContest.prototype, "scoresHistory", void 0);
__decorate([
    typeorm_1.Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", String)
], ThreePointsContest.prototype, "addedAt", void 0);
__decorate([
    typeorm_1.ManyToOne((type) => player_entity_1.Player, (player) => player.randomMVPs, { eager: false }),
    __metadata("design:type", typeof (_a = typeof player_entity_1.Player !== "undefined" && player_entity_1.Player) === "function" ? _a : Object)
], ThreePointsContest.prototype, "winner", void 0);
__decorate([
    typeorm_1.Column({ nullable: true }),
    __metadata("design:type", Number)
], ThreePointsContest.prototype, "winnerId", void 0);
ThreePointsContest = __decorate([
    typeorm_1.Entity()
], ThreePointsContest);
exports.ThreePointsContest = ThreePointsContest;
//# sourceMappingURL=three-points-contest.entity.js.map