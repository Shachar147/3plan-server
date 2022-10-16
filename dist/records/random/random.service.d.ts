import { ListRandomDto } from './dto/list-random-dto';
import { CreateRandomDto } from './dto/create-random-dto';
import { User } from '../../user/user.entity';
import { RandomRepository } from './random.repository';
import { PlayerService } from '../../player/player.service';
import { UpdateRandomDto } from './dto/update-random-dto';
import { TeamService } from '../../team/team.service';
export declare class RandomService {
    private randomRepository;
    private teamService;
    private playerService;
    private logger;
    constructor(randomRepository: RandomRepository, teamService: TeamService, playerService: PlayerService);
    createRecord(createDto: CreateRandomDto, user: User): Promise<{}>;
    deleteRecord(id: number, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: number, updateRandomDto: UpdateRandomDto, user: User): Promise<{}>;
    listRecords(filterDto: ListRandomDto, user: User): Promise<import("./random.entity").Random[]>;
    listRecordsByTeam(filterDto: ListRandomDto, user: User): Promise<{}>;
    listRecordsByDate(date: string, filterDto: ListRandomDto, user: User): Promise<any[]>;
}
