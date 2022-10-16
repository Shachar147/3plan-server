"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceJamPlayerModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const passport_1 = require("@nestjs/passport");
const space_jam_player_service_1 = require("./space-jam-player.service");
const space_jam_player_controller_1 = require("./space-jam-player.controller");
let SpaceJamPlayerModule = class SpaceJamPlayerModule {
};
SpaceJamPlayerModule = __decorate([
    common_1.Module({
        imports: [
            common_1.HttpModule,
            auth_module_1.AuthModule,
            passport_1.PassportModule,
        ],
        controllers: [space_jam_player_controller_1.SpaceJamPlayerController],
        providers: [space_jam_player_service_1.SpaceJamPlayerService],
        exports: [space_jam_player_service_1.SpaceJamPlayerService],
    })
], SpaceJamPlayerModule);
exports.SpaceJamPlayerModule = SpaceJamPlayerModule;
//# sourceMappingURL=space-jam-player.module.js.map