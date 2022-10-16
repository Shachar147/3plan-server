import { ListDto } from './dto/list-dto';
import { CreateDto } from './dto/create-dto';
import { User } from '../user/user.entity';
import { UserSettingsRepository } from './user.settings.repository';
import { UpdateDto } from './dto/update-dto';
export declare class UserSettingsService {
    private repository;
    private logger;
    constructor(repository: UserSettingsRepository);
    createRecord(createDto: CreateDto, user: User): Promise<import("./user.settings.entity").UserSettings>;
    deleteRecord(id: number, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecordByName(name: string, updateDto: UpdateDto, user: User): Promise<import("./user.settings.entity").UserSettings>;
    updateRecord(id: number, updateDto: UpdateDto, user: User): Promise<import("./user.settings.entity").UserSettings>;
    listRecords(filterDto: ListDto, user: User): Promise<import("./user.settings.entity").UserSettings[]>;
    getRecord(id: number, user: User): Promise<import("./user.settings.entity").UserSettings>;
    getInActive(user: User): Promise<void>;
}
