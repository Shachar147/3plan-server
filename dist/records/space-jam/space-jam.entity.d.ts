import { BaseEntity } from 'typeorm';
import { User } from '../../user/user.entity';
export declare class SpaceJamOneOnOne extends BaseEntity {
    id: number;
    user: User;
    userId: number;
    player1: string;
    player2: string;
    score1: number;
    score2: number;
    addedAt: 'timestamp';
    is_comeback: boolean;
    total_overtimes: number;
}
