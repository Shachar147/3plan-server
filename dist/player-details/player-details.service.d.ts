import { SyncService } from '../sync/sync.service';
import { ListPlayerDetailsDto } from './dto/list-player-details-dto';
import { PlayerDetailsRepository } from './player-details.repository';
import { PlayerService } from '../player/player.service';
import { CreatePlayerDetailsDto } from './dto/create-player-details-dto';
export declare class PlayerDetailsService {
    private playerDetailsRepository;
    private playerService;
    private syncService;
    private logger;
    constructor(playerDetailsRepository: PlayerDetailsRepository, playerService: PlayerService, syncService: SyncService);
    getPlayersDetails(filterDto: ListPlayerDetailsDto): Promise<import("./player-details.entity").PlayerDetails[]>;
    createPlayerDetails(createPlayerDto: CreatePlayerDetailsDto): Promise<import("./player-details.entity").PlayerDetails>;
    syncPlayerById(filterDto: ListPlayerDetailsDto, id: number): Promise<import("./player-details.entity").PlayerDetails>;
    syncPlayer(filterDto: ListPlayerDetailsDto, player_name: string): Promise<import("./player-details.entity").PlayerDetails>;
    syncPopularPlayers(filterDto: ListPlayerDetailsDto): Promise<import("./player-details.entity").PlayerDetails[]>;
    syncAllPlayers(filterDto: ListPlayerDetailsDto): Promise<{
        total: number;
        total_errors: number;
        errors: any[];
    }>;
    syncAllPlayersBulk(filterDto: ListPlayerDetailsDto, start: number): Promise<{
        total: number;
        total_errors: number;
        errors: any[];
    }>;
}
