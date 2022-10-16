import { CreateStopwatchShootoutDto } from './dto/create-stopwatch-shootout-dto';
import { User } from '../../user/user.entity';
import { ListStopwatchShootoutDto } from './dto/list-stopwatch-shootout-dto';
import { StopwatchShootoutService } from './stopwatch-shootout.service';
import { UpdateStopwatchShootoutDto } from './dto/update-stopwatch-shootout-dto';
export declare class StopwatchShootoutController {
    private oneOnOneService;
    constructor(oneOnOneService: StopwatchShootoutService);
    createRecord(createStopwatchShootoutDto: CreateStopwatchShootoutDto, user: User): Promise<{}>;
    listRecords(listStopwatchShootoutDto: ListStopwatchShootoutDto, user: User): Promise<{
        total: number;
        data: import("./stopwatch-shootout.entity").StopwatchShootout[];
    }>;
    listRecordsByPlayer(listStopwatchShootoutDto: ListStopwatchShootoutDto, user: User): Promise<{
        total: number;
        data: {};
    }>;
    listRecordsBySpecificPlayer(listStopwatchShootoutDto: ListStopwatchShootoutDto, name: string, user: User): Promise<any>;
    deleteRecord(id: any, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: any, updateStopwatchShootoutDto: UpdateStopwatchShootoutDto, user: User): Promise<{}>;
}
