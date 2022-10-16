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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealdataController = void 0;
const common_1 = require("@nestjs/common");
const realdata_service_1 = require("./realdata.service");
const swagger_1 = require("@nestjs/swagger");
let RealdataController = class RealdataController {
    constructor(realdataService) {
        this.realdataService = realdataService;
    }
    async getInjuredPlayers() {
        const injured = await this.realdataService.getInjuredPlayers();
        return {
            total: injured.length,
            data: injured,
        };
    }
    getTodaysGames(date) {
        return this.realdataService.getTodayGames(date);
    }
};
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Injured Players',
        description: 'Sync injured NBA players (update list of injured players based on current real data)',
    }),
    common_1.Get('/injured'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RealdataController.prototype, "getInjuredPlayers", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Todays Games',
        description: "Get today games, based on given date or 'today-games'.",
    }),
    swagger_1.ApiParam({
        name: 'date',
        description: "get today games, based on the given date. for example: '2021-04-06' or 'today-games'",
        required: true,
        type: 'string',
    }),
    common_1.Get('/:date'),
    __param(0, common_1.Param('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealdataController.prototype, "getTodaysGames", null);
RealdataController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Real Data'),
    common_1.Controller('realdata'),
    __metadata("design:paramtypes", [realdata_service_1.RealdataService])
], RealdataController);
exports.RealdataController = RealdataController;
//# sourceMappingURL=realdata.controller.js.map