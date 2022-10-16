import { ListStopwatchShootoutDto } from './dto/list-stopwatch-shootout-dto';
import { CreateStopwatchShootoutDto } from './dto/create-stopwatch-shootout-dto';
import { User } from '../../user/user.entity';
import { StopwatchShootoutRepository } from './stopwatch-shootout.repository';
import { PlayerService } from '../../player/player.service';
import { UpdateStopwatchShootoutDto } from './dto/update-stopwatch-shootout-dto';
export declare class StopwatchShootoutService {
    private stopwatchRepository;
    private playerService;
    private logger;
    constructor(stopwatchRepository: StopwatchShootoutRepository, playerService: PlayerService);
    createRecord(createDto: CreateStopwatchShootoutDto, user: User): Promise<{}>;
    deleteRecord(id: number, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: number, updateStopwatchShootoutDto: UpdateStopwatchShootoutDto, user: User): Promise<{}>;
    listRecords(filterDto: ListStopwatchShootoutDto, user: User): Promise<import("./stopwatch-shootout.entity").StopwatchShootout[]>;
    listRecordsByPlayer(filterDto: ListStopwatchShootoutDto, user: User): Promise<{}>;
}
