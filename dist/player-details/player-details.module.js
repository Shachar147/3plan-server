"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerDetailsModule = void 0;
const common_1 = require("@nestjs/common");
const player_details_controller_1 = require("./player-details.controller");
const player_details_service_1 = require("./player-details.service");
const typeorm_1 = require("@nestjs/typeorm");
const sync_module_1 = require("../sync/sync.module");
const auth_module_1 = require("../auth/auth.module");
const passport_1 = require("@nestjs/passport");
const player_details_repository_1 = require("./player-details.repository");
const player_module_1 = require("../player/player.module");
let PlayerDetailsModule = class PlayerDetailsModule {
};
PlayerDetailsModule = __decorate([
    common_1.Module({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([player_details_repository_1.PlayerDetailsRepository]),
            common_1.HttpModule,
            sync_module_1.SyncModule,
            auth_module_1.AuthModule,
            passport_1.PassportModule,
            player_module_1.PlayerModule,
        ],
        controllers: [player_details_controller_1.PlayerDetailsController],
        providers: [player_details_service_1.PlayerDetailsService],
        exports: [player_details_service_1.PlayerDetailsService],
    })
], PlayerDetailsModule);
exports.PlayerDetailsModule = PlayerDetailsModule;
//# sourceMappingURL=player-details.module.js.map