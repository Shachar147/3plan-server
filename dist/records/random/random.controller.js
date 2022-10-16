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
exports.RandomController = void 0;
const common_1 = require("@nestjs/common");
const create_random_dto_1 = require("./dto/create-random-dto");
const user_entity_1 = require("../../user/user.entity");
const list_random_dto_1 = require("./dto/list-random-dto");
const passport_1 = require("@nestjs/passport");
const random_service_1 = require("./random.service");
const get_user_decorator_1 = require("../../auth/get-user.decorator");
const update_random_dto_1 = require("./dto/update-random-dto");
const utils_1 = require("../../shared/utils");
const swagger_1 = require("@nestjs/swagger");
let RandomController = class RandomController {
    constructor(randomService) {
        this.randomService = randomService;
    }
    createRecord(createRandomDto, user) {
        return this.randomService.createRecord(createRandomDto, user);
    }
    async listRecords(listRandomDto, user) {
        const records = await this.randomService.listRecords(listRandomDto, user);
        return {
            total: records.length,
            data: records,
        };
    }
    async listTodayRecords(listRandomDto, user) {
        const date = utils_1.formatDate(new Date()).split('/').reverse().join('-');
        const records = await this.randomService.listRecordsByDate(date, listRandomDto, user);
        return {
            total: Object.keys(records).length,
            data: records,
        };
    }
    async listRecordsByDate(date, listRandomDto, user) {
        const records = await this.randomService.listRecordsByDate(date, listRandomDto, user);
        return {
            total: Object.keys(records).length,
            data: records,
        };
    }
    async listRecordsByTeam(listRandomDto, user) {
        const records = await this.randomService.listRecordsByTeam(listRandomDto, user);
        return {
            total: Object.keys(records).length,
            data: records,
        };
    }
    async listRecordsBySpecificTeam(listRandomDto, name, user) {
        const records = await this.randomService.listRecordsByTeam(listRandomDto, user);
        return records[name] || {};
    }
    deleteRecord(id, user) {
        return this.randomService.deleteRecord(id, user);
    }
    updateRecord(id, updateRandomDto, user) {
        return this.randomService.updateRecord(id, updateRandomDto, user);
    }
};
__decorate([
    swagger_1.ApiOperation({
        summary: 'Create Record',
        description: 'create Random Games record.',
    }),
    common_1.Post(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Body()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_random_dto_1.CreateRandomDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], RandomController.prototype, "createRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'List Records',
        description: 'get all Random Games records.',
    }),
    common_1.Get(),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_random_dto_1.ListRandomDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], RandomController.prototype, "listRecords", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Today Played Games',
        description: 'get today played random games.',
    }),
    common_1.Get('/date/today'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_random_dto_1.ListRandomDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], RandomController.prototype, "listTodayRecords", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Played Games per Date',
        description: 'get played games for the given date',
    }),
    swagger_1.ApiParam({
        name: 'date',
        description: 'the date you want to get records for',
        required: true,
        type: 'string',
    }),
    common_1.Get('/date/:date'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Param('date')),
    __param(1, common_1.Query()),
    __param(2, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_random_dto_1.ListRandomDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], RandomController.prototype, "listRecordsByDate", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Records by Team',
        description: 'get all played games grouped by team',
    }),
    common_1.Get('/by-team'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_random_dto_1.ListRandomDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], RandomController.prototype, "listRecordsByTeam", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Get Team Records',
        description: 'get all played games for specific team',
    }),
    swagger_1.ApiParam({
        name: 'name',
        description: 'team name',
        required: true,
        type: 'string',
    }),
    common_1.Get('/by-team/:name'),
    common_1.UseGuards(passport_1.AuthGuard()),
    common_1.UsePipes(new common_1.ValidationPipe({ transform: true })),
    __param(0, common_1.Query()),
    __param(1, common_1.Param('name')),
    __param(2, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_random_dto_1.ListRandomDto, String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], RandomController.prototype, "listRecordsBySpecificTeam", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Delete Record',
        description: 'delete random games record by id',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'record id',
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
], RandomController.prototype, "deleteRecord", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Update Record',
        description: 'updates random games record by id',
    }),
    swagger_1.ApiParam({
        name: 'id',
        description: 'record id',
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
    __metadata("design:paramtypes", [Object, update_random_dto_1.UpdateRandomDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], RandomController.prototype, "updateRecord", null);
RandomController = __decorate([
    swagger_1.ApiBearerAuth('JWT'),
    swagger_1.ApiTags('Records - Random Games'),
    common_1.Controller('records/random'),
    __metadata("design:paramtypes", [random_service_1.RandomService])
], RandomController);
exports.RandomController = RandomController;
//# sourceMappingURL=random.controller.js.map