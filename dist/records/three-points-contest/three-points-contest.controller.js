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
exports.ThreePointsContestController = void 0;
const common_1 = require("@nestjs/common");
const create_three_points_contest_dto_1 = require("./dto/create-three-points-contest.dto");
const user_entity_1 = require("../../user/user.entity");
const list_three_points_contest_dto_1 = require("./dto/list-three-points-contest.dto");
const passport_1 = require("@nestjs/passport");
const three_points_contest_service_1 = require("./three-points-contest.service");
const get_user_decorator_1 = require("../../auth/get-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let ThreePointsContestController = class ThreePointsContestController {
    constructor(threePointsContestService) {
        this.threePointsContestService = threePointsContestService;
    }
    createRecord(createThreePointsContestDto, user) {
        return this.threePointsContestService.createRecord(createThreePointsContestDto, user);
    }
    async listRecords(listThreePointsContestDto, user) {
        const records = await this.threePointsContestService.listRecords(listThreePointsContestDto, user);
        return {
            total: records.length,
            data: records,
        };
    }
    async listRecordsByPlayer(listThreePointsContestDto, user) {
        const records = await this.threePointsContestService.listRecordsByPlayer(listThreePointsContestDto, user);
        return {
            total: Object.keys(records).length,
            data: records,
        };
    }
    async listRecordsBySpecificPlayer(listThreePointsContestDto, name, user) {
        const records = await this.threePointsContestService.listRecordsByPlayer(listThreePointsContestDto, user);
        return records[name] || {};
    }
    async listRecordsStats(listThreePointsContestDto, user) {
        const records = await this.threePointsContestService.listRecordsStats(listThreePointsContestDto, user);
        return {
            total: Object.keys(records.stats).length,
            data: records,
        };
    }
    deleteRecord(id, user) {
        return this.threePointsContestService.deleteRecord(id, user);
    }
};
__decorate([
    swagger_1.ApiOperation({
        summary: 'Create Record',
        description: 'create Three Points Contest Game.',
    }),
    common_1.Post(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Body()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_three_points_contest_dto_1.CreateThreePointsContestDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], ThreePointsContestController.prototype, "createRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Records',
        description: 'Get all Three Points Contest Games.',
    }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_three_points_contest_dto_1.ListThreePointsContestDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ThreePointsContestController.prototype, "listRecords", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Records by Player',
        description: 'Get all Three Points Contest Games group by player.',
    }),
    common_1.Get('/by-player'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_three_points_contest_dto_1.ListThreePointsContestDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ThreePointsContestController.prototype, "listRecordsByPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Records by Specific Player',
        description: 'Get all Three Points Contest Games for specific player.',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'name of the player you want to get records for',
        required: true,
        type: 'string',
    }),
    common_1.Get('/by-player/:name'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, common_1.Param('name')),
    __param(2, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_three_points_contest_dto_1.ListThreePointsContestDto, String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ThreePointsContestController.prototype, "listRecordsBySpecificPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Stats',
        description: 'Get Three Points Contest Games Stats.',
    }),
    common_1.Get('/stats'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_three_points_contest_dto_1.ListThreePointsContestDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ThreePointsContestController.prototype, "listRecordsStats", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Delete Record',
        description: 'Delete Three Points Contest Games record by id.',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'id of the record',
        required: true,
        type: 'number',
    }),
    common_1.Delete('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)), __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], ThreePointsContestController.prototype, "deleteRecord", null);
ThreePointsContestController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Records - ThreePointsContest'),
    common_1.Controller('records/three-points-contest'),
    __metadata("design:paramtypes", [three_points_contest_service_1.ThreePointsContestService])
], ThreePointsContestController);
exports.ThreePointsContestController = ThreePointsContestController;
//# sourceMappingURL=three-points-contest.controller.js.map