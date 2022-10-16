import { Repository } from 'typeorm';
import { CreateThreePointsContestDto } from './dto/create-three-points-contest.dto';
import { User } from '../../user/user.entity';
import { ListThreePointsContestDto } from './dto/list-three-points-contest.dto';
import { ThreePointsContest } from './three-points-contest.entity';
import { Player } from '../../player/player.entity';
export declare class ThreePointsContestRepository extends Repository<ThreePointsContest> {
    private logger;
    createRecord(createThreePointsContestDto: CreateThreePointsContestDto, team1: Player[], team2: Player[], computers: Player[], randoms: Player[], winner: Player, user: User): Promise<ThreePointsContest>;
    listRecords(filterDto: ListThreePointsContestDto, user: User, playerObj: Player, winnerObj: Player, computersObj: Player[], randomsObj: Player[]): Promise<ThreePointsContest[]>;
}
