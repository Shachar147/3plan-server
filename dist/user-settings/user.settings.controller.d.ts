import { CreateDto } from './dto/create-dto';
import { ListDto } from './dto/list-dto';
import { UserSettingsService } from './user.settings.service';
import { UpdateDto } from './dto/update-dto';
import { User } from '../user/user.entity';
export declare class UserSettingsController {
    private service;
    constructor(service: UserSettingsService);
    createRecord(createDtp: CreateDto, user: User): Promise<import("./user.settings.entity").UserSettings>;
    listRecords(listDto: ListDto, user: User): Promise<{
        total: number;
        data: import("./user.settings.entity").UserSettings[];
    }>;
    getRecord(id: any, user: User): Promise<import("./user.settings.entity").UserSettings>;
    deleteRecord(id: any, user: User): Promise<import("typeorm").DeleteResult>;
    updateRecord(id: any, updateDto: UpdateDto, user: User): Promise<import("./user.settings.entity").UserSettings>;
    updateRecordByName(name: any, updateDto: UpdateDto, user: User): Promise<import("./user.settings.entity").UserSettings>;
}
