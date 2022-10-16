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
exports.UpdateTeamDto = void 0;
const class_validator_1 = require("class-validator");
const team_division_enum_1 = require("../team-division.enum");
const team_conference_enum_1 = require("../team-conference.enum");
const swagger_1 = require("@nestjs/swagger");
class UpdateTeamDto {
}
__decorate([
    swagger_1.ApiProperty({ required: false }),
    class_validator_1.IsOptional(),
    class_validator_1.IsString(),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "name", void 0);
__decorate([
    swagger_1.ApiProperty({ required: false }),
    class_validator_1.IsOptional(),
    class_validator_1.IsString(),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "logo", void 0);
__decorate([
    swagger_1.ApiProperty({ required: false }),
    class_validator_1.IsOptional(),
    class_validator_1.IsEnum(team_division_enum_1.TeamDivision, {
        message: 'division must be one of: ' + Object.values(team_division_enum_1.TeamDivision),
    }),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "division", void 0);
__decorate([
    swagger_1.ApiProperty({ required: false }),
    class_validator_1.IsOptional(),
    class_validator_1.IsEnum(team_conference_enum_1.TeamConference, {
        message: 'conference must be one of: ' + Object.values(team_conference_enum_1.TeamConference),
    }),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "conference", void 0);
__decorate([
    swagger_1.ApiProperty({ required: false }),
    class_validator_1.IsOptional(),
    __metadata("design:type", Number)
], UpdateTeamDto.prototype, "_2k_rating", void 0);
exports.UpdateTeamDto = UpdateTeamDto;
//# sourceMappingURL=update-team-dto.js.map