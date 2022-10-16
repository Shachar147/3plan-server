import { BaseEntity } from 'typeorm';
import { TeamDivision } from './team-division.enum';
import { TeamConference } from './team-conference.enum';
import { Player } from '../player/player.entity';
import { Random } from '../records/random/random.entity';
import { Tournament } from '../records/tournament/tournament.entity';
export declare class Team extends BaseEntity {
    id: number;
    name: string;
    logo: string;
    division: TeamDivision;
    conference: TeamConference;
    players: Player[];
    lastSyncAt: Date;
    randomHomeEntities: Random[];
    randomAwayEntities: Random[];
    allstar_players: Player[];
    wonTournaments: Tournament[];
    _2k_rating: number;
    last2KSyncAt: Date;
}
