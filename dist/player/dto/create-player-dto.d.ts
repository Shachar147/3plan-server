import { PlayerPosition } from '../player-position.enum';
export declare class CreatePlayerDto {
    name: string;
    picture: string;
    position: PlayerPosition;
    height_feet: number;
    height_inches: number;
    height_meters: number;
    weight_pounds: number;
    weight_kgs: number;
    jersey: number;
    debut_year: number;
    _2k_rating: number;
    team_name: string;
    isActive: boolean;
    date_of_birth: string;
    college_name: string;
    country: string;
    draft_round: number;
    draft_pick: number;
    allstar_team_name: string;
}
