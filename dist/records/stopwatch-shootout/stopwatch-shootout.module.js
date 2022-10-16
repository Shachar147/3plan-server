"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StopwatchShootoutModule = void 0;
const common_1 = require("@nestjs/common");
const stopwatch_shootout_controller_1 = require("./stopwatch-shootout.controller");
const stopwatch_shootout_service_1 = require("./stopwatch-shootout.service");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../../auth/auth.module");
const passport_1 = require("@nestjs/passport");
const stopwatch_shootout_repository_1 = require("./stopwatch-shootout.repository");
const player_module_1 = require("../../player/player.module");
let StopwatchShootoutModule = class StopwatchShootoutModule {
};
StopwatchShootoutModule = __decorate([
    common_1.Module({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([stopwatch_shootout_repository_1.StopwatchShootoutRepository]),
            common_1.HttpModule,
            auth_module_1.AuthModule,
            player_module_1.PlayerModule,
            passport_1.PassportModule,
        ],
        controllers: [stopwatch_shootout_controller_1.StopwatchShootoutController],
        providers: [stopwatch_shootout_service_1.StopwatchShootoutService],
        exports: [stopwatch_shootout_service_1.StopwatchShootoutService],
    })
], StopwatchShootoutModule);
exports.StopwatchShootoutModule = StopwatchShootoutModule;
//# sourceMappingURL=stopwatch-shootout.module.js.map