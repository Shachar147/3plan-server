"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncModule = void 0;
const common_1 = require("@nestjs/common");
const sync_service_1 = require("./sync.service");
const sync_controller_1 = require("./sync.controller");
const balldontlie_service_1 = require("./api/balldontlie.service");
const datanbanet_service_1 = require("./api/datanbanet.service");
const basketballreference_service_1 = require("./api/basketballreference.service");
const auth_module_1 = require("../auth/auth.module");
const twokratings_service_1 = require("./api/twokratings.service");
const statmuse_service_1 = require("./api/statmuse.service");
let SyncModule = class SyncModule {
};
SyncModule = __decorate([
    common_1.Module({
        imports: [common_1.HttpModule],
        providers: [
            sync_service_1.SyncService,
            balldontlie_service_1.BallDontLieService,
            datanbanet_service_1.DatanbanetService,
            basketballreference_service_1.BasketballreferenceService,
            twokratings_service_1.TwoKRatingsService,
            statmuse_service_1.StatMuseService,
            auth_module_1.AuthModule,
        ],
        controllers: [sync_controller_1.SyncController],
        exports: [sync_service_1.SyncService],
    })
], SyncModule);
exports.SyncModule = SyncModule;
//# sourceMappingURL=sync.module.js.map