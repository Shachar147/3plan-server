import { ListThreePointsContestDto } from './dto/list-three-points-contest.dto';
import { CreateThreePointsContestDto } from './dto/create-three-points-contest.dto';
import { User } from '../../user/user.entity';
import { ThreePointsContestRepository } from './three-points-contest.repository';
import { PlayerService } from '../../player/player.service';
export declare class ThreePointsContestService {
    private threePointsContestRepository;
    private playerService;
    private logger;
    constructor(threePointsContestRepository: ThreePointsContestRepository, playerService: PlayerService);
    createRecord(createDto: CreateThreePointsContestDto, user: User): Promise<{}>;
    deleteRecord(id: number, user: User): Promise<import("typeorm").DeleteResult>;
    listRecords(filterDto: ListThreePointsContestDto, user: User): Promise<import("./three-points-contest.entity").ThreePointsContest[]>;
    listRecordsByPlayer(filterDto: ListThreePointsContestDto, user: User): Promise<{}>;
    listRecordsStats(filterDto: ListThreePointsContestDto, user: User): Promise<{
        stats: {};
        max_stats: {
            days_with_most_games: string[];
            days_with_most_percents: string[];
        };
    }>;
}
