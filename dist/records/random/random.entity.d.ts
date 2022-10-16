import { BaseEntity } from 'typeorm';
import { User } from '../../user/user.entity';
import { Player } from '../../player/player.entity';
import { Team } from '../../team/team.entity';
export declare class Random extends BaseEntity {
    id: number;
    user: User;
    userId: number;
    team1: Team;
    team1Id: number;
    team2: Team;
    team2Id: number;
    score1: number;
    score2: number;
    addedAt: 'timestamp';
    mvp_player: Player;
    mvpPlayerId: number;
    is_comeback: boolean;
    total_overtimes: number;
}
