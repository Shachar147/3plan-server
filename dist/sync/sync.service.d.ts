import { Team } from '../team/team.entity';
import { DatanbanetService } from './api/datanbanet.service';
import { BasketballreferenceService } from './api/basketballreference.service';
import { TwoKRatingsService } from './api/twokratings.service';
import { StatMuseService } from './api/statmuse.service';
export declare class SyncService {
    private NbaAPI;
    private BasketballReferenceAPI;
    private _2KRatingsAPI;
    private statMuseAPI;
    constructor(NbaAPI: DatanbanetService, BasketballReferenceAPI: BasketballreferenceService, _2KRatingsAPI: TwoKRatingsService, statMuseAPI: StatMuseService);
    getTeams(): Promise<Team[]>;
    getAllStarTeams(): Promise<any[]>;
    get3PointShooters(): Promise<any[]>;
    getPlayers(): Promise<any[]>;
    getTeamPlayersRatings(team_name: any): Promise<{}>;
    getAllTeamsPlayersRatings(): Promise<{}>;
    getPlayerRealStats(player_name: any): Promise<{}>;
    getPopularPlayersRealStats(): Promise<{}>;
}
