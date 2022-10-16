"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettingsRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const user_settings_entity_1 = require("./user.settings.entity");
const class_validator_1 = require("class-validator");
const const_1 = require("../shared/const");
let UserSettingsRepository = class UserSettingsRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('UserSettingsRepository');
    }
    async createDefaultSettings(user) {
        const rows = const_1.DEFAULT_USER_SETTINGS;
        for (let i = 0; i < rows.length; i++) {
            try {
                await this.createRecord(rows[i], user);
            }
            catch (_a) {
            }
        }
    }
    async createRecord(createDto, user) {
        const { name, value } = createDto;
        const record = this.create();
        record.name = name;
        record.value = value;
        record.user = user;
        try {
            await record.save();
        }
        catch (error) {
            if (Number(error.code) === 23505) {
                throw new common_1.ConflictException('Record already exists');
            }
            else {
                throw new common_1.InternalServerErrorException();
            }
        }
        delete record.user;
        return record;
    }
    async updateRecord(record, updateDto) {
        const { name, value } = updateDto;
        if (class_validator_1.isDefined(name))
            record.name = name;
        if (class_validator_1.isDefined(value))
            record.value = value;
        try {
            await record.save();
        }
        catch (error) {
            throw new common_1.InternalServerErrorException();
        }
        return record;
    }
    async listRecords(filterDto, user) {
        const { name, value } = filterDto;
        const query = this.createQueryBuilder('user_settings');
        if (name)
            query.andWhere('(user_settings.name = :name)', { name });
        if (value)
            query.andWhere('(user_settings.value = :value)', { value });
        query.andWhere('(user_settings.userId = :userId)', { userId: user.id });
        query.orderBy('user_settings.id', 'ASC');
        try {
            const records = await query.getMany();
            return records;
        }
        catch (error) {
            this.logger.error(`Failed to get records . Filters: ${JSON.stringify(filterDto)}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
    async getInActive(user) {
        const name = 'SHOW_INACTIVE_PLAYERS';
        const query = this.createQueryBuilder('user_settings');
        if (name)
            query.where('(user_settings.name = :name)', { name });
        query.andWhere('(user_settings.userId = :userId)', { userId: user.id });
        const result = await query.getMany();
        console.log('here', result);
    }
};
UserSettingsRepository = __decorate([
    typeorm_1.EntityRepository(user_settings_entity_1.UserSettings)
], UserSettingsRepository);
exports.UserSettingsRepository = UserSettingsRepository;
//# sourceMappingURL=user.settings.repository.js.map