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
exports.StopwatchShootoutController = void 0;
const common_1 = require("@nestjs/common");
const create_stopwatch_shootout_dto_1 = require("./dto/create-stopwatch-shootout-dto");
const user_entity_1 = require("../../user/user.entity");
const list_stopwatch_shootout_dto_1 = require("./dto/list-stopwatch-shootout-dto");
const passport_1 = require("@nestjs/passport");
const stopwatch_shootout_service_1 = require("./stopwatch-shootout.service");
const get_user_decorator_1 = require("../../auth/get-user.decorator");
const update_stopwatch_shootout_dto_1 = require("./dto/update-stopwatch-shootout-dto");
const swagger_1 = require("@nestjs/swagger");
let StopwatchShootoutController = class StopwatchShootoutController {
    constructor(oneOnOneService) {
        this.oneOnOneService = oneOnOneService;
    }
    createRecord(createStopwatchShootoutDto, user) {
        return this.oneOnOneService.createRecord(createStopwatchShootoutDto, user);
    }
    async listRecords(listStopwatchShootoutDto, user) {
        const records = await this.oneOnOneService.listRecords(listStopwatchShootoutDto, user);
        return {
            total: records.length,
            data: records,
        };
    }
    async listRecordsByPlayer(listStopwatchShootoutDto, user) {
        const records = await this.oneOnOneService.listRecordsByPlayer(listStopwatchShootoutDto, user);
        return {
            total: Object.keys(records).length,
            data: records,
        };
    }
    async listRecordsBySpecificPlayer(listStopwatchShootoutDto, name, user) {
        const records = await this.oneOnOneService.listRecordsByPlayer(listStopwatchShootoutDto, user);
        return records[name] || {};
    }
    deleteRecord(id, user) {
        return this.oneOnOneService.deleteRecord(id, user);
    }
    updateRecord(id, updateStopwatchShootoutDto, user) {
        return this.oneOnOneService.updateRecord(id, updateStopwatchShootoutDto, user);
    }
};
__decorate([
    swagger_1.ApiOperation({
        summary: 'Create Record',
        description: 'create Stopwatch Shootout Games record.',
    }),
    common_1.Post(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Body()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stopwatch_shootout_dto_1.CreateStopwatchShootoutDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], StopwatchShootoutController.prototype, "createRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Records',
        description: 'get Stopwatch Shootout Games records.',
    }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_stopwatch_shootout_dto_1.ListStopwatchShootoutDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], StopwatchShootoutController.prototype, "listRecords", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Records by Player',
        description: 'get Stopwatch Shootout Games records grouped by player.',
    }),
    common_1.Get('/by-player'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_stopwatch_shootout_dto_1.ListStopwatchShootoutDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], StopwatchShootoutController.prototype, "listRecordsByPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Records for specific Player',
        description: 'get Stopwatch Shootout Games records for specific player.',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'the name of the player you want to get records for',
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
    __metadata("design:paramtypes", [list_stopwatch_shootout_dto_1.ListStopwatchShootoutDto, String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], StopwatchShootoutController.prototype, "listRecordsBySpecificPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Delete Record',
        description: 'delete Stopwatch Shootout Games record by id.',
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
], StopwatchShootoutController.prototype, "deleteRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Update Record',
        description: 'update Stopwatch Shootout Game record by id.',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'id of the record',
        required: true,
        type: 'number',
    }),
    common_1.Put('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __param(2, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_stopwatch_shootout_dto_1.UpdateStopwatchShootoutDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], StopwatchShootoutController.prototype, "updateRecord", null);
StopwatchShootoutController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Records - Stopwatch Shootout'),
    common_1.Controller('records/stopwatch-shootout'),
    __metadata("design:paramtypes", [stopwatch_shootout_service_1.StopwatchShootoutService])
], StopwatchShootoutController);
exports.StopwatchShootoutController = StopwatchShootoutController;
//# sourceMappingURL=stopwatch-shootout.controller.js.map