import { CreateDto } from './dto/create-dto';
import { ListDto } from './dto/list-dto';
import { TournamentService } from './tournament.service';
import { UpdateDto } from './dto/update-dto';
import { User } from '../../user/user.entity';
export declare class TournamentController {
    private tournamentService;
    constructor(tournamentService: TournamentService);
    createRecord(createDtp: CreateDto, user: User): Promise<import("./tournament.entity").Tournament>;
    listRecords(listDto: ListDto, user: User): Promise<{
        total: number;
        data: import("./tournament.entity").Tournament[];
    }>;
    listStats(listDto: ListDto, user: User): Promise<{
        total: number;
        data: {};
        stats: any;
    }>;
    listStatsBySpecificTeam(listDto: ListDto, name: string, user: User): Promise<any>;
    getRecord(id: any, user: User): Promise<import("./tournament.entity").Tournament>;
    deleteRecord(id: any, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: any, updateDto: UpdateDto, user: User): Promise<import("./tournament.entity").Tournament>;
}
