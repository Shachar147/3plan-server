import { Repository } from 'typeorm';
import { CreateOneOnOneDto } from './dto/create-oneonone-dto';
import { User } from '../../user/user.entity';
import { ListOneOnOneDto } from './dto/list-oneonone-dto';
import { OneOnOne } from './one-on-one.entity';
import { Player } from '../../player/player.entity';
import { UpdateOneOnOneDto } from './dto/update-oneonone-dto';
export declare class OneOnOneRepository extends Repository<OneOnOne> {
    private logger;
    createRecord(createOneOnOneDto: CreateOneOnOneDto, player1: Player, player2: Player, user: User): Promise<OneOnOne>;
    updateRecord(record: OneOnOne, updateOneOnOneDto: UpdateOneOnOneDto): Promise<OneOnOne>;
    listRecords(filterDto: ListOneOnOneDto, user: User, player: Player, loser: Player, winner: Player): Promise<OneOnOne[]>;
}
