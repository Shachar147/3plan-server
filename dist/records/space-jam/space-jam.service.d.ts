import { User } from '../../user/user.entity';
import { SpaceJamRepository } from './space-jam.repository';
import { CreateRecordDto } from './dto/create-record-dto';
import { SpaceJamPlayerService } from '../../space-jam-player/space-jam-player.service';
import { ListRecordsDto } from './dto/list-records-dto';
import { UpdateRecordDto } from './dto/update-record-dto';
export declare class SpaceJamService {
    private spaceJamRepository;
    private playerService;
    private logger;
    constructor(spaceJamRepository: SpaceJamRepository, playerService: SpaceJamPlayerService);
    createRecord(createDto: CreateRecordDto, user: User): Promise<{}>;
    deleteRecord(id: number, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: number, updateDto: UpdateRecordDto, user: User): Promise<{}>;
    listRecords(filterDto: ListRecordsDto, user: User): Promise<import("./space-jam.entity").SpaceJamOneOnOne[]>;
    listRecordsByPlayer(filterDto: ListRecordsDto, user: User): Promise<{}>;
}
