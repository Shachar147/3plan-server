import { Repository } from 'typeorm';
import { CreateStopwatchShootoutDto } from './dto/create-stopwatch-shootout-dto';
import { User } from '../../user/user.entity';
import { ListStopwatchShootoutDto } from './dto/list-stopwatch-shootout-dto';
import { StopwatchShootout } from './stopwatch-shootout.entity';
import { Player } from '../../player/player.entity';
import { UpdateStopwatchShootoutDto } from './dto/update-stopwatch-shootout-dto';
export declare class StopwatchShootoutRepository extends Repository<StopwatchShootout> {
    private logger;
    createRecord(createStopwatchShootoutDto: CreateStopwatchShootoutDto, player: Player, user: User): Promise<StopwatchShootout>;
    updateRecord(record: StopwatchShootout, updateStopwatchShootoutDto: UpdateStopwatchShootoutDto): Promise<StopwatchShootout>;
    listRecords(filterDto: ListStopwatchShootoutDto, user: User, player: Player): Promise<StopwatchShootout[]>;
}
