import { TeamConference } from '../team-conference.enum';
import { TeamDivision } from '../team-division.enum';
export declare class ListTeamsDto {
    search: string;
    name: string;
    conference: TeamConference;
    division: TeamDivision;
    id: number;
    _2k_rating: number;
}
