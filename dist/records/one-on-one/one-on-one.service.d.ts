import { ListOneOnOneDto } from './dto/list-oneonone-dto';
import { CreateOneOnOneDto } from './dto/create-oneonone-dto';
import { User } from '../../user/user.entity';
import { OneOnOneRepository } from './one-on-one.repository';
import { PlayerService } from '../../player/player.service';
import { UpdateOneOnOneDto } from './dto/update-oneonone-dto';
export declare class OneOnOneService {
    private oneOnOneRepository;
    private playerService;
    private logger;
    constructor(oneOnOneRepository: OneOnOneRepository, playerService: PlayerService);
    createRecord(createDto: CreateOneOnOneDto, user: User): Promise<{}>;
    deleteRecord(id: number, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: number, updateOneOnOneDto: UpdateOneOnOneDto, user: User): Promise<{}>;
    listRecords(filterDto: ListOneOnOneDto, user: User): Promise<import("./one-on-one.entity").OneOnOne[]>;
    listRecordsByPlayer(filterDto: ListOneOnOneDto, user: User): Promise<{}>;
}
