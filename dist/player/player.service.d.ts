import { ListPlayerDto } from './dto/list-player-dto';
import { PlayerRepository } from './player.repository';
import { CreatePlayerDto } from './dto/create-player-dto';
import { UpdatePlayerDto } from './dto/update-player-dto';
import { SyncService } from '../sync/sync.service';
import { TeamService } from '../team/team.service';
export declare class PlayerService {
    private playerRepository;
    private syncService;
    private teamService;
    private logger;
    constructor(playerRepository: PlayerRepository, syncService: SyncService, teamService: TeamService);
    getPlayers(filterDto: ListPlayerDto): Promise<import("./player.entity").Player[]>;
    get3PointShooters(filterDto: ListPlayerDto): Promise<import("./player.entity").Player[]>;
    getPopularPlayers(filterDto: ListPlayerDto): Promise<import("./player.entity").Player[]>;
    getPlayer(id: number): Promise<import("./player.entity").Player>;
    getPlayerByNameFull(name: string): Promise<import("./player.entity").Player>;
    getPlayerByName(name: string): Promise<import("./player.entity").Player>;
    createPlayer(createPlayerDto: CreatePlayerDto): Promise<import("./player.entity").Player>;
    deletePlayer(id: number): Promise<import("typeorm").DeleteResult>;
    updatePlayer(id: number, updatePlayerDto: UpdatePlayerDto): Promise<import("./player.entity").Player>;
    upsertPlayer(createPlayerDto: CreatePlayerDto): Promise<import("./player.entity").Player>;
    syncPlayers(filterDto: ListPlayerDto): Promise<{
        total: number;
        total_errors: number;
        errors: any[];
    }>;
    syncPlayerByName(filterDto: ListPlayerDto, name: string): Promise<import("./player.entity").Player>;
    syncPlayersByTeam(filterDto: ListPlayerDto, name: string): Promise<import("../team/team.entity").Team>;
    _getPlayerPosition(player: any): Promise<any>;
    syncPlayer(filterDto: ListPlayerDto, id: number): Promise<import("./player.entity").Player>;
    inActivePlayer(name: string): Promise<import("./player.entity").Player>;
}
