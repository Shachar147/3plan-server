import { CreateOneOnOneDto } from './dto/create-oneonone-dto';
import { User } from '../../user/user.entity';
import { ListOneOnOneDto } from './dto/list-oneonone-dto';
import { OneOnOneService } from './one-on-one.service';
import { UpdateOneOnOneDto } from './dto/update-oneonone-dto';
export declare class OneOnOneController {
    private oneOnOneService;
    constructor(oneOnOneService: OneOnOneService);
    createRecord(createOneOnOneDto: CreateOneOnOneDto, user: User): Promise<{}>;
    listRecords(listOneOnOneDto: ListOneOnOneDto, user: User): Promise<{
        total: number;
        data: import("./one-on-one.entity").OneOnOne[];
    }>;
    listRecordsByPlayer(listOneOnOneDto: ListOneOnOneDto, user: User): Promise<{
        total: number;
        data: {};
    }>;
    listRecordsBySpecificPlayer(listOneOnOneDto: ListOneOnOneDto, name: string, user: User): Promise<any>;
    deleteRecord(id: any, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: any, updateOneOnOneDto: UpdateOneOnOneDto, user: User): Promise<{}>;
}
