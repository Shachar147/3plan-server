import { TournamentGame } from '../tournament.game.type';
export declare class CreateDto {
    addedAt: 'timestamp';
    winner: string;
    teams: string[];
    gamesHistory: TournamentGame[];
    mvpPlayer: string;
}
