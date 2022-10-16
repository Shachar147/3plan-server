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
exports.StatMuseService = void 0;
const common_1 = require("@nestjs/common");
const utils_1 = require("../../shared/utils");
let StatMuseService = class StatMuseService {
    constructor(http) {
        this.http = http;
    }
    getKeys() {
        return {
            picture: '"imageUrl":"',
            GP: '"GP":{"display":"',
            WP: '"W%":{"display":"',
            MPG: '"MPG":{"display":"',
            PPG: '"PPG":{"display":"',
            RPG: '"RPG":{"display":"',
            APG: '"APG":{"display":"',
            SPG: '"SPG":{"display":"',
            BPG: '"BPG":{"display":"',
            TPG: '"TPG":{"display":"',
            FGM: '"FGM":{"display":"',
            FGA: '"FGA":{"display":"',
            FGP: '"FG%":{"display":"',
            FTM: '"FTM":{"display":"',
            FTA: '"FTA":{"display":"',
            FTP: '"FT%":{"display":"',
            _3PM: '"3PM":{"display":"',
            _3PA: '"3PA":{"display":"',
            _3PP: '"3P%":{"display":"',
            MIN: '"MIN":{"display":"',
            PTS: '"PTS":{"display":"',
            REB: '"REB":{"display":"',
            AST: '"AST":{"display":"',
            STL: '"STL":{"display":"',
            BLK: '"BLK":{"display":"',
            TOV: '"TOV":{"display":"',
            PF: '"PF":{"display":"',
            PM: '"+/-":{"display":"',
        };
    }
    async getPlayerRealStats(player_name) {
        const toReturn = {};
        const keys = this.getKeys();
        try {
            const response = await this.http
                .get('https://www.statmuse.com/nba/ask/' +
                player_name
                    .toLocaleLowerCase()
                    .replace(/\s/gi, '-')
                    .replace("'", '%27') +
                ' -win-percent-career')
                .toPromise();
            let page = unescape(response.data);
            page = page.replace(/\&quot\;/gi, '"').replace(/\&apos\;/gi, "'");
            const nameKey = 'href="https://www.statmuse.com/nba/player/';
            let n = 0;
            n = page.indexOf(nameKey, n);
            if (n !== -1) {
                n += nameKey.length;
                n = page.indexOf('>', n);
                n++;
                const name = utils_1.SubstringTo(page, n, '<');
                if (name.toLowerCase() == player_name.toLocaleLowerCase()) {
                    toReturn['name'] = name;
                    Object.keys(keys).forEach((key) => {
                        n = page.indexOf(keys[key]);
                        if (n !== -1) {
                            n += keys[key].length;
                            const value = utils_1.SubstringTo(page, n, '"');
                            if (key === 'WP') {
                                const number = Number(value);
                                toReturn[key] = (number * 100).toFixed(2);
                            }
                            else if (['_3PP', 'WP', 'FGP', 'FTP'].indexOf(key) != -1 &&
                                value === '') {
                                toReturn[key] = '0.0';
                            }
                            else {
                                toReturn[key] =
                                    key === 'picture'
                                        ? value
                                        : Number(value.replace(',', '')).toFixed(2);
                            }
                        }
                    });
                }
            }
        }
        catch (e) {
            console.log(e);
        }
        if (Number(toReturn['_3PM']) == 0 && Number(toReturn['_3PA']) == 0) {
            toReturn['_3PP'] = '0.00';
        }
        return toReturn;
    }
};
StatMuseService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [common_1.HttpService])
], StatMuseService);
exports.StatMuseService = StatMuseService;
//# sourceMappingURL=statmuse.service.js.map