import { BaseEntity } from 'typeorm';
import { User } from '../../user/user.entity';
import { Player } from '../../player/player.entity';
export declare class OneOnOne extends BaseEntity {
    id: number;
    user: User;
    userId: number;
    player1: Player;
    player1Id: number;
    player2: Player;
    player2Id: number;
    score1: number;
    score2: number;
    addedAt: 'timestamp';
    is_comeback: boolean;
    total_overtimes: number;
}
