export declare type TournamentGame = {
    player1: string;
    player2: string;
    score1: number;
    score2: number;
    total_overtimes: number;
    mvp_player: string;
    is_comeback: boolean;
    winner: string;
};
export declare function validateTournamentType(obj: any): string;
