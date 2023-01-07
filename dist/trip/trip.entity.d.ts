import { BaseEntity } from 'typeorm';
import { User } from "../user/user.entity";
export declare class Trip extends BaseEntity {
    id: number;
    user: User;
    name: string;
    dateRange: 'jsonb';
    categories: 'jsonb';
    allEvents: 'jsonb';
    calendarEvents: 'jsonb';
    sidebarEvents: 'jsonb';
    calendarLocale: string;
    lastUpdateAt: Date;
    createdAt: Date;
}
