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
exports.BasketballreferenceService = void 0;
const common_1 = require("@nestjs/common");
let BasketballreferenceService = class BasketballreferenceService {
    constructor(http) {
        this.http = http;
    }
    async get3PointShooters() {
        const players = [];
        const url = 'https://www.basketball-reference.com/leaders/fg3_pct_active.html';
        const response = await this.http.get(url).toPromise();
        const str = response.data;
        const key = '<td><strong><a href="/players/';
        const perKey = '</strong></td><td>';
        let n = 0;
        while (str.indexOf(key, n) !== -1) {
            n = str.indexOf(key, n);
            n += key.length;
            n = str.indexOf('>', n);
            n++;
            let name = '';
            while (str[n] != '<') {
                name += str[n];
                n++;
            }
            let per = 'N/A';
            let m = n;
            m = str.indexOf(perKey, m);
            if (m != -1) {
                m += perKey.length;
                per = '';
                while (str[m] != '<') {
                    per += str[m];
                    m++;
                }
                const fixed = parseFloat(per) * 100;
                per = fixed.toFixed(2) + '%';
            }
            players.push({ name: name, percents: per });
        }
        return players;
    }
};
BasketballreferenceService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [common_1.HttpService])
], BasketballreferenceService);
exports.BasketballreferenceService = BasketballreferenceService;
//# sourceMappingURL=basketballreference.service.js.map