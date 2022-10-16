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
exports.ListThreePointsContestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ListThreePointsContestDto {
}
__decorate([
    swagger_1.ApiProperty({
        type: String,
        required: false,
    }),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], ListThreePointsContestDto.prototype, "player", void 0);
__decorate([
    swagger_1.ApiProperty({
        type: [String],
        required: false,
    }),
    class_validator_1.IsArray(),
    class_validator_1.IsOptional(),
    __metadata("design:type", Array)
], ListThreePointsContestDto.prototype, "players", void 0);
__decorate([
    swagger_1.ApiProperty({
        type: Number,
        required: false,
    }),
    class_validator_1.IsOptional(),
    __metadata("design:type", Number)
], ListThreePointsContestDto.prototype, "roundLength", void 0);
__decorate([
    swagger_1.ApiProperty({
        type: String,
        required: false,
    }),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], ListThreePointsContestDto.prototype, "computerLevel", void 0);
__decorate([
    swagger_1.ApiProperty({
        type: String,
        required: false,
    }),
    class_validator_1.IsArray(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], ListThreePointsContestDto.prototype, "computer_players", void 0);
__decorate([
    swagger_1.ApiProperty({
        type: String,
        required: false,
    }),
    class_validator_1.IsArray(),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], ListThreePointsContestDto.prototype, "random_players", void 0);
__decorate([
    swagger_1.ApiProperty({
        type: String,
        required: false,
    }),
    class_validator_1.IsOptional(),
    __metadata("design:type", String)
], ListThreePointsContestDto.prototype, "winner_name", void 0);
exports.ListThreePointsContestDto = ListThreePointsContestDto;
//# sourceMappingURL=list-three-points-contest.dto.js.map