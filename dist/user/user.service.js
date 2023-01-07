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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_repository_1 = require("./user.repository");
let UserService = class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.logger = new common_1.Logger('PlayerService');
    }
    async getUsers(filterDto) {
        const users = await this.userRepository.getUsers(filterDto);
        users.forEach((user) => {
            delete user.salt;
            delete user.password;
        });
        return users;
    }
    async deleteUser(id) {
        if (id == 1) {
            throw new common_1.NotFoundException(`You cannot delete a superadmin`);
        }
        const result = await this.userRepository.delete({ id: id });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`User with id #${id} not found`);
        }
        return result;
    }
    async deleteUserByName(name) {
        const user = await this.userRepository.getUserByName(name);
        return this.deleteUser(user.id);
    }
    async deleteUsersByIds(ids) {
        let affected = 0;
        const errors = [];
        const promises = ids.map((id) => this.deleteUser(id));
        const results = await Promise.allSettled(promises);
        results.forEach((result, index) => {
            if (result.status !== 200) {
                errors.push({
                    id: ids[index],
                    state: result.status,
                    message: result.reason.message
                });
            }
            else {
                affected += 1;
            }
        });
        return {
            affected,
            errors,
            raw: undefined
        };
    }
};
UserService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(user_repository_1.UserRepository)),
    __metadata("design:paramtypes", [user_repository_1.UserRepository])
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map