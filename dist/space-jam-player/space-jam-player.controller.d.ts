import { SpaceJamPlayerService } from './space-jam-player.service';
import { ListSpaceJamPlayerDto } from './dto/list-player-dto';
import { User } from '../user/user.entity';
export declare class SpaceJamPlayerController {
    private playerService;
    constructor(playerService: SpaceJamPlayerService);
    listPlayers(filterDto: ListSpaceJamPlayerDto, user: User): Promise<{
        total: number;
        data: {
            team: string;
            nickname: string;
            name: string;
            picture: string;
            description: string;
        }[];
    }>;
}
