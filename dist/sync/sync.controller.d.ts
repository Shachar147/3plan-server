import { SyncService } from './sync.service';
export declare class SyncController {
    private syncService;
    constructor(syncService: SyncService);
    getTeams(): Promise<import("../team/team.entity").Team[]>;
    getPlayers(): Promise<any[]>;
    getTeamPlayersRatings(team_name: any): Promise<{}>;
    getAllTeamsPlayersRatings(): Promise<{}>;
    getPopularPlayersRealStats(): Promise<{}>;
    getPlayerRealStats(player_name: any): Promise<{}>;
}
