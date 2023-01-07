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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTripDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateTripDto {
}
__decorate([
    swagger_1.ApiProperty({ required: true }),
    class_validator_1.IsOptional(),
    class_validator_1.IsNotEmpty({
        message: 'missing: name',
    }),
    class_validator_1.IsString(),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "name", void 0);
__decorate([
    swagger_1.ApiProperty({ required: true }),
    class_validator_1.IsOptional(),
    class_validator_1.IsNotEmpty({
        message: 'missing: dateRange',
    }),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "dateRange", void 0);
__decorate([
    swagger_1.ApiProperty({ required: true }),
    class_validator_1.IsOptional(),
    class_validator_1.IsNotEmpty({
        message: 'missing: categories',
    }),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "categories", void 0);
__decorate([
    swagger_1.ApiProperty({ required: true }),
    class_validator_1.IsOptional(),
    class_validator_1.IsNotEmpty({
        message: 'missing: allEvents',
    }),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "allEvents", void 0);
__decorate([
    swagger_1.ApiProperty({ required: true }),
    class_validator_1.IsOptional(),
    class_validator_1.IsNotEmpty({
        message: 'missing: calendarEvents',
    }),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "calendarEvents", void 0);
__decorate([
    swagger_1.ApiProperty({ required: true }),
    class_validator_1.IsOptional(),
    class_validator_1.IsNotEmpty({
        message: 'missing: sidebarEvents',
    }),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "sidebarEvents", void 0);
__decorate([
    swagger_1.ApiProperty({ required: true }),
    class_validator_1.IsOptional(),
    class_validator_1.IsNotEmpty({
        message: 'missing: calendarLocale',
    }),
    class_validator_1.IsString(),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "calendarLocale", void 0);
exports.UpdateTripDto = UpdateTripDto;
//# sourceMappingURL=update-trip-dto.js.map