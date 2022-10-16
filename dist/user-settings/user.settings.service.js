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
exports.UserSettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_settings_repository_1 = require("./user.settings.repository");
const class_validator_1 = require("class-validator");
let UserSettingsService = class UserSettingsService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new common_1.Logger('UserSettingsService');
    }
    async createRecord(createDto, user) {
        const { name, value } = createDto;
        if (!name) {
            throw new common_1.BadRequestException('name : missing');
        }
        if (!value) {
            throw new common_1.BadRequestException('value : missing');
        }
        return await this.repository.createRecord(createDto, user);
    }
    async deleteRecord(id, user) {
        const result = await this.repository.delete({
            id: id,
            userId: user.id,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        return result;
    }
    async updateRecordByName(name, updateDto, user) {
        const record = await this.repository.findOne({
            name: name,
            userId: user.id,
        });
        if (record) {
            const id = record.id;
            return await this.updateRecord(id, updateDto, user);
        }
    }
    async updateRecord(id, updateDto, user) {
        const record = await this.repository.findOne({
            id: id,
            userId: user.id,
        });
        if (!record) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        if (!class_validator_1.isDefined(updateDto.name) && !class_validator_1.isDefined(updateDto.value)) {
            throw new common_1.NotFoundException(`You have to pass fields to update`);
        }
        return await this.repository.updateRecord(record, updateDto);
    }
    async listRecords(filterDto, user) {
        await this.repository.createDefaultSettings(user);
        const records = await this.repository.listRecords(filterDto, user);
        return records;
    }
    async getRecord(id, user) {
        await this.repository.createDefaultSettings(user);
        const result = await this.repository.findOne({
            id: id,
            userId: user.id,
        });
        if (!result) {
            throw new common_1.NotFoundException(`Record with id #${id} not found`);
        }
        return result;
    }
    async getInActive(user) {
        return await this.repository.getInActive(user);
    }
};
UserSettingsService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(user_settings_repository_1.UserSettingsRepository)),
    __metadata("design:paramtypes", [user_settings_repository_1.UserSettingsRepository])
], UserSettingsService);
exports.UserSettingsService = UserSettingsService;
//# sourceMappingURL=user.settings.service.js.map