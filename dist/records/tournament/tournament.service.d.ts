import { ListDto } from './dto/list-dto';
import { CreateDto } from './dto/create-dto';
import { User } from '../../user/user.entity';
import { TournamentRepository } from './tournament.repository';
import { UpdateDto } from './dto/update-dto';
import { TeamService } from '../../team/team.service';
import { PlayerService } from '../../player/player.service';
export declare class TournamentService {
    private tournamentRepository;
    teamService: TeamService;
    private playerService;
    private logger;
    constructor(tournamentRepository: TournamentRepository, teamService: TeamService, playerService: PlayerService);
    createRecord(createDto: CreateDto, user: User): Promise<import("./tournament.entity").Tournament>;
    deleteRecord(id: number, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: number, updateDto: UpdateDto, user: User): Promise<import("./tournament.entity").Tournament>;
    listRecords(filterDto: ListDto, user: User): Promise<import("./tournament.entity").Tournament[]>;
    getRecord(id: number, user: User): Promise<import("./tournament.entity").Tournament>;
    listStats(filterDto: ListDto, user: User): Promise<{}>;
}
