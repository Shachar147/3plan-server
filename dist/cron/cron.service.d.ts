import { TeamService } from '../team/team.service';
import { PlayerService } from '../player/player.service';
import { PlayerDetailsService } from '../player-details/player-details.service';
export declare class CronService {
    private teamService;
    private playerService;
    private playerDetailsService;
    private logger;
    constructor(teamService: TeamService, playerService: PlayerService, playerDetailsService: PlayerDetailsService);
    autSyncTeams(): Promise<void>;
    autSyncPlayers(): Promise<void>;
    autSyncPlayersDetails(): Promise<void>;
    autSyncPlayersRatings(): Promise<void>;
}
