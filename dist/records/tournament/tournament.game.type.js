"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTournamentType = void 0;
const class_validator_1 = require("class-validator");
function validateTournamentType(obj) {
    const INVALID = 'invalid';
    const MISSING = 'missing';
    let what = '';
    let col = '';
    if (!(obj.hasOwnProperty('player1') && typeof obj.player1 === 'string')) {
        col = 'player1';
        what = !obj.hasOwnProperty(col) ? MISSING : INVALID;
    }
    else if (!(obj.hasOwnProperty('player2') && typeof obj.player2 === 'string')) {
        col = 'player2';
        what = !obj.hasOwnProperty(col) ? MISSING : INVALID;
    }
    else if (!(obj.hasOwnProperty('score1') && typeof obj.score1 === 'number')) {
        col = 'score1';
        what = !obj.hasOwnProperty(col) ? MISSING : INVALID;
    }
    else if (!(obj.hasOwnProperty('score2') && typeof obj.score2 === 'number')) {
        col = 'score2';
        what = !obj.hasOwnProperty(col) ? MISSING : INVALID;
    }
    else if (!(obj.hasOwnProperty('total_overtimes') &&
        typeof obj.total_overtimes === 'number')) {
        col = 'total_overtimes';
        what = !obj.hasOwnProperty(col) ? MISSING : INVALID;
    }
    else if (!(obj.hasOwnProperty('is_comeback') &&
        (class_validator_1.isBoolean(obj.is_comeback) ||
            obj.is_comeback == 0 ||
            obj.is_comeback == 1))) {
        col = 'is_comeback';
        what = !obj.hasOwnProperty(col) ? MISSING : INVALID;
    }
    else if (!(obj.hasOwnProperty('winner') && typeof obj.winner === 'string')) {
        col = 'winner';
        what = !obj.hasOwnProperty(col) ? MISSING : INVALID;
    }
    if (what !== '' && col !== '') {
        return `${col}: ${what}`;
    }
    return '';
}
exports.validateTournamentType = validateTournamentType;
//# sourceMappingURL=tournament.game.type.js.map