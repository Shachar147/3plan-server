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
exports.SpaceJamController = void 0;
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const space_jam_service_1 = require("./space-jam.service");
const create_record_dto_1 = require("./dto/create-record-dto");
const list_records_dto_1 = require("./dto/list-records-dto");
const get_user_decorator_1 = require("../../auth/get-user.decorator");
const user_entity_1 = require("../../user/user.entity");
const update_record_dto_1 = require("./dto/update-record-dto");
let SpaceJamController = class SpaceJamController {
    constructor(spaceJamService) {
        this.spaceJamService = spaceJamService;
    }
    createRecord(createRecordDto, user) {
        return this.spaceJamService.createRecord(createRecordDto, user);
    }
    async listRecords(listDto, user) {
        const records = await this.spaceJamService.listRecords(listDto, user);
        return {
            total: records.length,
            data: records,
        };
    }
    async listRecordsByPlayer(listDto, user) {
        const records = await this.spaceJamService.listRecordsByPlayer(listDto, user);
        return {
            total: Object.keys(records).length,
            data: records,
        };
    }
    async listRecordsBySpecificPlayer(listDto, name, user) {
        const records = await this.spaceJamService.listRecordsByPlayer(listDto, user);
        return records[name] || {};
    }
    deleteRecord(id, user) {
        return this.spaceJamService.deleteRecord(id, user);
    }
    updateRecord(id, updateDto, user) {
        return this.spaceJamService.updateRecord(id, updateDto, user);
    }
};
__decorate([
    swagger_1.ApiOperation({
        summary: 'Create Records',
        description: 'create new Space Jam record.',
    }),
    common_1.Post(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Body()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_record_dto_1.CreateRecordDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], SpaceJamController.prototype, "createRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Records',
        description: 'list Space Jam records.',
    }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()), __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_records_dto_1.ListRecordsDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], SpaceJamController.prototype, "listRecords", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Records By Player',
        description: 'list Space Jam records, grouped by player.',
    }),
    common_1.Get('/by-player'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_records_dto_1.ListRecordsDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], SpaceJamController.prototype, "listRecordsByPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Player Records by Name',
        description: 'list Space Jam records of specific player by name.',
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
    __metadata("design:paramtypes", [list_records_dto_1.ListRecordsDto, String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], SpaceJamController.prototype, "listRecordsBySpecificPlayer", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Delete Record by id',
        description: 'delete Space Jam record by id.',
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
], SpaceJamController.prototype, "deleteRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Update Record',
        description: 'update Space Jam record by id.',
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
    __metadata("design:paramtypes", [Object, update_record_dto_1.UpdateRecordDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], SpaceJamController.prototype, "updateRecord", null);
SpaceJamController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Records - Space Jam'),
    common_1.Controller('records/space-jam'),
    __metadata("design:paramtypes", [space_jam_service_1.SpaceJamService])
], SpaceJamController);
exports.SpaceJamController = SpaceJamController;
//# sourceMappingURL=space-jam.controller.js.map