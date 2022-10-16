import { Repository } from 'typeorm';
import { CreateRandomDto } from './dto/create-random-dto';
import { User } from '../../user/user.entity';
import { ListRandomDto } from './dto/list-random-dto';
import { Random } from './random.entity';
import { Player } from '../../player/player.entity';
import { Team } from '../../team/team.entity';
import { UpdateRandomDto } from './dto/update-random-dto';
export declare class RandomRepository extends Repository<Random> {
    private logger;
    createRecord(createRandomDto: CreateRandomDto, team1: Team, team2: Team, mvp_player: Player, user: User): Promise<Random>;
    updateRecord(record: Random, updateRandomDto: UpdateRandomDto, mvp_player: Player): Promise<Random>;
    listRecords(filterDto: ListRandomDto, user: User, team: Team, mvp_player: Player, loser: Team, winner: Team): Promise<Random[]>;
    listRecordsByDate(date: string, filterDto: ListRandomDto, user: User, team: Team, mvp_player: Player, loser: Team, winner: Team): Promise<any[]>;
}
