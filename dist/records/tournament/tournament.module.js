"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentModule = void 0;
const common_1 = require("@nestjs/common");
const tournament_controller_1 = require("./tournament.controller");
const tournament_service_1 = require("./tournament.service");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../../auth/auth.module");
const passport_1 = require("@nestjs/passport");
const tournament_repository_1 = require("./tournament.repository");
const team_module_1 = require("../../team/team.module");
const player_module_1 = require("../../player/player.module");
let TournamentModule = class TournamentModule {
};
TournamentModule = __decorate([
    common_1.Module({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([tournament_repository_1.TournamentRepository]),
            common_1.HttpModule,
            auth_module_1.AuthModule,
            passport_1.PassportModule,
            team_module_1.TeamModule,
            player_module_1.PlayerModule,
        ],
        controllers: [tournament_controller_1.TournamentController],
        providers: [tournament_service_1.TournamentService],
        exports: [tournament_service_1.TournamentService],
    })
], TournamentModule);
exports.TournamentModule = TournamentModule;
//# sourceMappingURL=tournament.module.js.map