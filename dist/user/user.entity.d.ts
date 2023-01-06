import { BaseEntity } from 'typeorm';
import { Trip } from "../trip/trip.entity";
export declare class User extends BaseEntity {
    id: number;
    username: string;
    password: string;
    salt: string;
    trips: Trip[];
    validatePassword(password: string): Promise<boolean>;
}
