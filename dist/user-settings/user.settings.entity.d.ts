import { BaseEntity } from 'typeorm';
import { User } from '../user/user.entity';
export declare class UserSettings extends BaseEntity {
    id: number;
    user: User;
    userId: number;
    name: string;
    value: string;
}
