"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneOnOneModule = void 0;
const common_1 = require("@nestjs/common");
const one_on_one_controller_1 = require("./one-on-one.controller");
const one_on_one_service_1 = require("./one-on-one.service");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../../auth/auth.module");
const passport_1 = require("@nestjs/passport");
const one_on_one_repository_1 = require("./one-on-one.repository");
const player_module_1 = require("../../player/player.module");
let OneOnOneModule = class OneOnOneModule {
};
OneOnOneModule = __decorate([
    common_1.Module({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([one_on_one_repository_1.OneOnOneRepository]),
            common_1.HttpModule,
            auth_module_1.AuthModule,
            player_module_1.PlayerModule,
            passport_1.PassportModule,
        ],
        controllers: [one_on_one_controller_1.OneOnOneController],
        providers: [one_on_one_service_1.OneOnOneService],
        exports: [one_on_one_service_1.OneOnOneService],
    })
], OneOnOneModule);
exports.OneOnOneModule = OneOnOneModule;
//# sourceMappingURL=one-on-one.module.js.map