import { ListTeamsDto } from './dto/list-teams-dto';
import { CreateTeamDto } from './dto/create-team-dto';
import { UpdateTeamDto } from './dto/update-team-dto';
import { TeamRepository } from './team.repository';
import { SyncService } from '../sync/sync.service';
export declare class TeamService {
    private teamRepository;
    private syncService;
    private logger;
    constructor(teamRepository: TeamRepository, syncService: SyncService);
    getTeams(filterDto: ListTeamsDto): Promise<import("./team.entity").Team[]>;
    getTeam(id: number): Promise<import("./team.entity").Team>;
    getTeamByNameFull(name: string): Promise<import("./team.entity").Team>;
    getTeamByName(name: string): Promise<import("./team.entity").Team>;
    createTeam(createTeamDto: CreateTeamDto): Promise<import("./team.entity").Team>;
    upsertTeam(createTeamDto: CreateTeamDto): Promise<import("./team.entity").Team>;
    syncTeam(filterDto: ListTeamsDto, id: number): Promise<import("./team.entity").Team>;
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
    updateTeam(id: number, updateTeamDto: UpdateTeamDto): Promise<import("./team.entity").Team>;
    deleteTeam(id: number): Promise<import("typeorm").DeleteResult>;
}
