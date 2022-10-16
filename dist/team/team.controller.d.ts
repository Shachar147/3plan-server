import { ListTeamsDto } from './dto/list-teams-dto';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team-dto';
import { UpdateTeamDto } from './dto/update-team-dto';
import { Team } from './team.entity';
import { DeleteResult } from 'typeorm';
export declare class TeamController {
    private teamService;
    constructor(teamService: TeamService);
    getTeams(filterDto: ListTeamsDto): Promise<{
        total: number;
        data: Team[];
    }>;
    getTeam(id: any): Promise<Team>;
    createTeam(createTeamDto: CreateTeamDto): Promise<Team>;
    upsertTeam(createTeamDto: CreateTeamDto): Promise<Team>;
    syncTeams(filterDto: ListTeamsDto): Promise<{
        total: any;
        total_errors: number;
        errors: any[];
    }>;
    syncTeamsRatings(filterDto: ListTeamsDto): Promise<{
        total: number;
        total_errors: number;
        errors: any[];
    }>;
    syncTeam(filterDto: ListTeamsDto, id: any): Promise<Team>;
    updateTeam(id: any, updateTeamDto: UpdateTeamDto): Promise<Team>;
    deleteTeam(id: any): Promise<DeleteResult>;
}
