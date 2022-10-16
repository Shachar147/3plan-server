import { TeamDivision } from '../team-division.enum';
import { TeamConference } from '../team-conference.enum';
export declare class UpdateTeamDto {
    name: string;
    logo: string;
    division: TeamDivision;
    conference: TeamConference;
    _2k_rating: number;
}
