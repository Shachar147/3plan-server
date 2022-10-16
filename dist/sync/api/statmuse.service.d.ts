import { HttpService } from '@nestjs/common';
export declare class StatMuseService {
    private readonly http;
    constructor(http: HttpService);
    getKeys(): {
        picture: string;
        GP: string;
        WP: string;
        MPG: string;
        PPG: string;
        RPG: string;
        APG: string;
        SPG: string;
        BPG: string;
        TPG: string;
        FGM: string;
        FGA: string;
        FGP: string;
        FTM: string;
        FTA: string;
        FTP: string;
        _3PM: string;
        _3PA: string;
        _3PP: string;
        MIN: string;
        PTS: string;
        REB: string;
        AST: string;
        STL: string;
        BLK: string;
        TOV: string;
        PF: string;
        PM: string;
    };
    getPlayerRealStats(player_name: string): Promise<{}>;
}
