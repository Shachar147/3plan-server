import { SpaceJamService } from './space-jam.service';
import { CreateRecordDto } from './dto/create-record-dto';
import { ListRecordsDto } from './dto/list-records-dto';
import { User } from '../../user/user.entity';
import { UpdateRecordDto } from './dto/update-record-dto';
export declare class SpaceJamController {
    private spaceJamService;
    constructor(spaceJamService: SpaceJamService);
    createRecord(createRecordDto: CreateRecordDto, user: User): Promise<{}>;
    listRecords(listDto: ListRecordsDto, user: User): Promise<{
        total: number;
        data: import("./space-jam.entity").SpaceJamOneOnOne[];
    }>;
    listRecordsByPlayer(listDto: ListRecordsDto, user: User): Promise<{
        total: number;
        data: {};
    }>;
    listRecordsBySpecificPlayer(listDto: ListRecordsDto, name: string, user: User): Promise<any>;
    deleteRecord(id: any, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: any, updateDto: UpdateRecordDto, user: User): Promise<{}>;
}
