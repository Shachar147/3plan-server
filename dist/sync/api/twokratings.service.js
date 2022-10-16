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
exports.TwoKRatingsService = void 0;
const common_1 = require("@nestjs/common");
const utils_1 = require("../../shared/utils");
let TwoKRatingsService = class TwoKRatingsService {
    constructor(http) {
        this.http = http;
    }
    async getTeamPlayers2KRatings(team) {
        let error = '';
        const ratings = {};
        if (team === 'LA Clippers') {
            team = 'los-angeles-clippers';
        }
        else {
            team = team.toLowerCase().replace(/\s/g, '-');
        }
        try {
            const url = 'https://www.2kratings.com/teams/' + team;
            const response = await this.http.get(url).toPromise();
            const nameKey = '<span class="entry-font"><a href="https://www.2kratings.com/';
            const nameKey2 = 'title="';
            const attributeKey = ' attribute-box ';
            const teamKey = ' attribute-box-team ';
            const page = response.data;
            let n = 0;
            while (n !== -1) {
                n = page.indexOf(nameKey, n);
                if (n === -1) {
                    break;
                }
                n += nameKey.length;
                n = page.indexOf(nameKey2, n);
                if (n === -1) {
                    break;
                }
                n += nameKey2.length;
                let name = utils_1.SubstringTo(page, n, '"');
                name = name.replace('&#8217;', "'");
                n = page.indexOf(attributeKey, n);
                if (n === -1) {
                    break;
                }
                n += attributeKey.length;
                n = page.indexOf('>', n);
                n++;
                const rating = utils_1.SubstringTo(page, n, '<');
                ratings[name] = rating;
                const nameVariations = {
                    'Juan Toscano': 'Juan Toscano-Anderson',
                    'Juan Hernangomez': 'Juancho Hernangomez',
                    'D’Angelo Russell': "D'Angelo Russell",
                    'Marcus Morris Sr': 'Marcus Morris Sr.',
                    'Sviatoslav Mykhailiuk': 'Svi Mykhailiuk',
                    'Wesley Iwundu': 'Wes Iwundu',
                    'Bruce Brown Jr.': 'Bruce Brown',
                    'Robert Williams': 'Robert Williams III',
                    'Robert Williams III': 'Robert Williams',
                    'Danuel House': 'Danuel House Jr.',
                    'De’Andre Hunter': "De'Andre Hunter",
                    'Cameron Reddish': 'Cam Reddish',
                    'Frank Kaminsky III': 'Frank Kaminsky',
                    'E’Twaun Moore': "E'Twaun Moore",
                    'De’Anthony Melton': "De'Anthony Melton",
                    'Kevin Porter Jr.': 'Kevin Porter',
                    'Mohamed Bamba': 'Mo Bamba',
                    'James Ennis': 'James Ennis III',
                    'C.J. McCollum': 'CJ McCollum',
                    'C.J. Elleby': 'CJ Elleby',
                    'DeAndre’ Bembry': "DeAndre' Bembry",
                    'Royce O’Neale': "Royce O'Neale",
                    'Devonte’ Graham': "Devonte' Graham",
                    'Terry Rozier III': 'Terry Rozier',
                    'De’Aaron Fox': "De'Aaron Fox",
                    'R.J. Barrett': 'RJ Barrett',
                    'P.J. Dozier': 'PJ Dozier',
                };
                if (nameVariations[name]) {
                    ratings[nameVariations[name]] = rating;
                }
            }
            n = page.indexOf(teamKey);
            if (n !== -1) {
                n += teamKey.length;
                n = page.indexOf(teamKey, n);
                if (n !== -1) {
                    const teamRating = utils_1.GetInBetween(page, n, '>', '<', 1);
                    ratings['OVERALL'] = teamRating;
                }
            }
        }
        catch (err) {
            error = err;
            throw new common_1.InternalServerErrorException(error);
        }
        return ratings;
    }
};
TwoKRatingsService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [common_1.HttpService])
], TwoKRatingsService);
exports.TwoKRatingsService = TwoKRatingsService;
//# sourceMappingURL=twokratings.service.js.map