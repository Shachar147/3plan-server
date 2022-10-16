import { CreateThreePointsContestDto } from './dto/create-three-points-contest.dto';
import { User } from '../../user/user.entity';
import { ListThreePointsContestDto } from './dto/list-three-points-contest.dto';
import { ThreePointsContestService } from './three-points-contest.service';
export declare class ThreePointsContestController {
    private threePointsContestService;
    constructor(threePointsContestService: ThreePointsContestService);
    createRecord(createThreePointsContestDto: CreateThreePointsContestDto, user: User): Promise<{}>;
    listRecords(listThreePointsContestDto: ListThreePointsContestDto, user: User): Promise<{
        total: number;
        data: import("./three-points-contest.entity").ThreePointsContest[];
    }>;
    listRecordsByPlayer(listThreePointsContestDto: ListThreePointsContestDto, user: User): Promise<{
        total: number;
        data: {};
    }>;
    listRecordsBySpecificPlayer(listThreePointsContestDto: ListThreePointsContestDto, name: string, user: User): Promise<any>;
    listRecordsStats(listThreePointsContestDto: ListThreePointsContestDto, user: User): Promise<{
        total: number;
        data: {
            stats: {};
            max_stats: {
                days_with_most_games: string[];
                days_with_most_percents: string[];
            };
        };
    }>;
    deleteRecord(id: any, user: User): Promise<import("typeorm").DeleteResult>;
}
