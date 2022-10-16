import { PlayerService } from './player.service';
import { ListPlayerDto } from './dto/list-player-dto';
import { Player } from './player.entity';
import { CreatePlayerDto } from './dto/create-player-dto';
import { DeleteResult } from 'typeorm';
import { UpdatePlayerDto } from './dto/update-player-dto';
import { PlayerPosition } from './player-position.enum';
export declare class PlayerController {
    private playerService;
    constructor(playerService: PlayerService);
    getPlayers(filterDto: ListPlayerDto): Promise<{
        total: number;
        data: Player[];
    }>;
    get3PointShooters(filterDto: ListPlayerDto): Promise<Player[]>;
    getPopularPlayers(filterDto: ListPlayerDto): Promise<{
        total: number;
        data: Player[];
    }>;
    getPlayer(id: any): Promise<Player>;
    createPlayer(createPlayerDto: CreatePlayerDto, position: PlayerPosition): Promise<Player>;
    upsertPlayer(createPlayerDto: CreatePlayerDto, position: PlayerPosition): Promise<Player>;
    syncPlayers(filterDto: ListPlayerDto): Promise<{
        total: number;
        total_errors: number;
        errors: any[];
    }>;
    syncPlayer(id: any, filterDto: ListPlayerDto): Promise<Player>;
    syncPlayerByName(name: any, filterDto: ListPlayerDto): Promise<Player>;
    syncPlayersByTeam(name: any, filterDto: ListPlayerDto): Promise<import("../team/team.entity").Team>;
    updatePlayer(id: any, updatePlayerDto: UpdatePlayerDto, position: PlayerPosition): Promise<Player>;
    deletePlayer(id: any): Promise<DeleteResult>;
}
