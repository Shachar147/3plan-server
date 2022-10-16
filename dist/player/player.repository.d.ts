import { Repository } from 'typeorm';
import { CreatePlayerDto } from './dto/create-player-dto';
import { ListPlayerDto } from './dto/list-player-dto';
import { Player } from './player.entity';
import { UpdatePlayerDto } from './dto/update-player-dto';
import { Team } from '../team/team.entity';
export declare class PlayerRepository extends Repository<Player> {
    private logger;
    createPlayer(createPlayerDto: CreatePlayerDto, team: Team, all_star_team: Team): Promise<Player>;
    _getPlayerByName(name: string): Promise<Player>;
    upsertPlayer(createPlayerDto: CreatePlayerDto, team: Team, all_star_team: Team): Promise<Player>;
    updatePlayer(updatePlayerDto: UpdatePlayerDto, player: Player, team: Team, all_star_team: Team): Promise<Player>;
    getPlayerByName(name: string): Promise<Player>;
    getPlayer(id: number): Promise<Player>;
    getPlayers(filterDto: ListPlayerDto): Promise<Player[]>;
    inActivePlayer(player: Player): Promise<Player>;
}
