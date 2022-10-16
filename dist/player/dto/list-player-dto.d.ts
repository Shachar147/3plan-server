import { PlayerPosition } from '../player-position.enum';
export declare class ListPlayerDto {
    search: string;
    name: string;
    names: string;
    position: PlayerPosition;
    height_feet: number;
    height_inch: number;
    height_meters: number;
    weight_pounds: number;
    weight_kgs: number;
    jersey: number;
    debut_year: number;
    _2k_rating: number;
    id: number;
    include_inactive: boolean;
    isActive: boolean;
    date_of_birth: string;
    college_name: string;
    country: string;
    draft_round: number;
    draft_pick: number;
}
