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
exports.BallDontLieService = void 0;
const common_1 = require("@nestjs/common");
const fetch = require("node-fetch");
const player_entity_1 = require("../../player/player.entity");
let BallDontLieService = class BallDontLieService {
    constructor(http) {
        this.http = http;
    }
    async getTeams() {
        const response = await this.http
            .get('https://www.balldontlie.io/api/v1/teams')
            .toPromise();
        response.data.data.forEach(function (iter) {
            if (iter.full_name.toLowerCase().indexOf('team ') !== -1 ||
                iter.full_name.toLowerCase().indexOf('east') !== -1 ||
                iter.full_name.toLowerCase().indexOf('west') !== -1 ||
                iter.full_name.toLowerCase().indexOf('allstar') !== -1) {
                return;
            }
            iter.logo =
                'https://www.nba.com/.element/img/1.0/teamsites/logos/teamlogos_500x500/' +
                    iter['abbreviation'].toLowerCase() +
                    '.png';
            iter.name = iter.full_name;
            iter.conference = iter.conference.toUpperCase();
            iter.division = iter.division.toUpperCase();
            delete iter.id;
        });
        return response.data;
    }
    async getPlayers() {
        let players = [];
        let p = 1;
        const basic_url = 'https://www.balldontlie.io/api/v1/players?per_page=100&page=';
        const response = await this.http.get(basic_url + p).toPromise();
        if (response && response.data && response.data.data) {
            const p = this._collectPlayers(response.data);
            players = [].concat(players, p);
        }
        let total_pages = 1;
        if (response && response.data && response.data.meta) {
            total_pages = response.data.meta.total_pages;
        }
        const urls = [];
        p++;
        while (p <= total_pages) {
            urls.push(basic_url + p);
            p++;
        }
        await Promise.all(urls.map((u) => fetch(u)))
            .then((responses) => Promise.all(responses.map((res) => res.text())))
            .then((texts) => {
            for (const idx in texts) {
                const iter = texts[idx];
                const json = JSON.parse(iter);
                const p = this._collectPlayers(json);
                players = [].concat(players, p);
            }
        })
            .finally(() => {
        });
        return players;
    }
    _collectPlayers(response) {
        const players = [];
        response.data.forEach(function (iter) {
            const player = new player_entity_1.Player();
            player.name = iter.first_name + ' ' + iter.last_name;
            player.height_feet = iter.height_feet;
            player.height_inches = iter.height_inches;
            player.picture =
                'https://nba-players.herokuapp.com/players/' +
                    iter.last_name +
                    '/' +
                    iter.first_name;
            player.position = iter.position;
            player.weight_pounds = iter.weight_pounds;
            player.team = iter.team.full_name;
            players.push(player);
        });
        return players;
    }
};
BallDontLieService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [common_1.HttpService])
], BallDontLieService);
exports.BallDontLieService = BallDontLieService;
//# sourceMappingURL=balldontlie.service.js.map