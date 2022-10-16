import { BaseEntity } from 'typeorm';
import { User } from '../../user/user.entity';
import { Player } from '../../player/player.entity';
export declare class ThreePointsContest extends BaseEntity {
    id: number;
    user: User;
    userId: number;
    team1: Player[];
    team2: Player[];
    roundLength: number;
    computerLevel: string;
    computers: string[];
    randoms: string[];
    leaderboard: object;
    scoresHistory: object;
    addedAt: 'timestamp';
    winner: Player;
    winnerId: number;
}
