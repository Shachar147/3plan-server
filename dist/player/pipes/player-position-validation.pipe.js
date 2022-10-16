"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerPositionValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const player_position_enum_1 = require("../player-position.enum");
class PlayerPositionValidationPipe {
    constructor() {
        this.logger = new common_1.Logger('PlayerPositionValidationPipe');
        this.allowedValues = Object.values(player_position_enum_1.PlayerPosition);
    }
    transform(value, metadata) {
        if (value) {
            if (!this.isValid(value)) {
                this.logger.error(`Invalid Position Value: ${value}"`);
                throw new common_1.BadRequestException({
                    statusCode: 400,
                    message: 'position: invalid value',
                    data: {
                        given_value: value,
                        allowed_values: this.allowedValues.join(' / '),
                    },
                    error: 'Bad Request',
                });
            }
        }
        return value;
    }
    isValid(value) {
        const idx = this.allowedValues.indexOf(value);
        return idx !== -1;
    }
}
exports.PlayerPositionValidationPipe = PlayerPositionValidationPipe;
//# sourceMappingURL=player-position-validation.pipe.js.map