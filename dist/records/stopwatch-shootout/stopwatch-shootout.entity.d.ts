import { BaseEntity } from 'typeorm';
import { User } from '../../user/user.entity';
import { Player } from '../../player/player.entity';
export declare class StopwatchShootout extends BaseEntity {
    id: number;
    user: User;
    userId: number;
    player: Player;
    playerId: number;
    roundLength: number;
    score: number;
    addedAt: 'timestamp';
}
