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
exports.SpaceJamPlayerController = void 0;
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const space_jam_player_service_1 = require("./space-jam-player.service");
const list_player_dto_1 = require("./dto/list-player-dto");
const get_user_decorator_1 = require("../auth/get-user.decorator");
const user_entity_1 = require("../user/user.entity");
let SpaceJamPlayerController = class SpaceJamPlayerController {
    constructor(playerService) {
        this.playerService = playerService;
    }
    async listPlayers(filterDto, user) {
        const players = await this.playerService.listPlayers(filterDto);
        return {
            total: players.length,
            data: players,
        };
    }
};
__decorate([
    swagger_1.ApiOperation({ summary: 'Get Players', description: 'Get NBA players.' }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, common_1.Query(common_1.ValidationPipe)),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_player_dto_1.ListSpaceJamPlayerDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], SpaceJamPlayerController.prototype, "listPlayers", null);
SpaceJamPlayerController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Space Jam Players'),
    common_1.Controller('space-jam/player'),
    __metadata("design:paramtypes", [space_jam_player_service_1.SpaceJamPlayerService])
], SpaceJamPlayerController);
exports.SpaceJamPlayerController = SpaceJamPlayerController;
//# sourceMappingURL=space-jam-player.controller.js.map