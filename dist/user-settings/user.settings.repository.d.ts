import { Repository } from 'typeorm';
import { CreateDto } from './dto/create-dto';
import { User } from '../user/user.entity';
import { ListDto } from './dto/list-dto';
import { UserSettings } from './user.settings.entity';
import { UpdateDto } from './dto/update-dto';
export declare class UserSettingsRepository extends Repository<UserSettings> {
    private logger;
    createDefaultSettings(user: User): Promise<void>;
    createRecord(createDto: CreateDto, user: User): Promise<UserSettings>;
    updateRecord(record: UserSettings, updateDto: UpdateDto): Promise<UserSettings>;
    listRecords(filterDto: ListDto, user: User): Promise<UserSettings[]>;
    getInActive(user: User): Promise<void>;
}
