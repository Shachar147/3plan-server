import { Repository } from 'typeorm';
import { User } from '../../user/user.entity';
import { SpaceJamOneOnOne } from './space-jam.entity';
import { CreateRecordDto } from './dto/create-record-dto';
import { ListRecordsDto } from './dto/list-records-dto';
import { UpdateRecordDto } from "./dto/update-record-dto";
export declare class SpaceJamRepository extends Repository<SpaceJamOneOnOne> {
    private logger;
    createRecord(createOneOnOneDto: CreateRecordDto, player1: any, player2: any, user: User): Promise<SpaceJamOneOnOne>;
    updateRecord(record: SpaceJamOneOnOne, updateDto: UpdateRecordDto): Promise<SpaceJamOneOnOne>;
    listRecords(filterDto: ListRecordsDto, user: User, player: string, loser: string, winner: string): Promise<SpaceJamOneOnOne[]>;
}
