import { BaseEntity } from 'typeorm';
import { User } from '../../user/user.entity';
import { Team } from '../../team/team.entity';
import { Player } from '../../player/player.entity';
export declare class Tournament extends BaseEntity {
    id: number;
    user: User;
    userId: number;
    addedAt: 'timestamp';
    winner: Team;
    winnerId: number;
    teams: Team[];
    gamesHistory: object;
    numberOfTeams: number;
    mvpPlayer: Player;
    mvpPlayerId: number;
}
