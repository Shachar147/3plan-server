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
exports.ESPNService = void 0;
const common_1 = require("@nestjs/common");
const utils_1 = require("../../shared/utils");
let ESPNService = class ESPNService {
    constructor(http) {
        this.http = http;
    }
    async getInjuredPlayers() {
        const url = `https://www.espn.com/nba/injuries`;
        const rows = [];
        try {
            const response = await this.http.get(url).toPromise();
            if (response && response.data) {
                const page = response.data;
                const rowKey = '<tr class="Table__TR Table__TR--sm';
                let n = 0;
                while (n !== -1) {
                    n = page.indexOf(rowKey, n);
                    if (n !== -1) {
                        const row = utils_1.SubstringTo(page, n, '</tr>');
                        const player = this._collectInjuredPlayerdetails(row);
                        if (Object.keys(player).length > 0) {
                            rows.push(player);
                        }
                        n += rowKey.length;
                    }
                }
            }
        }
        catch (e) { }
        return rows;
    }
    reformatDate(date) {
        const parts = date.split(' ');
        const monthName = parts[0];
        const day = parts[1];
        const year = new Date().getFullYear();
        const month = 'JanFebMarAprMayJunJulAugSepOctNovDec'.indexOf(monthName) / 3 + 1;
        return day + '/' + month + '/' + year;
    }
    _collectInjuredPlayerdetails(page) {
        const nameKey = '<a class="AnchorLink"';
        const dateKey = 'col-date Table__TD">';
        const statKey = 'col-stat Table__TD">';
        const detailsKey = 'col-desc Table__TD">';
        let n = page.indexOf(nameKey);
        const player = {};
        if (n != -1) {
            let name = utils_1.GetInBetween(page, n, '>', '<', 1);
            name = name.replace('e&#x27;', "'");
            name = name.replace("D'Andre Hunter", "De'Andre Hunter");
            name = name.replace("D'Anthony Melton", "De'Anthony Melton");
            player['name'] = name;
            player['lastUpdate'] = this.reformatDate(utils_1.GetInBetween(page, n, dateKey, '<', 1));
            player['details'] = utils_1.GetInBetween(page, n, detailsKey, '<', 1);
            n = page.indexOf(statKey);
            if (n != -1) {
                n += statKey.length;
                player['status'] = utils_1.GetInBetween(page, n, '">', '<', 1);
            }
        }
        return player;
    }
};
ESPNService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [common_1.HttpService])
], ESPNService);
exports.ESPNService = ESPNService;
//# sourceMappingURL=espn.service.js.map