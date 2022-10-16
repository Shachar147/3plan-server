import { Repository } from 'typeorm';
import { CreateTeamDto } from './dto/create-team-dto';
import { UpdateTeamDto } from './dto/update-team-dto';
import { ListTeamsDto } from './dto/list-teams-dto';
import { Team } from './team.entity';
export declare class TeamRepository extends Repository<Team> {
    private logger;
    createTeam(createTeamDto: CreateTeamDto): Promise<Team>;
    upsertTeam(createTeamDto: CreateTeamDto): Promise<Team>;
    updateTeam(updateTeamDto: UpdateTeamDto, team: Team): Promise<Team>;
    getTeams(filterDto: ListTeamsDto): Promise<Team[]>;
    syncTeamsRatings(teams: any): Promise<{
        total: number;
        total_errors: number;
        errors: any[];
    }>;
    _getTeamByName(name: any): Promise<Team>;
}
