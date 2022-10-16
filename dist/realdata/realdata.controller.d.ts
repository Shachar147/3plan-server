import { RealdataService } from './realdata.service';
export declare class RealdataController {
    private readonly realdataService;
    constructor(realdataService: RealdataService);
    getInjuredPlayers(): Promise<{
        total: number;
        data: any[];
    }>;
    getTodaysGames(date: any): Promise<any>;
}
