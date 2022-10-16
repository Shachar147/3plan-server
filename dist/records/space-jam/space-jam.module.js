"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceJamModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../../auth/auth.module");
const passport_1 = require("@nestjs/passport");
const space_jam_service_1 = require("./space-jam.service");
const space_jam_controller_1 = require("./space-jam.controller");
const space_jam_repository_1 = require("./space-jam.repository");
const space_jam_player_module_1 = require("../../space-jam-player/space-jam-player.module");
let SpaceJamModule = class SpaceJamModule {
};
SpaceJamModule = __decorate([
    common_1.Module({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([space_jam_repository_1.SpaceJamRepository]),
            common_1.HttpModule,
            auth_module_1.AuthModule,
            passport_1.PassportModule,
            space_jam_player_module_1.SpaceJamPlayerModule,
        ],
        controllers: [space_jam_controller_1.SpaceJamController],
        providers: [space_jam_service_1.SpaceJamService],
        exports: [space_jam_service_1.SpaceJamService],
    })
], SpaceJamModule);
exports.SpaceJamModule = SpaceJamModule;
//# sourceMappingURL=space-jam.module.js.map