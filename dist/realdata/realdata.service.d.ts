import { DatanbanetService } from '../sync/api/datanbanet.service';
import { ESPNService } from '../sync/api/espn.service';
import { PlayerService } from '../player/player.service';
export declare class RealdataService {
    private NbaAPI;
    private espnService;
    private playerService;
    constructor(NbaAPI: DatanbanetService, espnService: ESPNService, playerService: PlayerService);
    getTodayGames(date: any): Promise<any>;
    getInjuredPlayers(): Promise<any[]>;
}
