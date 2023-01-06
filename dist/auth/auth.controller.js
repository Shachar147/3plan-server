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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_credentials_dto_1 = require("./dto/auth-credentials.dto");
const auth_service_1 = require("./auth.service");
const get_user_decorator_1 = require("./get-user.decorator");
const user_entity_1 = require("../user/user.entity");
const swagger_1 = require("@nestjs/swagger");
const config = require("config");
const jwtConfig = config.get('jwt');
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async signUp(authCredentialsDto) {
        return this.authService.signUp(authCredentialsDto);
    }
    async singIn(authCredentialsDto) {
        const { accessToken } = await this.authService.signIn(authCredentialsDto);
        return {
            accessToken,
            expiresIn: jwtConfig.expiresIn,
            expiresAt: Date.now() + jwtConfig.expiresIn * 1000,
        };
    }
    test(user) {
        console.log(user);
        return {
            loggedInUser: user,
        };
    }
};
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sign Up',
        description: 'Sign up. supply username & password to create a new user in the system.',
    }),
    swagger_1.ApiBody({
        description: 'User credentials: username & password',
        type: auth_credentials_dto_1.AuthCredentialsDto,
    }),
    common_1.Post('/signup'),
    __param(0, common_1.Body(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_credentials_dto_1.AuthCredentialsDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signUp", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Sign In',
        description: 'Sign in. supply username & password and get JWT token in return.',
    }),
    swagger_1.ApiOkResponse({
        description: 'Returns JWT token of this user',
    }),
    swagger_1.ApiUnauthorizedResponse({
        description: 'Indicates that the given credentials are incorrect.',
    }),
    swagger_1.ApiBadRequestResponse({
        description: 'Indicates that one (or more) of the given parameters was invalid.',
    }),
    swagger_1.ApiBody({
        description: 'User credentials: username & password',
        type: auth_credentials_dto_1.AuthCredentialsDto,
    }),
    common_1.Post('/signin'),
    __param(0, common_1.Body(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_credentials_dto_1.AuthCredentialsDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "singIn", null);
__decorate([
    swagger_1.ApiOperation({
        summary: 'Test',
        description: 'Test Token. supply JWT token and get matching username. useful for debug purposes.',
    }),
    swagger_1.ApiBearerAuth('JWT'),
    common_1.Post('/test'),
    common_1.UseGuards(passport_1.AuthGuard()),
    __param(0, get_user_decorator_1.GetUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "test", null);
AuthController = __decorate([
    swagger_1.ApiTags('Authentication'),
    common_1.Controller('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map