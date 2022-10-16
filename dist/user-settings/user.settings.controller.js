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
exports.UserSettingsController = void 0;
const common_1 = require("@nestjs/common");
const create_dto_1 = require("./dto/create-dto");
const list_dto_1 = require("./dto/list-dto");
const passport_1 = require("@nestjs/passport");
const user_settings_service_1 = require("./user.settings.service");
const update_dto_1 = require("./dto/update-dto");
const user_entity_1 = require("../user/user.entity");
const get_user_decorator_1 = require("../auth/get-user.decorator");
const swagger_1 = require("@nestjs/swagger");
let UserSettingsController = class UserSettingsController {
    constructor(service) {
        this.service = service;
    }
    createRecord(createDtp, user) {
        return this.service.createRecord(createDtp, user);
    }
    async listRecords(listDto, user) {
        const records = await this.service.listRecords(listDto, user);
        return {
            total: records.length,
            data: records,
        };
    }
    async getRecord(id, user) {
        return await this.service.getRecord(id, user);
    }
    deleteRecord(id, user) {
        return this.service.deleteRecord(id, user);
    }
    updateRecord(id, updateDto, user) {
        return this.service.updateRecord(id, updateDto, user);
    }
    updateRecordByName(name, updateDto, user) {
        return this.service.updateRecordByName(name, updateDto, user);
    }
};
__decorate([
    swagger_1.ApiOperation({
        summary: 'Create Record',
        description: 'Create new User Setting.',
    }),
    common_1.Post(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Body()), __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dto_1.CreateDto, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], UserSettingsController.prototype, "createRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Records',
        description: 'List all User Settings.',
    }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()), __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_dto_1.ListDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UserSettingsController.prototype, "listRecords", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Record',
        description: 'Get Specific User Setting.',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'setting id',
        required: true,
        type: 'number',
    }),
    common_1.Get('/:id'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Param('id', common_1.ParseIntPipe)), __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UserSettingsController.prototype, "getRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Delete Record',
        description: 'Delete User setting by id',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'setting id',
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
], UserSettingsController.prototype, "deleteRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Update Record',
        description: 'Update User setting by id',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'setting id',
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
    __metadata("design:paramtypes", [Object, update_dto_1.UpdateDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], UserSettingsController.prototype, "updateRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Update Record by Name',
        description: 'Update User setting by name',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'setting name',
        required: true,
        type: 'string',
    }),
    common_1.Put('/name/:name'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Param('name')),
    __param(1, common_1.Body()),
    __param(2, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_dto_1.UpdateDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], UserSettingsController.prototype, "updateRecordByName", null);
UserSettingsController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('User Settings'),
    common_1.Controller('/user/settings'),
    __metadata("design:paramtypes", [user_settings_service_1.UserSettingsService])
], UserSettingsController);
exports.UserSettingsController = UserSettingsController;
//# sourceMappingURL=user.settings.controller.js.map