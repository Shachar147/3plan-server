import { PlayerDetailsService } from './player-details.service';
import { ListPlayerDetailsDto } from './dto/list-player-details-dto';
import { CreatePlayerDetailsDto } from './dto/create-player-details-dto';
export declare class PlayerDetailsController {
    private playerDetailsService;
    constructor(playerDetailsService: PlayerDetailsService);
    getPlayers(filterDto: ListPlayerDetailsDto): Promise<{
        total: number;
        data: import("./player-details.entity").PlayerDetails[];
    }>;
    createPlayer(createPlayerDetailsDto: CreatePlayerDetailsDto): Promise<import("./player-details.entity").PlayerDetails>;
    syncPlayerById(id: any, filterDto: ListPlayerDetailsDto): Promise<import("./player-details.entity").PlayerDetails>;
    syncPlayer(name: any, filterDto: ListPlayerDetailsDto): Promise<import("./player-details.entity").PlayerDetails>;
    syncPopularPlayers(filterDto: ListPlayerDetailsDto): Promise<import("./player-details.entity").PlayerDetails[]>;
    syncAllPlayers(filterDto: ListPlayerDetailsDto): Promise<{
        total: number;
        total_errors: number;
        errors: any[];
    }>;
    syncAllPlayersBulk(filterDto: ListPlayerDetailsDto, start: any): Promise<{
        total: number;
        total_errors: number;
        errors: any[];
    }>;
}
