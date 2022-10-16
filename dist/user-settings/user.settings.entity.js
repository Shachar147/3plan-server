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
exports.UserSettings = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
let UserSettings = class UserSettings extends typeorm_1.BaseEntity {
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], UserSettings.prototype, "id", void 0);
__decorate([
    typeorm_1.ManyToOne((type) => user_entity_1.User, (user) => user.settings, { eager: false }),
    __metadata("design:type", user_entity_1.User)
], UserSettings.prototype, "user", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], UserSettings.prototype, "userId", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], UserSettings.prototype, "name", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], UserSettings.prototype, "value", void 0);
UserSettings = __decorate([
    typeorm_1.Unique('uniqueSettingNamePerUser', ['name', 'userId']),
    typeorm_1.Entity()
], UserSettings);
exports.UserSettings = UserSettings;
//# sourceMappingURL=user.settings.entity.js.map