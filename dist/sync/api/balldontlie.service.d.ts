import { HttpService } from '@nestjs/common';
import { Player } from '../../player/player.entity';
export declare class BallDontLieService {
    private readonly http;
    constructor(http: HttpService);
    getTeams(): Promise<any>;
    getPlayers(): Promise<any[]>;
    _collectPlayers(response: any): Player[];
}
