"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripModule = void 0;
const common_1 = require("@nestjs/common");
const trip_controller_1 = require("./trip.controller");
const trip_service_1 = require("./trip.service");
const typeorm_1 = require("@nestjs/typeorm");
const trip_repository_1 = require("./trip.repository");
const auth_module_1 = require("../auth/auth.module");
const passport_1 = require("@nestjs/passport");
let TripModule = class TripModule {
};
TripModule = __decorate([
    common_1.Module({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([trip_repository_1.TripRepository]),
            common_1.HttpModule,
            auth_module_1.AuthModule,
            passport_1.PassportModule,
        ],
        controllers: [trip_controller_1.TripController],
        providers: [trip_service_1.TripService],
        exports: [trip_service_1.TripService],
    })
], TripModule);
exports.TripModule = TripModule;
//# sourceMappingURL=trip.module.js.map