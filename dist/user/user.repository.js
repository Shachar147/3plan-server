"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const class_validator_1 = require("class-validator");
let UserRepository = class UserRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('UserRepository');
    }
    async signUp(authCredentialsDto) {
        const { username, password } = authCredentialsDto;
        const User = await this.getUserByName(username);
        if (class_validator_1.isDefined(User)) {
            throw new common_1.ConflictException('Username already exists');
        }
        const user = this.create();
        user.username = username;
        user.salt = await bcrypt.genSalt();
        user.password = await this.hashPassword(password, user.salt);
        try {
            await user.save();
        }
        catch (error) {
            if (Number(error.code) === 23505) {
                throw new common_1.ConflictException('Username already exists');
            }
            else {
                throw new common_1.InternalServerErrorException();
            }
        }
    }
    async getUserByName(username) {
        return await this.createQueryBuilder()
            .where('LOWER(username) = LOWER(:username)', { username })
            .getOne();
    }
    async validateUserPassword(authCredentialsDto) {
        const { username, password } = authCredentialsDto;
        const user = await this.getUserByName(username);
        if (user && (await user.validatePassword(password))) {
            return user.username;
        }
        else {
            return null;
        }
    }
    async hashPassword(password, salt) {
        return bcrypt.hash(password, salt);
    }
    async getUsers(filterDto) {
        const { name, search, names, } = filterDto;
        const query = this.createQueryBuilder('user');
        if (search)
            query.where('(user.name LIKE :search)', { search: `%${search}%` });
        if (name)
            query.andWhere('user.name = :name', { name });
        if (names && names.split(',').length > 0) {
            const options = [];
            const values = {};
            names.split(',').forEach((name, idx) => {
                const key = 'name' + idx;
                options.push('(user.name = :' + key + ')');
                values[key] = name;
            });
            query.andWhere('(' + options.join(' OR ') + ')', values);
        }
        try {
            const users = await query.getMany();
            return users;
        }
        catch (error) {
            this.logger.error(`Failed to get users . Filters: ${JSON.stringify(filterDto)}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
};
UserRepository = __decorate([
    typeorm_1.EntityRepository(user_entity_1.User)
], UserRepository);
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map