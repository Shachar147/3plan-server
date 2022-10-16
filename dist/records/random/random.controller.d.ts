import { CreateRandomDto } from './dto/create-random-dto';
import { User } from '../../user/user.entity';
import { ListRandomDto } from './dto/list-random-dto';
import { RandomService } from './random.service';
import { UpdateRandomDto } from './dto/update-random-dto';
export declare class RandomController {
    private randomService;
    constructor(randomService: RandomService);
    createRecord(createRandomDto: CreateRandomDto, user: User): Promise<{}>;
    listRecords(listRandomDto: ListRandomDto, user: User): Promise<{
        total: number;
        data: import("./random.entity").Random[];
    }>;
    listTodayRecords(listRandomDto: ListRandomDto, user: User): Promise<{
        total: number;
        data: any[];
    }>;
    listRecordsByDate(date: any, listRandomDto: ListRandomDto, user: User): Promise<{
        total: number;
        data: any[];
    }>;
    listRecordsByTeam(listRandomDto: ListRandomDto, user: User): Promise<{
        total: number;
        data: {};
    }>;
    listRecordsBySpecificTeam(listRandomDto: ListRandomDto, name: string, user: User): Promise<any>;
    deleteRecord(id: any, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: any, updateRandomDto: UpdateRandomDto, user: User): Promise<{}>;
}
