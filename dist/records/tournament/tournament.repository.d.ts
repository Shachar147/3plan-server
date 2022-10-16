import { Repository } from 'typeorm';
import { CreateDto } from './dto/create-dto';
import { User } from '../../user/user.entity';
import { ListDto } from './dto/list-dto';
import { Tournament } from './tournament.entity';
import { UpdateDto } from './dto/update-dto';
import { Team } from '../../team/team.entity';
import { Player } from '../../player/player.entity';
import { TournamentGame } from './tournament.game.type';
export declare class TournamentRepository extends Repository<Tournament> {
    private logger;
    createRecord(createDto: CreateDto, winner: Team, teams: Team[], mvpPlayer: Player, gamesHistory: TournamentGame[], user: User): Promise<Tournament>;
    updateRecord(record: Tournament, updateDto: UpdateDto, winnerPlayer: Team): Promise<Tournament>;
    listRecords(filterDto: ListDto, user: User): Promise<Tournament[]>;
}
