import { HttpService } from '@nestjs/common';
import { Player } from '../../player/player.entity';
export declare class DatanbanetService {
    private readonly http;
    constructor(http: HttpService);
    _getTeamsMapping(): Promise<{}>;
    getTeams(): Promise<{
        data: any[];
    }>;
    getPlayers(): Promise<any[]>;
    _collectPlayers(data: any): Promise<Player[]>;
    getAllStarPlayers(): {
        'LeBron James': string;
        'Giannis Antetokounmpo': string;
        'Stephen Curry': string;
        'Luka Doncic': string;
        'Nikola Jokic': string;
        'Jaylen Brown': string;
        'Paul George': string;
        'Rudy Gobert': string;
        'Damian Lillard': string;
        'Domantas Sabonis': string;
        'Chris Paul': string;
        'Ben Simmons': string;
        'Kevin Durant': string;
        'Bradley Beal': string;
        'Kyrie Irving': string;
        'Kawhi Leonard': string;
        'Jayson Tatum': string;
        'Zion Williamson': string;
        'Mike Conley': string;
        'James Harden': string;
        'Zach LaVine': string;
        'Donovan Mitchell': string;
        'Julius Randle': string;
        'Nikola Vucevic': string;
        'Devin Booker': string;
        'Anthony Davis': string;
        'Joel Embiid': string;
    };
    getNBAYear(): any;
    _getNBAYear(year: any, month: any): any;
    getRealGamesSchedule(): Promise<{}>;
    getTodayGames(date: any): Promise<any>;
    addGameStats(game: any, date: any, tryAgain: any): Promise<any>;
    getTodayGamesLive(originalDate: any): Promise<any>;
}
