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
exports.OneOnOneController = void 0;
const common_1 = require("@nestjs/common");
const create_oneonone_dto_1 = require("./dto/create-oneonone-dto");
const user_entity_1 = require("../../user/user.entity");
const list_oneonone_dto_1 = require("./dto/list-oneonone-dto");
const passport_1 = require("@nestjs/passport");
const one_on_one_service_1 = require("./one-on-one.service");
const get_user_decorator_1 = require("../../auth/get-user.decorator");
const update_oneonone_dto_1 = require("./dto/update-oneonone-dto");
const swagger_1 = require("@nestjs/swagger");
let OneOnOneController = class OneOnOneController {
    constructor(oneOnOneService) {
        this.oneOnOneService = oneOnOneService;
    }
    createRecord(createOneOnOneDto, user) {
        return this.oneOnOneService.createRecord(createOneOnOneDto, user);
    }
    async listRecords(listOneOnOneDto, user) {
        const records = await this.oneOnOneService.listRecords(listOneOnOneDto, user);
        return {
            total: records.length,
            data: records,
        };
    }
    async listRecordsByPlayer(listOneOnOneDto, user) {
        const records = await this.oneOnOneService.listRecordsByPlayer(listOneOnOneDto, user);
        return {
            total: Object.keys(records).length,
            data: records,
        };
    }
    async listRecordsBySpecificPlayer(listOneOnOneDto, name, user) {
        const records = await this.oneOnOneService.listRecordsByPlayer(listOneOnOneDto, user);
        return records[name] || {};
    }
    deleteRecord(id, user) {
        return this.oneOnOneService.deleteRecord(id, user);
    }
    updateRecord(id, updateOneOnOneDto, user) {
        return this.oneOnOneService.updateRecord(id, updateOneOnOneDto, user);
    }
};
__decorate([
    swagger_1.ApiOperation({
        summary: 'Create Records',
        description: 'create new One on One record.',
    }),
    common_1.Post(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Body()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_oneonone_dto_1.CreateOneOnOneDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], OneOnOneController.prototype, "createRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Records',
        description: 'list One on One records.',
    }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_oneonone_dto_1.ListOneOnOneDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], OneOnOneController.prototype, "listRecords", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Records By Player',
        description: 'list One on One records, grouped by NBA player.',
    }),
    common_1.Get('/by-player'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_oneonone_dto_1.ListOneOnOneDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], OneOnOneController.prototype, "listRecordsByPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Player Records by Name',
        description: 'list One on One records of specific player by name.',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'name of the player',
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
    __metadata("design:paramtypes", [list_oneonone_dto_1.ListOneOnOneDto, String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], OneOnOneController.prototype, "listRecordsBySpecificPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Delete Record by id',
        description: 'delete One on One record by id.',
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
], OneOnOneController.prototype, "deleteRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Update Record',
        description: 'update One on One record by id.',
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
    __metadata("design:paramtypes", [Object, update_oneonone_dto_1.UpdateOneOnOneDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], OneOnOneController.prototype, "updateRecord", null);
OneOnOneController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Records - One on One'),
    common_1.Controller('records/one-on-one'),
    __metadata("design:paramtypes", [one_on_one_service_1.OneOnOneService])
], OneOnOneController);
exports.OneOnOneController = OneOnOneController;
//# sourceMappingURL=one-on-one.controller.js.map