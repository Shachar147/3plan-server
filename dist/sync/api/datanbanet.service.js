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
exports.DatanbanetService = void 0;
const common_1 = require("@nestjs/common");
const player_entity_1 = require("../../player/player.entity");
let DatanbanetService = class DatanbanetService {
    constructor(http) {
        this.http = http;
    }
    async _getTeamsMapping() {
        const response = await this.http
            .get('http://data.nba.net/data/10s/prod/v1/' +
            this.getNBAYear() +
            '/teams.json')
            .toPromise();
        const teams = {};
        response.data.league.standard.forEach(function (iter) {
            const name = iter.fullName;
            const id = iter.teamId;
            if (name.indexOf('All-Star') === -1 && name.indexOf('Team ') === -1 && name.indexOf('Utah Blue') === -1 && name.indexOf('Utah White') === -1) {
                teams[id] = name;
            }
        });
        return teams;
    }
    async getTeams() {
        const response = await this.http
            .get('http://data.nba.net/data/10s/prod/v1/' +
            this.getNBAYear() +
            '/teams.json')
            .toPromise();
        const teams = [];
        response.data.league.standard.forEach(function (iter) {
            if (iter.fullName.toLowerCase().indexOf('team ') !== -1 ||
                iter.fullName.toLowerCase().indexOf('east') !== -1 ||
                iter.fullName.toLowerCase().indexOf('west') !== -1 ||
                iter.fullName.toLowerCase().indexOf('utah blue') !== -1 ||
                iter.fullName.toLowerCase().indexOf('utah white') !== -1 ||
                iter.fullName.toLowerCase().indexOf('allstar') !== -1) {
                return;
            }
            iter.abbreviation = iter.tricode;
            const team = {};
            team['logo'] =
                'https://www.nba.com/.element/img/1.0/teamsites/logos/teamlogos_500x500/' +
                    iter['abbreviation'].toLowerCase() +
                    '.png';
            team['name'] = iter.fullName;
            team['conference'] = iter.confName.toUpperCase();
            team['division'] = iter.divName.toUpperCase();
            if (team['name'].indexOf('All-Star') === -1) {
                teams.push(team);
            }
        });
        return { data: teams };
    }
    async getPlayers() {
        let players = [];
        const url = 'http://data.nba.net/data/10s/prod/v1/' +
            this.getNBAYear() +
            '/players.json';
        const response = await this.http.get(url).toPromise();
        if (response &&
            response.data &&
            response.data.league &&
            response.data.league.standard) {
            const p = await this._collectPlayers(response.data.league.standard);
            players = [].concat(players, p);
        }
        return players;
    }
    async _collectPlayers(data) {
        const players = [];
        const teams_hash = await this._getTeamsMapping();
        const allstar_hash = this.getAllStarPlayers();
        const skipped = 0;
        const positions = {};
        const self = this;
        data.forEach(function (iter) {
            var _a, _b, _c, _d, _e, _f;
            const isActive = iter.isActive;
            const name = iter.firstName + ' ' + iter.lastName;
            if (!isActive) {
            }
            const player = new player_entity_1.Player();
            player.name = name;
            if (iter.heightFeet !== '-')
                player.height_feet = iter.heightFeet;
            if (iter.heightInches !== '-')
                player.height_inches = iter.heightInches;
            player.picture =
                'https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/' +
                    iter.personId +
                    '.png';
            if (iter.pos !== '' && iter.pos !== '-') {
                player.position = iter.pos;
                positions[iter.pos] = positions[iter.pos] || 0;
                positions[iter.pos]++;
            }
            if (iter.weightPounds !== '-' && iter.weightPounds !== '')
                player.weight_pounds = iter.weightPounds;
            player.jersey = iter.jersey;
            player.debut_year =
                iter.nbaDebutYear == '' ? undefined : iter.nbaDebutYear;
            if (iter.weightKilograms !== '' && iter.weightKilograms !== '-')
                player.weight_kgs = iter.weightKilograms;
            if (iter.heightMeters !== '' && iter.heightMeters !== '-')
                player.height_meters = iter.heightMeters;
            player.isActive = iter.isActive;
            player.date_of_birth = iter.dateOfBirthUTC;
            player.college_name = iter.collegeName;
            player.country = iter.country;
            if (((_a = iter === null || iter === void 0 ? void 0 : iter.draft) === null || _a === void 0 ? void 0 : _a.roundNum) && ((_b = iter === null || iter === void 0 ? void 0 : iter.draft) === null || _b === void 0 ? void 0 : _b.roundNum) !== '')
                player.draft_round = (_c = iter === null || iter === void 0 ? void 0 : iter.draft) === null || _c === void 0 ? void 0 : _c.roundNum;
            if (((_d = iter === null || iter === void 0 ? void 0 : iter.draft) === null || _d === void 0 ? void 0 : _d.pickNum) && ((_e = iter === null || iter === void 0 ? void 0 : iter.draft) === null || _e === void 0 ? void 0 : _e.pickNum) !== '')
                player.draft_pick = (_f = iter === null || iter === void 0 ? void 0 : iter.draft) === null || _f === void 0 ? void 0 : _f.pickNum;
            player.team = teams_hash[iter.teamId];
            player.allStarTeam = allstar_hash[name];
            players.push(player);
        });
        return players;
    }
    getAllStarPlayers() {
        return {
            'LeBron James': 'Team LeBron',
            'Giannis Antetokounmpo': 'Team LeBron',
            'Stephen Curry': 'Team LeBron',
            'Luka Doncic': 'Team LeBron',
            'Nikola Jokic': 'Team LeBron',
            'Jaylen Brown': 'Team LeBron',
            'Paul George': 'Team LeBron',
            'Rudy Gobert': 'Team LeBron',
            'Damian Lillard': 'Team LeBron',
            'Domantas Sabonis': 'Team LeBron',
            'Chris Paul': 'Team LeBron',
            'Ben Simmons': 'Team LeBron',
            'Kevin Durant': 'Team Durant',
            'Bradley Beal': 'Team Durant',
            'Kyrie Irving': 'Team Durant',
            'Kawhi Leonard': 'Team Durant',
            'Jayson Tatum': 'Team Durant',
            'Zion Williamson': 'Team Durant',
            'Mike Conley': 'Team Durant',
            'James Harden': 'Team Durant',
            'Zach LaVine': 'Team Durant',
            'Donovan Mitchell': 'Team Durant',
            'Julius Randle': 'Team Durant',
            'Nikola Vucevic': 'Team Durant',
            'Devin Booker': 'Team Durant',
            'Anthony Davis': 'Team Durant',
            'Joel Embiid': 'Team Durant',
        };
    }
    getNBAYear() {
        const year = new Date().getFullYear();
        const month = new Date().getMonth();
        return this._getNBAYear(year, month);
    }
    _getNBAYear(year, month) {
        if (month >= 8) {
            return year;
        }
        else {
            return year - 1;
        }
    }
    async getRealGamesSchedule() {
        const year = this.getNBAYear();
        const url = 'http://data.nba.com/data/10s/v2015/json/mobile_teams/nba/' +
            year +
            '/league/00_full_schedule.json';
        const response = await this.http.get(url).toPromise();
        if (response &&
            response.data &&
            response.data.lscd &&
            response.data.lscd.length > 0) {
            const results = response.data.lscd;
            const calendar = {};
            results.forEach((monthObj) => {
                monthObj = monthObj['mscd'];
                const games = monthObj['g'];
                games.forEach((game) => {
                    let date = game['gdtutc'];
                    let time = game['utctm'];
                    const game_id = game['gid'];
                    const home_team = game['h']['tc'] + ' ' + game['h']['tn'];
                    const visitor_team = game['v']['tc'] + ' ' + game['v']['tn'];
                    const home_score = game['h']['s'];
                    const visitor_score = game['v']['s'];
                    if (time !== 'TBD') {
                        const dt = new Date(date + ' ' + time);
                        const tz = 3;
                        dt.setHours(dt.getHours() + tz);
                        const parts = dt.toLocaleDateString().split('/');
                        if (parts.length === 3) {
                            if (parts[0].length === 1)
                                parts[0] = '0' + parts[0];
                            if (parts[1].length === 1)
                                parts[1] = '0' + parts[1];
                        }
                        date =
                            parts.length === 3
                                ? parts[2] + '-' + parts[0] + '-' + parts[1]
                                : parts[0];
                        time = dt.toLocaleTimeString();
                    }
                    calendar[date] = calendar[date] || [];
                    calendar[date].push({
                        home_team,
                        visitor_team,
                        home_score,
                        visitor_score,
                        date,
                        time,
                        game_id,
                    });
                });
            });
            return calendar;
        }
        return {};
    }
    async getTodayGames(date) {
        const calendar = await this.getRealGamesSchedule();
        if (date == 'today-games') {
            const dt = new Date();
            const parts = dt.toLocaleDateString().split('/');
            if (parts.length === 3) {
                if (parts[0].length === 1)
                    parts[0] = '0' + parts[0];
                if (parts[1].length === 1)
                    parts[1] = '0' + parts[1];
            }
            date =
                parts.length === 3
                    ? parts[2] + '-' + parts[0] + '-' + parts[1]
                    : parts[0];
        }
        const games = calendar[date] || [];
        for (let i = 0; i < games.length; i++) {
            let game = calendar[date][i];
            const dtObj = new Date(game.date);
            dtObj.setDate(dtObj.getDate() - 1);
            const temp = dtObj.toLocaleDateString().split('/');
            if (temp.length === 3) {
                if (temp[0].length === 1)
                    temp[0] = '0' + temp[0];
                if (temp[1].length === 1)
                    temp[1] = '0' + temp[1];
            }
            const newDate = temp.length === 3 ? temp[2] + '-' + temp[0] + '-' + temp[1] : temp[0];
            game = await this.addGameStats(game, newDate, 1);
        }
        return calendar[date] || [];
    }
    async addGameStats(game, date, tryAgain) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const dt = date.replace(/\-/gi, '');
        const game_id = game.game_id;
        const url = `http://data.nba.net/data/10s/prod/v1/${dt}/${game_id}_boxscore.json`;
        try {
            const response = await this.http.get(url).toPromise();
            if (response && response.data && response.data.stats) {
                const stats = response.data.stats;
                game.stats = stats;
                let mvp;
                let mvp_points;
                if (Number(game.home_score) && Number(game.visitor_score)) {
                    if (Number(game.home_score) > Number(game.visitor_score)) {
                        game.winner = game.home_team;
                        mvp = (_c = (_b = (_a = stats === null || stats === void 0 ? void 0 : stats.hTeam) === null || _a === void 0 ? void 0 : _a.leaders) === null || _b === void 0 ? void 0 : _b.points) === null || _c === void 0 ? void 0 : _c.players;
                        mvp_points = (_f = (_e = (_d = stats === null || stats === void 0 ? void 0 : stats.hTeam) === null || _d === void 0 ? void 0 : _d.leaders) === null || _e === void 0 ? void 0 : _e.points) === null || _f === void 0 ? void 0 : _f.value;
                    }
                    else {
                        game.winner = game.visitor_team;
                        mvp = (_j = (_h = (_g = stats === null || stats === void 0 ? void 0 : stats.vTeam) === null || _g === void 0 ? void 0 : _g.leaders) === null || _h === void 0 ? void 0 : _h.points) === null || _j === void 0 ? void 0 : _j.players;
                        mvp_points = (_m = (_l = (_k = stats === null || stats === void 0 ? void 0 : stats.vTeam) === null || _k === void 0 ? void 0 : _k.leaders) === null || _l === void 0 ? void 0 : _l.points) === null || _m === void 0 ? void 0 : _m.value;
                    }
                }
                if (mvp) {
                    mvp = mvp.map((iter) => {
                        return iter.firstName + ' ' + iter.lastName;
                    });
                    mvp = mvp = mvp.join(', ');
                    game.mvp_player = mvp;
                    game.mvp_player_points = mvp_points;
                }
            }
        }
        catch (e) {
            console.error('error', tryAgain);
            if (tryAgain) {
                game = await this.addGameStats(game, game.date, 0);
            }
        }
        return game;
    }
    async getTodayGamesLive(originalDate) {
        const teams_names = {
            ATL: 'Atlanta Hawks',
            BOS: 'Boston Celtics',
            BKN: 'Brooklyn Nets',
            CHA: 'Charlotte Hornets',
            CHI: 'Chicago Bulls',
            CLE: 'Cleveland Cavaliers',
            DAL: 'Dallas Mavericks',
            DEN: 'Denver Nuggets',
            DET: 'Detroit Pistons',
            GSW: 'Golden State Warriors',
            HOU: 'Houston Rockets',
            IND: 'Indiana Pacers',
            LAC: 'LA Clippers',
            LAL: 'Los Angeles Lakers',
            MEM: 'Memphis Grizzlies',
            MIA: 'Miami Heat',
            MIL: 'Milwaukee Bucks',
            MIN: 'Minnesota Timberwolves',
            NOP: 'New Orleans Pelicans',
            NYK: 'New York Knicks',
            OKC: 'Oklahoma City Thunder',
            ORL: 'Orlando Magic',
            PHI: 'Philadelphia 76ers',
            PHX: 'Phoenix Suns',
            POR: 'Portland Trail Blazers',
            SAC: 'Sacramento Kings',
            SAS: 'San Antonio Spurs',
            TOR: 'Toronto Raptors',
            UTA: 'Utah Jazz',
            WAS: 'Washington Wizards',
        };
        let date = originalDate;
        if (date === 'today-games') {
            const dt = new Date();
            const parts = dt.toLocaleDateString().split('/');
            if (parts.length === 3) {
                if (parts[0].length === 1)
                    parts[0] = '0' + parts[0];
                if (parts[1].length === 1)
                    parts[1] = '0' + parts[1];
            }
            date =
                parts.length === 3
                    ? parts[2] + parts[0] + parts[1]
                    : parts[0].replace(/\-/gi, '');
        }
        else {
            date = date.replace(/\-/gi, '');
        }
        const url = 'http://data.nba.net/prod/v1/' + date + '/scoreboard.json';
        const response = await this.http.get(url).toPromise();
        const calendar = {};
        if (response &&
            response.data &&
            response.data.games &&
            response.data.games.length > 0) {
            const results = response.data.games;
            results.forEach((game) => {
                let date = game['startTimeUTC'].split('T')[0];
                let time = game['startTimeUTC'].split('T')[1].split('.')[0];
                const home_team = teams_names[game['hTeam']['triCode']];
                const visitor_team = teams_names[game['vTeam']['triCode']];
                const home_score = game['hTeam']['score'];
                const visitor_score = game['vTeam']['score'];
                if (time !== 'TBD') {
                    const dt = new Date(date + ' ' + time);
                    const tz = 3;
                    dt.setHours(dt.getHours() + tz);
                    const parts = dt.toLocaleDateString().split('/');
                    if (parts.length === 3) {
                        if (parts[0].length === 1)
                            parts[0] = '0' + parts[0];
                        if (parts[1].length === 1)
                            parts[1] = '0' + parts[1];
                    }
                    date =
                        parts.length === 3
                            ? parts[2] + '-' + parts[0] + '-' + parts[1]
                            : parts[0];
                    time = dt.toLocaleTimeString();
                }
                calendar[originalDate] = calendar[originalDate] || [];
                calendar[originalDate].push({
                    home_team,
                    visitor_team,
                    home_score,
                    visitor_score,
                    date,
                    time,
                });
            });
        }
        return calendar[originalDate] || [];
    }
};
DatanbanetService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [common_1.HttpService])
], DatanbanetService);
exports.DatanbanetService = DatanbanetService;
//# sourceMappingURL=datanbanet.service.js.map