"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerModule = void 0;
const common_1 = require("@nestjs/common");
const player_controller_1 = require("./player.controller");
const player_service_1 = require("./player.service");
const typeorm_1 = require("@nestjs/typeorm");
const sync_module_1 = require("../sync/sync.module");
const player_repository_1 = require("./player.repository");
const team_module_1 = require("../team/team.module");
const auth_module_1 = require("../auth/auth.module");
const passport_1 = require("@nestjs/passport");
let PlayerModule = class PlayerModule {
};
PlayerModule = __decorate([
    common_1.Module({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([player_repository_1.PlayerRepository]),
            common_1.HttpModule,
            team_module_1.TeamModule,
            sync_module_1.SyncModule,
            auth_module_1.AuthModule,
            passport_1.PassportModule,
        ],
        controllers: [player_controller_1.PlayerController],
        providers: [player_service_1.PlayerService],
        exports: [player_service_1.PlayerService],
    })
], PlayerModule);
exports.PlayerModule = PlayerModule;
//# sourceMappingURL=player.module.js.map