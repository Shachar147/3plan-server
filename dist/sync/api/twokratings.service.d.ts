import { HttpService } from '@nestjs/common';
export declare class TwoKRatingsService {
    private readonly http;
    constructor(http: HttpService);
    getTeamPlayers2KRatings(team: any): Promise<{}>;
}
