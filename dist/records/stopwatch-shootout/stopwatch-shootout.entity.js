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
exports.StopwatchShootout = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../user/user.entity");
const player_entity_1 = require("../../player/player.entity");
let StopwatchShootout = class StopwatchShootout extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], StopwatchShootout.prototype, "id", void 0);
__decorate([
    typeorm_1.ManyToOne((type) => user_entity_1.User, (user) => user.stopwatchShootoutEntities, {
        eager: false,
    }),
    __metadata("design:type", user_entity_1.User)
], StopwatchShootout.prototype, "user", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], StopwatchShootout.prototype, "userId", void 0);
__decorate([
    typeorm_1.ManyToOne((type) => player_entity_1.Player, (player) => player.stopwatchShootoutPlayerEntities, { eager: false }),
    __metadata("design:type", typeof (_a = typeof player_entity_1.Player !== "undefined" && player_entity_1.Player) === "function" ? _a : Object)
], StopwatchShootout.prototype, "player", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], StopwatchShootout.prototype, "playerId", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], StopwatchShootout.prototype, "roundLength", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], StopwatchShootout.prototype, "score", void 0);
__decorate([
    typeorm_1.Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", String)
], StopwatchShootout.prototype, "addedAt", void 0);
StopwatchShootout = __decorate([
    typeorm_1.Entity()
], StopwatchShootout);
exports.StopwatchShootout = StopwatchShootout;
//# sourceMappingURL=stopwatch-shootout.entity.js.map