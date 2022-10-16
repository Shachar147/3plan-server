import { ListSpaceJamPlayerDto } from './dto/list-player-dto';
export declare class SpaceJamPlayerService {
    private logger;
    constructor();
    searchPlayer(name: string): Promise<{
        team: string;
        nickname: string;
        name: string;
        picture: string;
        description: string;
    }>;
    listPlayers(filterDto: ListSpaceJamPlayerDto): Promise<{
        team: string;
        nickname: string;
        name: string;
        picture: string;
        description: string;
    }[]>;
}
