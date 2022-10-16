import { TeamDivision } from '../team-division.enum';
import { TeamConference } from '../team-conference.enum';
export declare class CreateTeamDto {
    name: string;
    logo: string;
    division: TeamDivision;
    conference: TeamConference;
    _2k_rating: number;
}
